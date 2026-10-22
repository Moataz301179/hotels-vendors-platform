import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { appendNetworkTransactionEvent } from "@/lib/procurement/network-transaction-ledger";

const receivingRoles = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "RECEIVING_CLERK"];

/** Record a supplier invoice only after the governed order has been received. */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim() : "";
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const subtotal = Number(body?.subtotal);
  const vatAmount = Number(body?.vatAmount ?? 0);
  const total = Number(body?.total);
  if (!invoiceNumber || !orderId || !Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(vatAmount) || vatAmount < 0 || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "Invoice number, order, subtotal, VAT amount and total are required." }, { status: 400 });
  }
  // Never infer or invent tax: the submitted commercial values must reconcile exactly.
  if (Math.abs(total - (subtotal + vatAmount)) > 0.01) {
    return NextResponse.json({ error: "Invoice total must equal subtotal plus the explicitly supplied VAT amount." }, { status: 400 });
  }
  const order = await prisma.order.findFirst({
    where: actor.platformRole === "SUPPLIER"
      ? { id: orderId, supplierId: actor.supplierId ?? "", status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"] }, paymentGuaranteed: true, deletedAt: null }
      : { id: orderId, tenantId: actor.tenantId, status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"] }, paymentGuaranteed: true, deletedAt: null },
    select: { id: true, tenantId: true, hotelId: true, supplierId: true },
  });
  if (!order) return NextResponse.json({ error: "A confirmed, guaranteed order is required." }, { status: 409 });
  if (actor.platformRole !== "SUPPLIER" && actor.platformRole !== "ADMIN" && !receivingRoles.includes(actor.role)) {
    return NextResponse.json({ error: "INVOICE_ROLE_REQUIRED" }, { status: 403 });
  }
  try {
    const invoice = await prisma.$transaction(async (tx): Promise<any> => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          // ETA identity is written only by the official submission worker.
          // A client must never be able to self-declare a clearance UUID.
          status: "DRAFT",
          etaStatus: "PENDING",
          subtotal,
          vatAmount,
          total,
          netPayable: total,
          orderId: order.id,
          hotelId: order.hotelId,
          supplierId: order.supplierId,
          tenantId: order.tenantId,
        },
      });
      const auditLogId=await appendAuditEntry({
        entityName: "INVOICE",
        entityId: created.id,
        actionType: "SUBMITTED",
        tenantId: order.tenantId,
        actorId: actor.id,
        actorRole: actor.platformRole,
        changes: { orderId: order.id, invoiceNumber, subtotal, vatAmount, total, etaStatus: created.etaStatus },
      }, tx);
      await appendNetworkTransactionEvent(tx, {
        tenantId: order.tenantId, orderId: order.id, invoiceId: created.id,
        sourceEntityName: 'INVOICE', sourceEntityId: created.id, eventType: 'SUBMITTED',
        actorId: actor.id, actorRole: actor.platformRole, verificationMethod: 'INVOICE_SUBMISSION',
        payload: { invoiceNumber, subtotal, vatAmount, total, etaStatus: created.etaStatus }, auditLogId,
      });
      return created;
    });
    return NextResponse.json({ invoice, outcome: { invoice: "DRAFT", eta: invoice.etaStatus } }, { status: 201 });
  } catch (error: any) {
    console.error("[invoice] failed to record", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "Invoice number already exists." }, { status: 409 });
    return NextResponse.json({ error: "INVOICE_COULD_NOT_BE_RECORDED" }, { status: 500 });
  }
}
