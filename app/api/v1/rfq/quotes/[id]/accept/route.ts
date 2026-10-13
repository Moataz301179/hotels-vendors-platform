import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import { checkCreditLimit } from "@/lib/credit-gate";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { apiRoute, authenticate, completeIdempotency, error, requireIdempotencyKey, requirePermission, success } from "@/lib/api-utils";

const AcceptSchema = z.object({
  deliveryDate: z.string().datetime().optional(),
  deliveryInstructions: z.string().trim().max(2_000).optional(),
  poNumber: z.string().trim().min(1).max(64).optional(),
  costCenter: z.string().trim().max(64).optional(),
});

/** Accept one real supplier quote and create a server-priced purchase order. */
export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:accept");
  const resolved = await params;
  if (!resolved?.id) return error("Missing quote id", 400);
  const parsed = AcceptSchema.safeParse(await request.json());
  if (!parsed.success) return error("Validation failed", 400, parsed.error.flatten());
  const data = parsed.data;

  const buyer = await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, role: true, hotelId: true },
  });
  const hotelId = buyer?.hotelId;
  if (!hotelId) return error("Buyer is not linked to a hotel", 403);

  const quote = await prisma.procurementQuote.findFirst({
    where: { id: resolved.id, tenantId: auth.tenantId, buyerId: auth.userId, deletedAt: null, status: "SUBMITTED" },
    include: { rfq: true },
  });
  if (!quote) return error("Quote not found or no longer available", 404);
  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) return error("Quote has expired", 409);
  if (!quote.rfq.productId) return error("This response still requires product mapping before it can become a purchase order", 422);

  const product = await prisma.product.findFirst({
    where: { id: quote.rfq.productId, supplierId: quote.supplierId, status: "ACTIVE", deletedAt: null, pricingMode: { in: ["FIXED", "HYBRID"] } },
    select: { id: true, supplierId: true, minOrderQty: true, stockQuantity: true, unitOfMeasure: true },
  });
  if (!product) return error("The quoted product is no longer available", 409);
  if (quote.quantity < product.minOrderQty || quote.quantity > product.stockQuantity) return error("Quoted quantity is outside available supplier quantity", 409);

  const subtotal = Math.round((Number(quote.unitPrice) * quote.quantity + Number(quote.deliveryFee ?? 0)) * 100) / 100;
  const vatAmount = Math.round(subtotal * 0.14 * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  const idempotencyKey = await requireIdempotencyKey(request, { userId: auth.userId, action: "ACCEPT_RFQ_QUOTE", amount: total });
  const creditCheck = await checkCreditLimit(hotelId, total);
  if (!creditCheck.allowed) {
    await completeIdempotency(idempotencyKey, "CREDIT_DENIED");
    return error(`Order rejected: ${creditCheck.reason}`, 402);
  }

  const orderNumber = data.poNumber || `PO-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const order = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Hotel" WHERE "id" = ${hotelId} AND "tenantId" = ${auth.tenantId} FOR UPDATE`;
    const lockedHotel = await tx.hotel.findFirst({ where: { id: hotelId, tenantId: auth.tenantId }, select: { creditLimit: true, creditUsed: true } });
    if (!lockedHotel) throw new Error("Hotel not found");
    if (Number(lockedHotel.creditUsed ?? 0) + total > Number(lockedHotel.creditLimit ?? 0)) throw new Error("Credit limit exceeded during order creation");

    const created = await tx.order.create({
      data: {
        orderNumber,
        poNumber: orderNumber,
        tenantId: auth.tenantId,
        hotelId,
        supplierId: quote.supplierId,
        requesterId: auth.userId,
        subtotal,
        vatAmount,
        total,
        currency: quote.currency,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : quote.leadTimeDays != null ? new Date(Date.now() + quote.leadTimeDays * 86_400_000) : null,
        deliveryInstructions: data.deliveryInstructions,
        costCenter: data.costCenter,
        status: "DRAFT",
        items: { create: [{ productId: product.id, quantity: quote.quantity, unitPrice: quote.unitPrice, total: Number(quote.unitPrice) * quote.quantity }] },
      },
      include: { items: true },
    });
    await tx.hotel.update({ where: { id: hotelId }, data: { creditUsed: { increment: total } } });
    const accepted = await tx.procurementQuote.updateMany({ where: { id: quote.id, status: "SUBMITTED" }, data: { status: "ACCEPTED" } });
    if (accepted.count !== 1) throw new Error("Quote was accepted by another request");
    await tx.rfqRequest.update({ where: { id: quote.rfqId }, data: { status: "CONVERTED_TO_ORDER", matchingStatus: "CONVERTED_TO_ORDER" } });
    await appendAuditEntry({ tenantId: auth.tenantId, entityName: "ORDER", entityId: created.id, actionType: "CREATE_FROM_RFQ", actorId: auth.userId, actorRole: auth.platformRole, changes: { before: { quoteId: quote.id, rfqId: quote.rfqId }, after: { orderNumber, status: "DRAFT", paymentGuaranteed: false, supplierIdentity: "hidden_until_execution" } } }, tx);
    await appendAuditEntry({ tenantId: auth.tenantId, entityName: "PROCUREMENT_QUOTE", entityId: quote.id, actionType: "ACCEPT", actorId: auth.userId, actorRole: auth.platformRole, changes: { orderId: created.id, status: "ACCEPTED" } }, tx);
    return created;
  });

  const evaluation = await evaluateAuthority(order.id, {
    userId: auth.userId,
    userRole: buyer.role,
    tenantId: auth.tenantId,
    ipAddress: request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  });
  const finalStatus = evaluation.action === "AUTO_APPROVE" && evaluation.canProceed ? "APPROVED" : "PENDING_APPROVAL";
  await prisma.order.update({ where: { id: order.id, tenantId: auth.tenantId }, data: { status: finalStatus } });
  await appendAuditEntry({ tenantId: auth.tenantId, entityName: "ORDER", entityId: order.id, actionType: "AUTHORITY_EVALUATED", actorId: auth.userId, actorRole: auth.platformRole, changes: { before: { status: "DRAFT" }, after: { status: finalStatus, action: evaluation.action, canProceed: evaluation.canProceed } } });
  await completeIdempotency(idempotencyKey, order.id);

  return success({ orderId: order.id, orderNumber, status: finalStatus, quoteId: quote.id, poLockState: "AWAITING_APPROVAL_AND_PAYMENT_GUARANTEE", evaluation });
});
