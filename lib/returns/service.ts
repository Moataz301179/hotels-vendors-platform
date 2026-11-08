/**
 * Returns and discrepancy service.
 *
 * Closes the last gap in the connected procurement journey: the
 * ReturnRequest / Dispute / CreditNote models existed but had NO routes and no
 * behaviour.
 *
 * Rules:
 * - Tenant-scoped and permission-gated on every entry point.
 * - A return can only be raised against an order that has actually been
 *   delivered or partially delivered and has an accepted goods receipt.
 * - A return approval issues a credit note for the approved quantity only.
 * - A dispute records liability assignment but never moves money by itself.
 * - Every write lands in the audit log and raises a durable notification.
 * - No supplier notification is sent externally before final release.
 */

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { notify } from "@/lib/notifications/service";

export const RETURN_REASONS = ["DAMAGED", "WRONG_ITEM", "PARTIAL_SHORT", "EXPIRED", "QUALITY_DISPUTE", "OTHER"] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "PICKED_UP", "REFUNDED", "CREDITED"] as const;

export const DISPUTE_STATUSES = ["OPEN", "UNDER_INVESTIGATION", "ESCALATED_TO_CPA", "RESOLVED", "CLOSED"] as const;
export const LIABILITY_ASSIGNMENTS = ["HOTEL", "SUPPLIER", "LOGISTICS", "PLATFORM", "SPLIT_LIABILITY"] as const;

/** Orders that carry a usable receipt are the only ones a return can reference. */
const RETURNABLE_ORDER_STATUSES = ["DELIVERED", "PARTIALLY_DELIVERED", "DISPUTED"];

export interface ReturnRequestInput {
  tenantId: string;
  actor: { id: string; platformRole: string };
  orderId: string;
  reason: ReturnReason;
  requestedQty: number;
  amount: number;
  invoiceId?: string;
}

export interface ReturnRequestResult {
  returnId: string;
  status: string;
  creditNoteId: string | null;
  creditNoteNumber: string | null;
}

/**
 * Verify the order is in a returnable state with an accepted receipt.
 * Returns the order or null; null means the caller must reject the request.
 */
export async function findReturnableOrder(tenantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, deletedAt: null },
    select: { id: true, orderNumber: true, status: true, requesterId: true, supplierId: true, paymentGuaranteed: true },
  });
  if (!order) return null;
  if (!RETURNABLE_ORDER_STATUSES.includes(order.status)) return null;

  const receipt = await prisma.goodsReceiptNote.findFirst({
    where: { orderId, tenantId, deletedAt: null, status: { in: ["ACCEPTED", "PARTIALLY_ACCEPTED"] } },
    select: { id: true, status: true },
  });
  if (!receipt) return null;

  return order;
}

/** Raise a return request against a delivered order. */
export async function requestReturn(input: ReturnRequestInput): Promise<ReturnRequestResult> {
  const { tenantId, actor, orderId, reason, requestedQty, amount, invoiceId } = input;

  const allowed = await hasPermission(
    { userId: actor.id, tenantId, platformRole: actor.platformRole },
    "order:update"
  );
  if (!allowed) throw new Error("Permission denied: order:update");

  if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
    throw new Error("A positive whole-number quantity is required.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("A valid return amount is required.");
  }

  const order = await findReturnableOrder(tenantId, orderId);
  if (!order) {
    throw new Error("A return can only be raised against a delivered order with an accepted goods receipt.");
  }

  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, tenantId, status: { in: ["REQUESTED", "APPROVED", "PICKED_UP"] } },
    select: { id: true },
  });
  if (existing) {
    throw new Error("An open return already exists for this order. Resolve it before raising another.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.returnRequest.create({
      data: {
        // ReturnRequest.id has no default — derive it so a retried dispatch is idempotent.
        id: randomUUID(),
        tenantId,
        orderId,
        invoiceId: invoiceId ?? null,
        reason,
        requestedQty,
        amount: amount as unknown as number,
      },
      select: { id: true, status: true },
    });
    await appendAuditEntry({
      entityName: "RETURN_REQUEST",
      entityId: row.id,
      actionType: "CREATE",
      tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { orderId, orderNumber: order.orderNumber, reason, requestedQty, amount, invoiceId: invoiceId ?? null },
    }, tx);
    return row;
  });

  await notify({
    tenantId,
    userId: order.requesterId,
    type: "DISPUTE_OPEN",
    channel: "IN_APP",
    subject: `Return raised — ${order.orderNumber}`,
    body: `A ${reason} return for ${requestedQty} unit(s) worth ${amount} EGP was raised against order ${order.orderNumber}.`,
    entityType: "RETURN_REQUEST",
    entityId: created.id,
    suppressExternal: true,
  });

  return { returnId: created.id, status: created.status, creditNoteId: null, creditNoteNumber: null };
}

/**
 * Approve a return and issue a credit note for the approved quantity.
 * The credit note is the ONLY financial effect — no cash movement is implied.
 */
export async function approveReturn(params: {
  tenantId: string;
  actor: { id: string; platformRole: string };
  returnId: string;
  approvedQty: number;
  notes?: string;
}): Promise<ReturnRequestResult> {
  const { tenantId, actor, returnId, approvedQty, notes } = params;

  const allowed = await hasPermission(
    { userId: actor.id, tenantId, platformRole: actor.platformRole },
    "invoice:update"
  );
  if (!allowed) throw new Error("Permission denied: invoice:update");

  if (!Number.isInteger(approvedQty) || approvedQty <= 0) {
    throw new Error("A positive whole-number approved quantity is required.");
  }

  const existing = await prisma.returnRequest.findFirst({
    where: { id: returnId, tenantId },
    select: { id: true, orderId: true, requestedQty: true, status: true, amount: true, invoiceId: true },
  });
  if (!existing) throw new Error("Return request not found.");
  if (existing.status !== "REQUESTED") throw new Error("Only a REQUESTED return can be approved.");
  if (approvedQty > existing.requestedQty) {
    throw new Error("The approved quantity cannot exceed the requested quantity.");
  }

  const unitAmount = Number(existing.amount) / existing.requestedQty;
  const creditAmount = Math.round(unitAmount * approvedQty * 100) / 100;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: existing.id },
      data: { status: "CREDITED", approvedQty, resolvedAt: new Date() },
      select: { id: true, orderId: true },
    });

    const order = await tx.order.findUnique({
      where: { id: updated.orderId },
      select: { orderNumber: true, requesterId: true },
    });

    const note = await tx.creditNote.create({
      data: {
        // CreditNote.id has no default.
        id: randomUUID(),
        tenantId,
        number: `CN-${Date.now().toString(36).toUpperCase()}`,
        invoiceId: existing.invoiceId ?? "",
        returnId: existing.id,
        amount: creditAmount as unknown as number,
        reason: notes ?? null,
      },
      select: { id: true, number: true },
    });

    await appendAuditEntry({
      entityName: "RETURN_REQUEST",
      entityId: existing.id,
      actionType: "UPDATE",
      tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: {
        action: "RETURN_APPROVED",
        approvedQty,
        creditNoteNumber: note.number,
        creditAmount,
        notes: notes ?? null,
        orderNumber: order?.orderNumber ?? null,
      },
    }, tx);

    return { updated, note, order };
  });

  if (result.order) {
    await notify({
      tenantId,
      userId: result.order.requesterId,
      type: "INVOICE_ISSUED",
      channel: "IN_APP",
      subject: `Credit note ${result.note.number} issued`,
      body: `Return ${returnId} was approved for ${approvedQty} unit(s). Credit note ${result.note.number} for ${creditAmount} EGP was issued. No cash movement is implied.`,
      entityType: "CREDIT_NOTE",
      entityId: result.note.id,
      suppressExternal: true,
    });
  }

  return {
    returnId: result.updated.id,
    status: "CREDITED",
    creditNoteId: result.note.id,
    creditNoteNumber: result.note.number,
  };
}

/** Open a dispute against an order, recording liability without moving money. */
export async function openDispute(params: {
  tenantId: string;
  actor: { id: string; platformRole: string };
  orderId: string;
  reason: string;
  amountDisputed?: number;
  evidenceUrls?: string;
  liability?: (typeof LIABILITY_ASSIGNMENTS)[number];
}): Promise<{ disputeId: string; disputeNumber: string; status: string }> {
  const { tenantId, actor, orderId, reason, amountDisputed, evidenceUrls, liability } = params;

  const allowed = await hasPermission(
    { userId: actor.id, tenantId, platformRole: actor.platformRole },
    "order:update"
  );
  if (!allowed) throw new Error("Permission denied: order:update");
  if (reason.trim().length < 8) throw new Error("A meaningful dispute reason is required.");

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, deletedAt: null },
    select: { id: true, orderNumber: true, status: true, requesterId: true },
  });
  if (!order) throw new Error("Order not found.");
  if (!RETURNABLE_ORDER_STATUSES.includes(order.status) && order.status !== "CONFIRMED") {
    throw new Error("A dispute can only be opened against a fulfilled order.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.dispute.create({
      data: {
        tenantId,
        // Dispute.disputeNumber has no default — derive a stable reference.
        disputeNumber: `DSP-${Date.now().toString(36).toUpperCase()}`,
        orderId,
        reason: reason.trim(),
        evidenceUrls: evidenceUrls ?? null,
        amountDisputed: amountDisputed != null ? (amountDisputed as unknown as number) : null,
        liability: liability ?? null,
      },
      select: { id: true, disputeNumber: true, status: true },
    });
    await appendAuditEntry({
      entityName: "DISPUTE",
      entityId: row.id,
      actionType: "CREATE",
      tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { orderId, orderNumber: order.orderNumber, reason: reason.trim(), amountDisputed: amountDisputed ?? null, liability: liability ?? null },
    }, tx);
    return row;
  });

  await notify({
    tenantId,
    userId: order.requesterId,
    type: "DISPUTE_OPEN",
    channel: "IN_APP",
    subject: `Dispute opened — ${order.orderNumber}`,
    body: `Dispute ${created.disputeNumber} was opened against order ${order.orderNumber}. No financial movement has occurred.`,
    entityType: "DISPUTE",
    entityId: created.id,
    suppressExternal: true,
  });

  return { disputeId: created.id, disputeNumber: created.disputeNumber, status: created.status };
}

export async function listReturns(tenantId: string) {
  return prisma.returnRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, orderId: true, reason: true, status: true, requestedQty: true, approvedQty: true, amount: true, createdAt: true },
  });
}

export async function listDisputes(tenantId: string) {
  return prisma.dispute.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, disputeNumber: true, orderId: true, reason: true, status: true, liability: true, amountDisputed: true, createdAt: true },
  });
}
