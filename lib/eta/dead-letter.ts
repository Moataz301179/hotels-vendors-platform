/**
 * ETA Dead-Letter Queue
 * Hotels Vendors Compliance Layer
 *
 * Dedicated dead-letter management for failed ETA invoice submissions.
 * Extends the generic BullMQ DLQ (lib/queues/dead-letter.ts) with:
 *   - Exponential backoff retries (5min → 30min → 2hr → 12hr)
 *   - Prisma-backed DeadLetterJob records for admin visibility
 *   - Tenant-scoped stats queries
 *
 * ⚠️  This is NOT a financial spread or lending facility. It is a
 *     compliance retry mechanism for ETA document submissions.
 */

import { Queue, Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getRedisConnection } from "@/lib/queues/connection";
import { etaClient } from "./client";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";

// ── Constants ──

const ETA_DLQ_NAME = "eta-dead-letter";
const MAX_ATTEMPTS = 4;

/** Exponential backoff intervals in milliseconds */
const BACKOFF_INTERVALS = [
  5 * 60 * 1000,       // 5 minutes
  30 * 60 * 1000,      // 30 minutes
  2 * 60 * 60 * 1000,  // 2 hours
  12 * 60 * 60 * 1000, // 12 hours
];

// ── Queue ──

export const etaDlqQueue = new Queue(ETA_DLQ_NAME, {
  connection: getRedisConnection(),
});

// ── Types ──

export interface EtaDeadLetterPayload {
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  error: string;
  attemptCount: number;
  etaUuid?: string;
  submissionPayload?: string;
}

// ── Add to Dead Letter ──

/**
 * Store a failed ETA submission in the dead-letter queue.
 * Creates a Prisma record for admin visibility and a BullMQ job
 * for scheduled retry.
 */
export async function addToDeadLetter(
  invoiceId: string,
  error: string
): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      tenantId: true,
      etaUuid: true,
      submissionLog: true,
    },
  });

  if (!invoice) {
    throw new Error(`Cannot add to DLQ: invoice ${invoiceId} not found`);
  }

  // Create Prisma record for admin UI
  const entry = await prisma.etaDeadLetterJob.create({
    data: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: invoice.tenantId,
      error,
      attemptCount: 0,
      maxAttempts: MAX_ATTEMPTS,
      nextRetryAt: new Date(Date.now() + BACKOFF_INTERVALS[0]),
      status: "PENDING",
    },
  });

  // Enqueue BullMQ job with first backoff delay
  const payload: EtaDeadLetterPayload = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    tenantId: invoice.tenantId,
    error,
    attemptCount: 0,
    etaUuid: invoice.etaUuid ?? undefined,
    submissionPayload: invoice.submissionLog ?? undefined,
  };

  await etaDlqQueue.add("retry-eta-submission", payload, {
    jobId: `eta-dlq-${entry.id}`,
    delay: BACKOFF_INTERVALS[0],
    attempts: 1,
    removeOnComplete: false,
    removeOnFail: false,
  });

  await recordSwarmEvent("eta_dlq_added", "ERROR", {
    entryId: entry.id,
    invoiceId,
    tenantId: invoice.tenantId,
    error,
    nextRetryAt: entry.nextRetryAt.toISOString(),
  });

  return entry.id;
}

// ── Retry from Dead Letter ──

/**
 * Attempt to resubmit a dead-lettered invoice.
 * Bumps the attempt counter and schedules the next retry
 * with exponential backoff.
 */
export async function retryDeadLetter(id: string): Promise<{
  success: boolean;
  nextRetryAt?: Date;
  message: string;
}> {
  const entry = await prisma.etaDeadLetterJob.findUnique({
    where: { id },
    include: { invoice: true },
  });

  if (!entry) {
    throw new Error(`Dead-letter entry ${id} not found`);
  }

  if (entry.status === "RESOLVED") {
    return { success: true, message: "Already resolved" };
  }

  const nextAttempt = entry.attemptCount + 1;

  if (nextAttempt > entry.maxAttempts) {
    // Max retries exceeded — mark as FAILED
    await prisma.etaDeadLetterJob.update({
      where: { id },
      data: { status: "FAILED" },
    });

    await recordSwarmEvent("eta_dlq_max_retries", "ERROR", {
      entryId: id,
      invoiceId: entry.invoiceId,
      attempts: nextAttempt,
    });

    return {
      success: false,
      message: `Max retries (${entry.maxAttempts}) exceeded. Manual resolution required.`,
    };
  }

  // Try resubmission
  try {
    // Re-invoke the ETA submission via the client
    // This requires the full payload to be reconstructed from the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: entry.invoiceId },
      include: {
        hotel: true,
        supplier: true,
        order: { include: { items: { include: { product: true } } } },
      },
    });

    if (!invoice || !invoice.order) {
      throw new Error("Invoice or order not found for retry");
    }

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

    const result = await etaClient.submitInvoice(payload as unknown as import("@/lib/eta/types").EtaInvoicePayload);

    // Success — mark as RESOLVED
    await prisma.etaDeadLetterJob.update({
      where: { id },
      data: {
        status: "RESOLVED",
        attemptCount: nextAttempt,
      },
    });

    // Update the invoice
    await prisma.invoice.update({
      where: { id: entry.invoiceId },
      data: {
        etaUuid: result.uuid,
        etaStatus: "SUBMITTING",
        status: "SUBMITTED",
        submissionLog: JSON.stringify({
          retries: nextAttempt,
          lastRetryAt: new Date().toISOString(),
          result,
        }),
      },
    });

    const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
    await appendAuditEntry({
      entityName: "INVOICE",
      entityId: entry.invoiceId,
      actionType: "UPDATE",
      tenantId: entry.tenantId,
      actorId: "system",
      actorRole: "SYSTEM",
      changes: { etaUuid: result.uuid, retryAttempt: nextAttempt },
    });

    await recordSwarmEvent("eta_dlq_retry_success", "INFO", {
      entryId: id,
      invoiceId: entry.invoiceId,
      attempt: nextAttempt,
      etaUuid: result.uuid,
    });

    return {
      success: true,
      message: `Retry #${nextAttempt} succeeded. ETA UUID: ${result.uuid}`,
    };
  } catch (retryError) {
    const retryMsg = retryError instanceof Error ? retryError.message : "Unknown retry error";
    const nextRetryIdx = Math.min(nextAttempt, BACKOFF_INTERVALS.length - 1);
    const nextRetryAt = new Date(Date.now() + BACKOFF_INTERVALS[nextRetryIdx]);

    // Update the entry with new attempt count
    await prisma.etaDeadLetterJob.update({
      where: { id },
      data: {
        status: nextAttempt >= entry.maxAttempts ? "FAILED" : "RETRYING",
        attemptCount: nextAttempt,
        error: retryMsg,
        nextRetryAt,
      },
    });

    // Schedule next BullMQ retry
    if (nextAttempt < entry.maxAttempts) {
      await etaDlqQueue.add("retry-eta-submission", {
        ...entry,
        error: retryMsg,
        attemptCount: nextAttempt,
      } satisfies EtaDeadLetterPayload, {
        jobId: `eta-dlq-${id}-${nextAttempt}`,
        delay: BACKOFF_INTERVALS[nextRetryIdx],
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      });
    }

    await recordSwarmEvent("eta_dlq_retry_failed", "ERROR", {
      entryId: id,
      invoiceId: entry.invoiceId,
      attempt: nextAttempt,
      error: retryMsg,
      nextRetryAt: nextRetryAt.toISOString(),
    });

    return {
      success: false,
      nextRetryAt,
      message: `Retry #${nextAttempt} failed: ${retryMsg}. Next retry at ${nextRetryAt.toISOString()}`,
    };
  }
}

// ── Stats ──

export interface DeadLetterStats {
  total: number;
  pending: number;
  retrying: number;
  resolved: number;
  failed: number;
}

/**
 * Get dead-letter queue statistics for a tenant.
 */
export async function getDeadLetterStats(
  tenantId: string
): Promise<DeadLetterStats> {
  const [total, pending, retrying, resolved, failed] = await Promise.all([
    prisma.etaDeadLetterJob.count({ where: { tenantId } }),
    prisma.etaDeadLetterJob.count({ where: { tenantId, status: "PENDING" } }),
    prisma.etaDeadLetterJob.count({ where: { tenantId, status: "RETRYING" } }),
    prisma.etaDeadLetterJob.count({ where: { tenantId, status: "RESOLVED" } }),
    prisma.etaDeadLetterJob.count({ where: { tenantId, status: "FAILED" } }),
  ]);

  return { total, pending, retrying, resolved, failed };
}

/**
 * List dead-letter entries for a tenant with pagination.
 */
export async function listDeadLetterEntries(
  tenantId: string,
  options: { status?: string; limit?: number; offset?: number } = {}
) {
  const { status, limit = 50, offset = 0 } = options;

  const where = {
    tenantId,
    ...(status ? { status: status as "PENDING" | "RETRYING" | "RESOLVED" | "FAILED" } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.etaDeadLetterJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        invoiceId: true,
        invoiceNumber: true,
        error: true,
        attemptCount: true,
        maxAttempts: true,
        nextRetryAt: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.etaDeadLetterJob.count({ where }),
  ]);

  return { entries, total, limit, offset };
}

// ── Worker ──

/**
 * Create the BullMQ worker that processes ETA DLQ retry jobs.
 */
export function createEtaDlqWorker(): Worker {
  return new Worker<EtaDeadLetterPayload>(
    ETA_DLQ_NAME,
    async (job) => {
      const { invoiceId } = job.data;

      const entry = await prisma.etaDeadLetterJob.findFirst({
        where: { invoiceId, status: { not: "RESOLVED" } },
        orderBy: { createdAt: "desc" },
      });

      if (!entry) {
        return { skipped: true, reason: "No pending DLQ entry found" };
      }

      const result = await retryDeadLetter(entry.id);
      return result;
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
      limiter: { max: 5, duration: 60_000 },
    }
  );
}
