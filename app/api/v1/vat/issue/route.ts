import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, validateBody, success, ApiError } from "@/lib/api-utils";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const DraftInput = z.object({ orderId: z.string().min(1).max(128) });

/** Prepare a real linked invoice draft. ETA acceptance is supplied only by the compliance bridge. */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:create");
  const { orderId } = validateBody(DraftInput, await request.json());
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "tenantId" = ${auth.tenantId} FOR UPDATE`;
    const order = await tx.order.findFirst({ where: { id: orderId, tenantId: auth.tenantId, deletedAt: null } });
    if (!order) throw new ApiError("Order not found", 404);
    const existing = await tx.invoice.findFirst({ where: { orderId, tenantId: auth.tenantId, deletedAt: null } });
    if (existing) throw new ApiError("This order already has an invoice", 409);
    if (!["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"].includes(order.status)) throw new ApiError("A confirmed order is required to prepare an invoice", 409);
    const invoice = await tx.invoice.create({ data: {
      invoiceNumber: `VAT-${randomUUID()}`, orderId, hotelId: order.hotelId, supplierId: order.supplierId, tenantId: auth.tenantId,
      subtotal: order.subtotal, vatAmount: order.vatAmount, total: order.total, currency: order.currency,
      status: "DRAFT", paymentStatus: "UNPAID", etaStatus: "PENDING", issueDate: new Date(),
    } });
    await appendAuditEntry({ tenantId: auth.tenantId, entityName: "INVOICE", entityId: invoice.id, actorId: auth.userId, actorRole: auth.platformRole, actionType: "CREATE", changes: { event: "INVOICE_DRAFT_PREPARED", orderId, status: "DRAFT", etaStatus: "PENDING" } }, tx);
    return invoice;
  });
  return success({ invoiceId: result.id, invoiceRef: result.invoiceNumber, subtotal: Number(result.subtotal), vatAmount: Number(result.vatAmount), total: Number(result.total), status: "DRAFT", etaStatus: "PENDING", message: "Invoice draft prepared from the order. It has not been issued or accepted by ETA." }, 201);
});
