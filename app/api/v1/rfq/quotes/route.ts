import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiRoute, authenticate, audit, error, requirePermission, success } from "@/lib/api-utils";

const QuoteSchema = z.object({
  rfqId: z.string().cuid(),
  unitPrice: z.number().finite().positive(),
  quantity: z.number().int().positive(),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  deliveryFee: z.number().finite().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().trim().max(2_000).optional(),
});

const publicQuote = (quote: {
  id: string;
  unitPrice: unknown;
  quantity: number;
  currency: string;
  leadTimeDays: number | null;
  deliveryFee: unknown;
  validUntil: Date | null;
  notes: string | null;
  status: string;
  submittedAt: Date;
}) => ({
  id: quote.id,
  unitPrice: Number(quote.unitPrice),
  quantity: quote.quantity,
  currency: quote.currency,
  leadTimeDays: quote.leadTimeDays,
  deliveryFee: quote.deliveryFee == null ? null : Number(quote.deliveryFee),
  validUntil: quote.validUntil,
  notes: quote.notes,
  status: quote.status,
  submittedAt: quote.submittedAt,
  supplierIdentity: "hidden_until_order_execution",
});

/** Supplier response boundary. The supplier must be the server-matched RFQ recipient. */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:respond");
  if (auth.platformRole !== "SUPPLIER" && auth.platformRole !== "ADMIN") return error("Only a supplier can respond to an RFQ", 403);

  const parsed = QuoteSchema.safeParse(await request.json());
  if (!parsed.success) return error("Validation failed", 400, parsed.error.flatten());
  const data = parsed.data;

  const supplierUser = await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null, status: "ACTIVE" },
    select: { supplierId: true },
  });
  const supplierId = supplierUser?.supplierId;
  if (!supplierId && auth.platformRole !== "ADMIN") return error("Supplier account is not linked", 403);

  const rfq = await prisma.rfqRequest.findFirst({
    where: { id: data.rfqId, deletedAt: null, status: { in: ["PENDING", "QUOTED"] } },
    select: { id: true, tenantId: true, buyerId: true, productId: true, supplierId: true, requestedQty: true, status: true },
  });
  if (!rfq) return error("RFQ not found or no longer open", 404);

  if (supplierId) {
    const productMatch = rfq.productId
      ? await prisma.product.findFirst({ where: { id: rfq.productId, supplierId, deletedAt: null }, select: { id: true } })
      : null;
    if (rfq.supplierId !== supplierId && !productMatch) return error("This RFQ is not assigned to your supplier account", 403);
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, status: "ACTIVE", deletedAt: null }, select: { id: true } });
    if (!supplier) return error("Supplier is not active", 403);
  }
  if (data.quantity !== rfq.requestedQty) return error("Quote quantity must match the requested quantity", 400);

  const duplicate = supplierId ? await prisma.procurementQuote.findFirst({
    where: { rfqId: rfq.id, supplierId, status: { in: ["SUBMITTED", "ACCEPTED"] }, deletedAt: null },
    select: { id: true },
  }) : null;
  if (duplicate) return error("This supplier has already responded to the RFQ", 409);

  if (!supplierId) return error("An assigned supplier is required", 400);
  const quote = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "RfqRequest" WHERE "id" = ${rfq.id} AND "tenantId" = ${rfq.tenantId} FOR UPDATE`;
    const existing = await tx.procurementQuote.findFirst({
      where: { rfqId: rfq.id, supplierId, status: { in: ["SUBMITTED", "ACCEPTED"] }, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ApiError("This supplier has already responded to the RFQ", 409);
    const created = await tx.procurementQuote.create({
      data: {
        rfqId: rfq.id,
        tenantId: rfq.tenantId,
        supplierId,
        buyerId: rfq.buyerId,
        unitPrice: data.unitPrice,
        quantity: data.quantity,
        currency: "EGP",
        leadTimeDays: data.leadTimeDays,
        deliveryFee: data.deliveryFee,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes,
        status: "SUBMITTED",
      },
    });
    await tx.rfqRequest.update({ where: { id: rfq.id }, data: { status: "QUOTED", matchingStatus: "QUOTED", supplierId: rfq.supplierId ?? supplierId } });
    return created;
  });

  await audit({
    entityName: "PROCUREMENT_QUOTE",
    entityId: quote.id,
    actionType: "CREATE",
    tenantId: rfq.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    changes: { rfqId: rfq.id, quantity: data.quantity, supplierIdentity: "internal_only" },
  });

  return success({ quote: publicQuote(quote) }, 201);
});

/** Buyer comparison feed. Supplier identity is deliberately omitted. */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:read");
  const rfqId = request.nextUrl.searchParams.get("rfqId");
  if (!rfqId) return error("rfqId is required", 400);
  const rfq = await prisma.rfqRequest.findFirst({ where: { id: rfqId, tenantId: auth.tenantId, buyerId: auth.userId, deletedAt: null }, select: { id: true } });
  if (!rfq) return error("RFQ not found", 404);
  const quotes = await prisma.procurementQuote.findMany({
    where: { rfqId, tenantId: auth.tenantId, deletedAt: null, status: { in: ["SUBMITTED", "ACCEPTED"] } },
    orderBy: [{ unitPrice: "asc" }, { leadTimeDays: "asc" }],
    select: { id: true, unitPrice: true, quantity: true, currency: true, leadTimeDays: true, deliveryFee: true, validUntil: true, notes: true, status: true, submittedAt: true },
  });
  return success({ rfqId, quotes: quotes.map(publicQuote), supplierIdentity: "hidden_until_order_execution" });
});
