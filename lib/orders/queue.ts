/**
 * Order Processing Queue
 * Hotels Vendors Operations Layer
 *
 * Background jobs for order lifecycle events:
 * - Payment guarantee verification
 * - Authority matrix evaluation
 * - Order confirmation to supplier
 * - Status transition automation
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queues/connection";
import { prisma } from "@/lib/prisma";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import type { UserRole } from "@prisma/client";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";
import { orderApprovedTemplate } from "@/lib/notifications/email";
import { addEmailJob } from "@/lib/notifications/queue";
import { linkProcurementAudit, type ProvenanceClassification } from "@/lib/audit/procurement-audit-link";

// ── Queue ──
export const orderQueue = new Queue("order-processing", {
  connection: getRedisConnection(),
});

// ── Types ──
export interface OrderJobPayload {
  orderId: string;
  tenantId: string;
  userId: string;
  action: "EVALUATE_AUTHORITY" | "CONFIRM_ORDER" | "PAYMENT_GUARANTEE" | "NOTIFY_SUPPLIER";
  metadata?: Record<string, unknown>;
}

// ── Add Job ──
export async function addOrderJob(
  payload: OrderJobPayload,
  options: { delay?: number } = {}
): Promise<Job> {
  return orderQueue.add(payload.action, payload, {
    delay: options.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

// ── Worker ──
export function createOrderWorker(): Worker {
  return new Worker<OrderJobPayload>(
    "order-processing",
    async (job) => {
      const { orderId, tenantId, userId, action, metadata } = job.data;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } }, hotel: true, supplier: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      switch (action) {
        case "EVALUATE_AUTHORITY": {
          const result = await evaluateAuthority(orderId, {
            userId,
            userRole: ((metadata?.userRole as string) || "HOTEL_MANAGER") as UserRole,
            tenantId,
          });

          if (result.action === "AUTO_APPROVE") {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "APPROVED" },
            });
          }

          await recordSwarmEvent("order_authority_evaluated", "INFO", {
            jobId: job.id,
            orderId,
            action: result.action,
          });

          // Audit and provenance link for authority evaluation
          const auditAuthority = await prisma.auditLog.create({
            data: {
              entityName: "ORDER",
              entityId: order.id,
              actionType: "UPDATE",
              tenantId,
              actorId: userId,
              actorRole: (metadata?.userRole as string) || "HOTEL_MANAGER",
              changes: { status: result.action === "AUTO_APPROVE" ? "APPROVED" : order.status, action: "EVALUATE_AUTHORITY", ruleResult: result.action, jobId: job.id },
            },
          });
          await linkProcurementAudit(auditAuthority.id, "VALIDATED" as ProvenanceClassification, "orders-evaluate-authority", {
            orderId: order.id,
            approvalId: null,
          }).catch((err) => console.error("Audit provenance link failed:", err));

          return { action: result.action };
        }

        case "CONFIRM_ORDER": {
          if (order.status !== "APPROVED") {
            throw new Error(`Cannot confirm order in status ${order.status}`);
          }
          if (!order.paymentGuaranteed) {
            throw new Error("Payment guarantee required before confirmation");
          }

          await prisma.order.update({
            where: { id: orderId },
            data: { status: "CONFIRMED" },
          });

          // Notify requester
          if (order.hotel?.email) {
            const template = orderApprovedTemplate({
              requesterName: order.hotel.name,
              orderId: order.orderNumber || orderId,
              approverName: "Authority Matrix",
              total: Number(order.total || 0),
              currency: "EGP",
            });
            await addEmailJob({
              to: [order.hotel.email],
              ...template,
              metadata: { tenantId, entityType: "ORDER", entityId: orderId },
            });
          }

          await recordSwarmEvent("order_confirmed", "INFO", { jobId: job.id, orderId });

          // Create audit entry and link provenance chain
          const auditResult = await prisma.auditLog.create({
            data: {
              entityName: "ORDER",
              entityId: order.id,
              actionType: "UPDATE",
              tenantId,
              actorId: userId,
              actorRole: (metadata?.userRole as string) || "HOTEL_MANAGER",
              changes: { status: "CONFIRMED", action: "CONFIRM_ORDER", jobId: job.id },
            },
          });
          await linkProcurementAudit(auditResult.id, "VALIDATED" as ProvenanceClassification, "orders-confirm-order", {
            orderId: order.id,
            approvalId: null,
          }).catch((err) => console.error("Audit provenance link failed:", err));

          return { confirmed: true };
        }

        case "PAYMENT_GUARANTEE": {
          const hasGuarantee = order.paymentGuaranteed || false;

          if (!hasGuarantee) {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "PENDING_APPROVAL", paymentGuaranteed: false },
            });
            throw new Error("Payment guarantee not available — order held for approval");
          }

          await recordSwarmEvent("order_payment_guaranteed", "INFO", { jobId: job.id, orderId });

          // Audit and provenance link for payment guarantee verification
          const auditGuarantee = await prisma.auditLog.create({
            data: {
              entityName: "ORDER",
              entityId: order.id,
              actionType: "UPDATE",
              tenantId,
              actorId: userId,
              actorRole: (metadata?.userRole as string) || "HOTEL_MANAGER",
              changes: { paymentGuaranteed: true, status: "PENDING_APPROVAL", action: "PAYMENT_GUARANTEE", jobId: job.id },
            },
          });
          await linkProcurementAudit(auditGuarantee.id, "VALIDATED" as ProvenanceClassification, "orders-payment-guarantee", {
            orderId: order.id,
            approvalId: null,
          }).catch((err) => console.error("Audit provenance link failed:", err));

          return { guaranteed: true };
        }

        case "NOTIFY_SUPPLIER": {
          // In production: send email/WhatsApp to supplier
          // For now: log notification intent
          await recordSwarmEvent("order_supplier_notified", "INFO", { jobId: job.id, orderId });

          // Audit and provenance link for supplier notification
          const auditNotify = await prisma.auditLog.create({
            data: {
              entityName: "ORDER",
              entityId: order.id,
              actionType: "UPDATE",
              tenantId,
              actorId: userId,
              actorRole: (metadata?.userRole as string) || "HOTEL_MANAGER",
              changes: { status: order.status, action: "NOTIFY_SUPPLIER", supplierNotified: true, jobId: job.id },
            },
          });
          await linkProcurementAudit(auditNotify.id, "VALIDATED" as ProvenanceClassification, "orders-notify-supplier", {
            orderId: order.id,
            approvalId: null,
          }).catch((err) => console.error("Audit provenance link failed:", err));

          return { notified: true };
        }

        default:
          throw new Error(`Unknown order action: ${action}`);
      }
    },
    { connection: getRedisConnection(), concurrency: 3 }
  );
}
