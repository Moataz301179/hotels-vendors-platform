import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { baselineCostBreakdown, normalizedItemKey } from "@/lib/procurement/pre-spend";
import { apiRoute, authenticate, completeIdempotency, error, requireIdempotencyKey, requirePermission, success } from "@/lib/api-utils";

const BaselineSchema = z.object({
  productId: z.string().cuid(),
  rateQuantity: z.number().int().positive().max(1_000_000),
  unitPrice: z.number().finite().nonnegative(),
  deliveryFee: z.number().finite().nonnegative().optional(),
  taxAmount: z.number().finite().nonnegative().optional(),
  packDescription: z.string().trim().min(1).max(200).optional(),
  minimumOrderQty: z.number().int().positive().max(1_000_000).optional(),
  deliveryTerms: z.string().trim().min(1).max(1_000).optional(),
  sourceReference: z.string().trim().min(3).max(500),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  approvalOwnerId: z.string().cuid().optional(),
}).superRefine((value, ctx) => {
  if (value.validFrom && value.validUntil && new Date(value.validUntil) < new Date(value.validFrom)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "validUntil must be after validFrom" });
  }
});

function assertHotelProcurementRole(platformRole: string) {
  if (platformRole !== "HOTEL" && platformRole !== "ADMIN") {
    throw new Error("Only hotel procurement users can access contract baselines");
  }
}

function publicBaseline(baseline: {
  id: string;
  hotelId: string;
  productId: string;
  itemName: string;
  normalizedItemKey: string;
  unitOfMeasure: string;
  packDescription: string | null;
  rateQuantity: number;
  unitPrice: unknown;
  deliveryFee: unknown;
  taxAmount: unknown;
  currency: string;
  minimumOrderQty: number | null;
  deliveryTerms: string | null;
  sourceReference: string;
  validFrom: Date | null;
  validUntil: Date | null;
  status: string;
  createdAt: Date;
}) {
  const unitPrice = Number(baseline.unitPrice);
  const deliveryFee = baseline.deliveryFee == null ? null : Number(baseline.deliveryFee);
  const taxAmount = baseline.taxAmount == null ? null : Number(baseline.taxAmount);
  return {
    id: baseline.id,
    hotelId: baseline.hotelId,
    productId: baseline.productId,
    itemName: baseline.itemName,
    normalizedItemKey: baseline.normalizedItemKey,
    unitOfMeasure: baseline.unitOfMeasure,
    packDescription: baseline.packDescription,
    rateQuantity: baseline.rateQuantity,
    unitPrice,
    deliveryFee,
    taxAmount,
    currency: baseline.currency,
    minimumOrderQty: baseline.minimumOrderQty,
    deliveryTerms: baseline.deliveryTerms,
    sourceReference: baseline.sourceReference,
    validFrom: baseline.validFrom,
    validUntil: baseline.validUntil,
    status: baseline.status,
    cost: baselineCostBreakdown({ unitPrice, rateQuantity: baseline.rateQuantity, requestedQuantity: baseline.rateQuantity, deliveryFee, taxAmount }),
    createdAt: baseline.createdAt,
  };
}

/** Hotel-only current contract/rate records for pre-spend comparison. */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:create");
  try {
    assertHotelProcurementRole(auth.platformRole);
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Forbidden", 403);
  }

  const parsed = BaselineSchema.safeParse(await request.json());
  if (!parsed.success) return error("Validation failed", 400, parsed.error.flatten());
  const data = parsed.data;

  const buyer = await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null, status: "ACTIVE" },
    select: { hotelId: true },
  });
  if (!buyer?.hotelId) return error("Buyer is not linked to a hotel", 403);
  const hotelId = buyer.hotelId;

  const product = await prisma.product.findFirst({
    where: {
      id: data.productId,
      deletedAt: null,
      status: "ACTIVE",
      source: { not: "FIXTURE" },
      supplier: { is: { status: "ACTIVE", isVerified: true, deletedAt: null } },
    },
    select: { id: true, name: true, supplierId: true, unitOfMeasure: true },
  });
  if (!product) return error("A verified active supplier product is required", 422);

  const idempotencyKey = await requireIdempotencyKey(request, {
    userId: auth.userId,
    action: "CREATE_CONTRACT_RATE_BASELINE",
    amount: data.unitPrice * data.rateQuantity,
  });
  const itemKey = normalizedItemKey(product.name, product.unitOfMeasure || "unit");
  const baseline = await prisma.$transaction(async (tx) => {
    const created = await tx.contractRateBaseline.create({
      data: {
        tenantId: auth.tenantId,
        hotelId,
        supplierId: product.supplierId,
        productId: product.id,
        itemName: product.name,
        normalizedItemKey: itemKey,
        unitOfMeasure: product.unitOfMeasure || "unit",
        packDescription: data.packDescription,
        rateQuantity: data.rateQuantity,
        unitPrice: data.unitPrice,
        deliveryFee: data.deliveryFee,
        taxAmount: data.taxAmount,
        minimumOrderQty: data.minimumOrderQty,
        deliveryTerms: data.deliveryTerms,
        sourceReference: data.sourceReference,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: "ACTIVE",
        createdById: auth.userId,
        approvalOwnerId: data.approvalOwnerId,
      },
    });
    await appendAuditEntry({
      tenantId: auth.tenantId,
      entityName: "CONTRACT_RATE_BASELINE",
      entityId: created.id,
      actionType: "CREATE",
      actorId: auth.userId,
      actorRole: auth.platformRole,
      changes: {
        after: {
          hotelId: buyer.hotelId,
          productId: product.id,
          rateQuantity: data.rateQuantity,
          costCompleteness: data.deliveryFee != null && data.taxAmount != null ? "COMPLETE" : "INCOMPLETE",
          sourceReference: data.sourceReference,
        },
      },
    }, tx);
    return created;
  });
  await completeIdempotency(idempotencyKey, baseline.id);

  return success({ baseline: publicBaseline(baseline) }, 201);
});

/** List only the authenticated hotel's confidential current contract baselines. */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:read");
  try {
    assertHotelProcurementRole(auth.platformRole);
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Forbidden", 403);
  }
  const buyer = await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null, status: "ACTIVE" },
    select: { hotelId: true },
  });
  if (!buyer?.hotelId) return error("Buyer is not linked to a hotel", 403);

  const baselines = await prisma.contractRateBaseline.findMany({
    where: { tenantId: auth.tenantId, hotelId: buyer.hotelId, deletedAt: null, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return success({ baselines: baselines.map(publicBaseline) });
});
