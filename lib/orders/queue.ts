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
          return { guaranteed: true };
        }

        case "NOTIFY_SUPPLIER": {
          // In production: send email/WhatsApp to supplier
          // For now: log notification intent
          await recordSwarmEvent("order_supplier_notified", "INFO", { jobId: job.id, orderId });
          return { notified: true };
        }

        default:
          throw new Error(`Unknown order action: ${action}`);
      }
    },
    { connection: getRedisConnection(), concurrency: 3 }
  );
}
