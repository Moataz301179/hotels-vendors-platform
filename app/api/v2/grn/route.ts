import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { validateReceipt, type ReceiptLineInput } from "@/lib/logistics/grn-acceptance";

const receivingRoles = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "RECEIVING_CLERK"];

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!["HOTEL", "ADMIN"].includes(actor.platformRole) || (actor.platformRole !== "ADMIN" && !receivingRoles.includes(actor.role))) {
    return NextResponse.json({ error: "RECEIVING_ROLE_REQUIRED" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (typeof body?.orderId !== "string" || !Array.isArray(body?.lines)) {
    return NextResponse.json({ error: "Order ID and receipt lines are required." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serialize receipts for this order so simultaneous requests cannot over-receive.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${body.orderId}, 0))`;
      const order = await tx.order.findFirst({
        where: { id: body.orderId, tenantId: actor.tenantId, deletedAt: null },
        include: { items: { where: { deletedAt: null }, select: { id: true, productId: true, quantity: true } } },
      });
      if (!order) return { error: "ORDER_NOT_FOUND", status: 404 as const };
      if (!order.paymentGuaranteed || !["IN_TRANSIT", "PARTIALLY_DELIVERED"].includes(order.status)) {
        return { error: "ORDER_NOT_RECEIVABLE", status: 409 as const };
      }

      const priorRows = await tx.grnLineItem.findMany({
        where: { grn: { orderId: order.id, deletedAt: null } },
        select: { orderItemId: true, receivedQuantity: true },
      });
      const prior: Record<string, number> = {};
      for (const row of priorRows) prior[row.orderItemId] = (prior[row.orderItemId] || 0) + row.receivedQuantity;

      const checked = validateReceipt(order.items, prior, body.lines as ReceiptLineInput[]);
      if (!checked.ok) return { error: checked.error, status: 400 as const };

      const now = new Date();
      const grn = await tx.goodsReceiptNote.create({
        data: {
          grnNumber: `GRN-${now.getTime().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
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

      for (const line of checked.lines) {
        const cumulative = (prior[line.orderItemId] || 0) + line.receivedQuantity;
        await tx.orderItem.update({ where: { id: line.orderItemId }, data: { receivedQuantity: cumulative } });
      }
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: order.status, deletedAt: null },
        data: { status: checked.orderStatus },
      });
      if (changed.count !== 1) throw new Error("ORDER_CHANGED");
      await appendAuditEntry({
        entityName: "ORDER",
        entityId: order.id,
        actionType: "STATUS_CHANGED",
        tenantId: order.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: { from: order.status, to: checked.orderStatus, grnId: grn.id, grnNumber: grn.grnNumber, grnStatus: grn.status },
      }, tx);
      return { grn, orderStatus: checked.orderStatus };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "RECEIPT_COULD_NOT_BE_RECORDED" }, { status: 500 });
  }
}
