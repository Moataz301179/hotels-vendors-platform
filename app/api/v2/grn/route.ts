import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { appendNetworkTransactionEvent } from "@/lib/procurement/network-transaction-ledger";
import { validateReceipt, type ReceiptLineInput } from "@/lib/logistics/grn-acceptance";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";

const receivingRoles = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "RECEIVING_CLERK"];

function receiptEvidenceUrls(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8) return null;
  const urls = [...new Set(value)];
  if (!urls.every((url) => {
    if (typeof url !== "string" || url.length > 2000) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  })) return null;
  return urls as string[];
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!["HOTEL", "ADMIN"].includes(actor.platformRole) || (actor.platformRole !== "ADMIN" && !receivingRoles.includes(actor.role))) {
    return NextResponse.json({ error: "RECEIVING_ROLE_REQUIRED" }, { status: 403 });
  }
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:update");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "RECEIPT_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== "string" || !Array.isArray(body?.lines)) {
    return NextResponse.json({ error: "Order ID and receipt lines are required." }, { status: 400 });
  }
  const evidenceUrls = receiptEvidenceUrls(body.evidenceUrls);
  if (!evidenceUrls) return NextResponse.json({ error: "Receipt evidence must contain up to eight secure HTTPS URLs." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serialize receipts for this order so simultaneous requests cannot over-receive.
      // pg_advisory_xact_lock returns void; execute it as a command rather
      // than asking Prisma to deserialize a result row.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${body.orderId}, 0))`;
      const order = await tx.order.findFirst({
        where: { id: body.orderId, tenantId: actor.tenantId, deletedAt: null },
        include: { items: { where: { deletedAt: null }, select: { id: true, productId: true, quantity: true, receivedQuantity: true } } },
      });
      if (!order) return { error: "ORDER_NOT_FOUND", status: 404 as const };
      if (!order.paymentGuaranteed || !["IN_TRANSIT", "PARTIALLY_DELIVERED"].includes(order.status)) {
        return { error: "ORDER_NOT_RECEIVABLE", status: 409 as const };
      }

      const priorRows = await tx.grnLineItem.findMany({
        where: { grn: { orderId: order.id, deletedAt: null } },
        select: { orderItemId: true, acceptedQuantity: true },
      });
      const prior: Record<string, number> = {};
      for (const row of priorRows) prior[row.orderItemId] = (prior[row.orderItemId] || 0) + row.acceptedQuantity;
      for (const item of order.items) prior[item.id] = Math.max(prior[item.id] || 0, item.receivedQuantity || 0);

      const checked = validateReceipt(order.items, prior, body.lines as ReceiptLineInput[]);
      if (!checked.ok) return { error: checked.error, status: 400 as const };

      // A final receipt changes the commercial order to DELIVERED.  That
      // boundary must never be crossed on a self-declared or sandbox ETA value.
      // ETA acceptance and a real signature are both persisted evidence gates.
      if (checked.orderStatus === "DELIVERED") {
        const etaClearance = await tx.invoice.findFirst({
          where: {
            orderId: order.id,
            tenantId: order.tenantId,
            deletedAt: null,
            etaStatus: "ACCEPTED",
            etaUuid: { not: null },
            digitalSignature: { not: null },
          },
          select: { id: true },
        });
        if (!etaClearance) return { error: "ETA_CLEARANCE_REQUIRED_BEFORE_DELIVERY", status: 409 as const };
      }

      const now = new Date();
      const grn = await tx.goodsReceiptNote.create({
        data: {
          grnNumber: `GRN-${now.getTime().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          status: checked.grnStatus,
          orderId: order.id,
          hotelId: order.hotelId,
          supplierId: order.supplierId,
          tenantId: order.tenantId,
          receivedById: actor.id,
          receivedAt: now,
          inspectedAt: now,
          acceptedAt: checked.grnStatus === "REJECTED" ? null : now,
          lineItems: { create: checked.lines.map((line) => ({
            orderItemId: line.orderItemId,
            productId: line.productId,
            orderedQuantity: line.orderedQuantity,
            receivedQuantity: line.receivedQuantity,
            acceptedQuantity: line.acceptedQuantity,
            rejectedQuantity: line.rejectedQuantity,
            rejectionReason: line.rejectionReason,
            batchNumber: line.batchNumber || null,
            expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
            conditionNotes: line.conditionNotes || null,
          })) },
        },
        include: { lineItems: true },
      });
      const evidence = await Promise.all(evidenceUrls.map((sourceUrl) => tx.evidenceRecord.create({
        data: {
          tenantId: order.tenantId,
          entityId: grn.id,
          entityName: "GOODS_RECEIPT_NOTE",
          sourceUrl,
          sourceReference: "receipt-evidence",
          rawEvidenceHash: createHash("sha256").update(JSON.stringify({ grnId: grn.id, sourceUrl })).digest("hex"),
          extractedFact: JSON.stringify({ grnNumber: grn.grnNumber, kind: "RECEIPT_EVIDENCE" }),
          provenanceClass: "USER_PROVIDED",
          status: "EXTRACTED",
        },
      })));

      for (const line of checked.lines) {
        const cumulativeAccepted = (prior[line.orderItemId] || 0) + line.acceptedQuantity;
        await tx.orderItem.update({ where: { id: line.orderItemId }, data: { receivedQuantity: cumulativeAccepted } });
      }
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: order.status, deletedAt: null },
        data: { status: checked.orderStatus },
      });
      if (changed.count !== 1) throw new Error("ORDER_CHANGED");
      const grnAuditLogId=await appendAuditEntry({
        entityName: "GOODS_RECEIPT_NOTE",
        entityId: grn.id,
        actionType: "CREATED",
        tenantId: order.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: {
          orderId: order.id,
          grnNumber: grn.grnNumber,
          grnStatus: grn.status,
          lineItemCount: grn.lineItems.length,
          evidenceRecordIds: evidence.map((record) => record.id),
        },
      }, tx);
      await appendAuditEntry({
        entityName: "ORDER",
        entityId: order.id,
        actionType: "STATUS_CHANGED",
        tenantId: order.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: { from: order.status, to: checked.orderStatus, grnId: grn.id, grnNumber: grn.grnNumber, grnStatus: grn.status, evidenceRecordIds: evidence.map((record) => record.id) },
      }, tx);
      await appendNetworkTransactionEvent(tx, {
        tenantId: order.tenantId, orderId: order.id, sourceEntityName: 'GOODS_RECEIPT_NOTE', sourceEntityId: grn.id,
        eventType: 'CREATED', actorId: actor.id, actorRole: actor.platformRole,
        verificationMethod: 'CONTROLLED_RECEIPT',
        payload: { grnNumber: grn.grnNumber, grnStatus: grn.status, orderStatus: checked.orderStatus, lineItemCount: grn.lineItems.length, evidenceRecordIds: evidence.map((record) => record.id) },
        auditLogId: grnAuditLogId,
      });
      return { grn, orderStatus: checked.orderStatus };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "RECEIPT_COULD_NOT_BE_RECORDED" }, { status: 500 });
  }
}
