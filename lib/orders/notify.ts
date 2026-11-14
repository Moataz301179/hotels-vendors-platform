/**
 * Order lifecycle → unified notification.
 *
 * Called AFTER the status transaction commits, so a notification failure can
 * never roll back a commercial state change. Every notification is persisted
 * (durable) before any external delivery is attempted.
 *
 * Release gate: supplier-facing external delivery is suppressed until final
 * release. The hotel still receives an in-app record immediately.
 */

import { prisma } from "@/lib/prisma";
import { notify, type NotificationType } from "@/lib/notifications/service";

interface OrderTransition {
  orderId: string;
  tenantId: string;
  requesterId: string;
  supplierId: string;
  orderNumber: string;
  from: string;
  to: string;
  actorId: string;
  actorRole: string;
  /** Whether external (email/SMS/WhatsApp) delivery is permitted. */
  allowExternal: boolean;
}

const SUBJECTS: Record<string, string> = {
  APPROVED: "Order approved",
  CONFIRMED: "Order released to supplier",
  IN_TRANSIT: "Order dispatched",
  PARTIALLY_DELIVERED: "Order partially delivered",
  DELIVERED: "Order delivered",
  REJECTED: "Order rejected",
  DISPUTED: "Order disputed",
  CANCELLED: "Order cancelled",
};

const BODIES: Record<string, string> = {
  APPROVED: "passed the authority matrix and is approved.",
  CONFIRMED: "was released to the supplier for fulfilment.",
  IN_TRANSIT: "is in transit to your property.",
  PARTIALLY_DELIVERED: "was partially delivered. A goods receipt note records the accepted quantity.",
  DELIVERED: "was delivered and received.",
  REJECTED: "was rejected. Review the audit trail for the reason code.",
  DISPUTED: "was disputed. The commercial, logistics and financial states are now separate.",
  CANCELLED: "was cancelled.",
};

function notificationTypeFor(to: string): NotificationType {
  if (to === "DELIVERED" || to === "PARTIALLY_DELIVERED" || to === "IN_TRANSIT" || to === "CONFIRMED" || to === "APPROVED") return "ORDER_UPDATE";
  if (to === "DISPUTED") return "DISPUTE_OPEN";
  return "ORDER_UPDATE";
}

/**
 * Notify the hotel requester (in-app, always) and the supplier
 * (in-app only until final release — never external before release).
 */
export async function notifyOrderTransition(input: OrderTransition): Promise<void> {
  const { orderId, tenantId, requesterId, supplierId, orderNumber, from, to, actorId, actorRole, allowExternal } = input;
  const type = notificationTypeFor(to);
  const subject = `${SUBJECTS[to] ?? "Order update"} — ${orderNumber}`;
  const body = `Order ${orderNumber} ${BODIES[to] ?? "changed status."} (${from} → ${to})`;

  // Hotel requester: durable in-app record. Email + WhatsApp only when permitted.
  // Copy stays buyer-safe (order number + status); supplier identity is never added here.
  try {
    await notify({
      tenantId,
      userId: requesterId,
      type,
      channel: allowExternal ? "EMAIL" : "IN_APP",
      subject,
      body,
      entityType: "ORDER",
      entityId: orderId,
      suppressExternal: !allowExternal,
    });
  } catch (error) {
    console.error(`[notifications] hotel requester notification failed for order ${orderId}`, error);
  }

  if (allowExternal) {
    try {
      await notify({
        tenantId,
        userId: requesterId,
        type,
        channel: "WHATSAPP",
        subject,
        body,
        entityType: "ORDER",
        entityId: orderId,
        suppressExternal: false,
      });
    } catch (error) {
      console.error(`[notifications] hotel WhatsApp notification failed for order ${orderId}`, error);
    }
  }

  // Supplier: in-app only, external suppressed until final release.
  try {
    const supplierUsers = await prisma.user.findMany({
      where: { tenantId, supplierId, deletedAt: null },
      select: { id: true },
      take: 20,
    });
    for (const user of supplierUsers) {
      await notify({
        tenantId,
        userId: user.id,
        type,
        channel: "IN_APP",
        subject,
        body,
        entityType: "ORDER",
        entityId: orderId,
        suppressExternal: true,
      });
    }
  } catch (error) {
    console.error(`[notifications] supplier notification failed for order ${orderId}`, error);
  }

  // Audit the notification attempt — the actor is the transition actor.
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        entityId: orderId,
        entityName: "ORDER",
        actorId,
        actorRole,
        actionType: "UPDATE",
        changes: { from, to, notificationType: type, externalAllowed: allowExternal, supplierExternal: false },
      },
    });
  } catch (error) {
    console.error(`[notifications] audit entry failed for order ${orderId}`, error);
  }
}
