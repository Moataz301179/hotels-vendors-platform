/**
 * ETA Submission Queue
 * Hotels Vendors Compliance Layer
 *
 * ⚠️ COMPLIANCE WARNING: This queue processes SIMULATED ETA submissions.
 * Submissions go to the ETA sandbox/preprod endpoint. UUIDs are fake.
 * Do NOT treat queue results as proof of real ETA compliance.
 *
 * Moves ETA e-invoicing submission out of HTTP handlers into
 * background workers with retry, DLQ, and audit logging.
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queues/connection";
import { prisma } from "@/lib/prisma";
import { etaClient } from "./client";
import { validateForSubmission } from "./validator";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";
import { moveToDeadLetter } from "@/lib/queues/dead-letter";

// ── Queue ──
export const etaQueue = new Queue("eta-submission", {
  connection: getRedisConnection(),
});

export const etaDeadLetterQueue = new Queue("eta-dead-letter", {
  connection: getRedisConnection(),
});

// ── Types ──
export interface EtaJobPayload {
  invoiceId: string;
  tenantId: string;
  userId: string;
  platformRole: string;
  attempt?: number;
}

// ── Add Job ──
export async function addEtaSubmissionJob(
  payload: EtaJobPayload,
  options: { delay?: number } = {}
): Promise<Job> {
  return etaQueue.add("submit-invoice", payload, {
    delay: options.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false,
  });
}

// ── Worker ──
export function createEtaWorker(): Worker {
  const worker = new Worker<EtaJobPayload>(
    "eta-submission",
    async (job) => {
      const { invoiceId, tenantId, userId, platformRole } = job.data;

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { etaStatus: "SUBMITTING" },
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          hotel: true,
          supplier: true,
          order: { include: { items: { include: { product: true } } } },
        },
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Validate
      const validation = await validateForSubmission(invoiceId);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.message}`);
      }

      // Build payload
      const payload = {
        issuer: {
          type: "B" as const,
          id: invoice.supplier.taxId,
          name: invoice.supplier.name,
          address: {
            country: "EG",
            governate: invoice.supplier.governorate,
            regionCity: invoice.supplier.city,
            street: invoice.supplier.address || "Unknown",
            buildingNumber: "1",
          },
        },
        receiver: {
          type: "B" as const,
          id: invoice.hotel.taxId,
          name: invoice.hotel.name,
          address: {
            country: "EG",
            governate: invoice.hotel.governorate,
            regionCity: invoice.hotel.city,
            street: invoice.hotel.address || "Unknown",
            buildingNumber: "1",
          },
        },
        documentType: "I" as const,
        documentTypeVersion: "1.0" as const,
        dateIssued: invoice.issueDate.toISOString(),
        internalId: invoice.invoiceNumber,
        purchaseOrderReference: invoice.order.orderNumber,
        payment: { terms: "Net 30" },
        delivery: { approach: "By Truck", terms: "DAP" },
        invoiceLines: invoice.order.items.map((item) => ({
          description: item.product.name,
          itemType: "EGS" as const,
          itemCode: item.product.sku,
          unitType: item.product.unitOfMeasure,
          quantity: item.quantity,
          internalCode: item.product.sku,
          salesTotal: item.total,
          total: item.total,
          valueDifference: 0,
          totalTaxableFees: 0,
          netTotal: Number(item.total || 0),
          itemsDiscount: 0,
          discount: { amount: 0 },
          taxableItems: [
            { taxType: "T1" as const, amount: Number(item.total || 0) * 0.14, subType: "V001", rate: 14 },
          ],
        })),
        totalSalesAmount: invoice.subtotal,
        netAmount: invoice.subtotal,
        taxTotals: [{ taxType: "T1" as const, amount: invoice.vatAmount }],
        totalAmount: Number(invoice.total ?? 0),
      };

      // Submit to ETA
      const result = await etaClient.submitInvoice(payload as unknown as import("@/lib/eta/types").EtaInvoicePayload);

      // Update invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          etaUuid: result.uuid,
          etaStatus: "ACCEPTED",
          submissionLog: JSON.stringify({ submissions: [result] }),
          status: "SUBMITTED",
        },
      });

      // Audit (tamper-proof chain)
      const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
      await appendAuditEntry({
        tenantId,
        entityName: "INVOICE",
        entityId: invoiceId,
        actionType: "UPDATE",
        actorId: userId,
        actorRole: platformRole,
        changes: { etaUuid: result.uuid, status: "ACCEPTED" },
      });

      await recordSwarmEvent("eta_submitted", "INFO", {
        jobId: job.id,
        invoiceId,
        tenantId,
        etaUuid: result.uuid,
      });

      return { success: true, etaUuid: result.uuid };
    },
    { connection: getRedisConnection(), concurrency: 2 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    await moveToDeadLetter("eta-submission", job, err.message);
    await recordSwarmEvent("eta_dlq_moved", "ERROR", {
      jobId: job.id,
      invoiceId: job.data.invoiceId,
      tenantId: job.data.tenantId,
      reason: err.message,
    });
  });

  return worker;
}

// ── Dead Letter Handler ──
export function createEtaDeadLetterWorker(): Worker {
  return new Worker<EtaJobPayload>(
    "eta-dead-letter",
    async (job) => {
      const { invoiceId, tenantId } = job.data;

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { etaStatus: "MANUAL_RESOLUTION" },
      });

      const { appendAuditEntry: appendAuditEntryDlq } = await import("@/lib/audit/tamper-proof");
      await appendAuditEntryDlq({
        tenantId,
        entityName: "INVOICE",
        entityId: invoiceId,
        actionType: "UPDATE",
        actorId: "system",
        actorRole: "SYSTEM",
        changes: { error: job.failedReason, attempts: job.attemptsMade },
      });

      await recordSwarmEvent("eta_dlq", "ERROR", {
        jobId: job.id,
        invoiceId,
        tenantId,
        reason: job.failedReason,
      });

      return { deadLettered: true };
    },
    { connection: getRedisConnection(), concurrency: 1 }
  );
}
