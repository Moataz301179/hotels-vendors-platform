/**
 * RFQ API — hotel sourcing request intake.
 *
 * A request may start from:
 *   - an active, verified supplier offer;
 *   - a platform market reference with no onboarded supplier; or
 *   - a free-text requirement when the catalogue has no matching item.
 *
 * Supplier identity is resolved on the server and is never accepted from or
 * returned to the hotel client at the request stage. The matching event is a
 * hook for the sourcing/quote workers; a request is not treated as a quote or
 * an order until a real supplier response is received.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { RfqStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { apiRoute, authenticate, error, requirePermission, success } from "@/lib/api-utils";
import { swarm } from "@/lib/agents/swarm-orchestrator";

const OptionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const CreateRfqSchema = z.object({
  /** A tenant-owned current contract/rate baseline; it is resolved server-side. */
  baselineId: z.string().trim().min(1).optional(),
  /** Supplier Product id. Never required for a market reference or free text. */
  productId: z.string().trim().min(1).optional(),
  /** Platform catalogue reference id. It is not a supplier id. */
  catalogItemId: z.string().trim().min(1).optional(),
  /** Used when the requested item is not in the catalogue. */
  itemName: OptionalText(200),
  requestedQty: z.number().int().min(1).max(1_000_000),
  unitOfMeasure: OptionalText(50),
  deliveryTimeline: OptionalText(120),
  deliveryLocation: OptionalText(200),
  targetPrice: z.number().finite().min(0).optional(),
  specialReq: OptionalText(1_000),
  notes: OptionalText(2_000),
}).superRefine((value, ctx) => {
  if (!value.baselineId && !value.productId && !value.catalogItemId && !value.itemName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["itemName"],
      message: "Choose a catalogue item or describe what you need",
    });
  }
  if (value.productId && value.catalogItemId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["catalogItemId"],
      message: "Use either a supplier offer or a market reference, not both",
    });
  }
  if (value.baselineId && (value.productId || value.catalogItemId || value.itemName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baselineId"],
      message: "A contract baseline supplies the item definition; do not mix it with catalogue or free-text inputs",
    });
  }
});

type CreateRfqInput = z.infer<typeof CreateRfqSchema>;

type ActiveSupplierProduct = {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  unitPrice: unknown;
  basePrice: unknown;
  pricingMode: string;
  rfqThresholdQty: number | null;
};

/**
 * Public marketplace offer lookup. Supplier identity is intentionally only
 * used internally by the matcher. The product must be active, non-fixture and
 * backed by an active verified supplier before it can start an RFQ.
 */
async function findPublicSupplierProduct(productId: string): Promise<ActiveSupplierProduct | null> {
  return prisma.product.findFirst({
    where: {
      id: productId,
      status: "ACTIVE",
      source: { not: "FIXTURE" },
      deletedAt: null,
      supplier: { is: { status: "ACTIVE", isVerified: true, deletedAt: null } },
    },
    select: {
      id: true,
      name: true,
      category: true,
      supplierId: true,
      unitPrice: true,
      basePrice: true,
      pricingMode: true,
      rfqThresholdQty: true,
    },
  }) as Promise<ActiveSupplierProduct | null>;
}

async function findPublicCatalogItem(catalogItemId: string) {
  const publicTenantId = process.env.PUBLIC_CATALOG_TENANT_ID?.trim();
  if (!publicTenantId) return null;
  return prisma.catalogItem.findFirst({
    where: {
      id: catalogItemId,
      tenantId: publicTenantId,
      deletedAt: null,
      status: { in: ["PENDING_REVIEW", "ACTIVE"] },
    },
    select: { id: true, name: true, category: true, unitOfMeasure: true },
  });
}

/**
 * Pricing mode is evaluated from server-side evidence. A client cannot turn
 * an RFQ into a fixed order by submitting a price.
 */
export async function evaluatePricingMode(productId: string, quantity: number, _tenantId: string) {
  void _tenantId;
  const product = await findPublicSupplierProduct(productId);
  if (!product) throw new Error("Product not found");

  if (product.pricingMode === "RFQ" || product.unitPrice == null) {
    return { mode: "RFQ" as const, reason: "RFQ-required product" };
  }

  if (product.pricingMode === "HYBRID" && product.rfqThresholdQty && quantity >= product.rfqThresholdQty) {
    return { mode: "RFQ" as const, reason: `Quantity ${quantity} reaches the supplier quote threshold` };
  }

  return {
    mode: "FIXED" as const,
    unitPrice: Number(product.unitPrice ?? product.basePrice ?? 0),
  };
}

function publicRequest(rfq: {
  id: string;
  status: string;
  matchingStatus: string;
  requestedQty: number;
  unitOfMeasure: string | null;
  itemName: string | null;
  baselineId: string | null;
  normalizedItemKey: string | null;
  packDescription: string | null;
  deliveryTimeline: string | null;
  deliveryLocation: string | null;
  estimatedResponse: string | null;
  createdAt: Date;
}) {
  return {
    id: rfq.id,
    status: rfq.status,
    matchingStatus: rfq.matchingStatus,
    itemName: rfq.itemName,
    baselineId: rfq.baselineId,
    normalizedItemKey: rfq.normalizedItemKey,
    packDescription: rfq.packDescription,
    requestedQty: rfq.requestedQty,
    unitOfMeasure: rfq.unitOfMeasure,
    deliveryTimeline: rfq.deliveryTimeline,
    deliveryLocation: rfq.deliveryLocation,
    estimatedResponse: rfq.estimatedResponse,
    createdAt: rfq.createdAt,
    supplierIdentity: "hidden_until_permitted_stage",
  };
}

/** POST /api/v1/rfq — create a hotel sourcing request. */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:create");

  const parsed = CreateRfqSchema.safeParse(await request.json());
  if (!parsed.success) {
    return error("Validation failed", 400, parsed.error.flatten());
  }
  const data: CreateRfqInput = parsed.data;

  const buyer = data.baselineId ? await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null, status: "ACTIVE" },
    select: { hotelId: true },
  }) : null;
  if (data.baselineId && !buyer?.hotelId) return error("Buyer is not linked to a hotel", 403);
  const baseline = data.baselineId ? await prisma.contractRateBaseline.findFirst({
    where: {
      id: data.baselineId,
      tenantId: auth.tenantId,
      hotelId: buyer!.hotelId!,
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    },
    select: {
      id: true,
      productId: true,
      itemName: true,
      unitOfMeasure: true,
      normalizedItemKey: true,
      packDescription: true,
    },
  }) : null;
  if (data.baselineId && !baseline) return error("Contract baseline is unavailable or expired", 404);

  const product = data.productId ? await findPublicSupplierProduct(data.productId) : null;
  if (data.productId && !product) {
    return error("This supplier offer is no longer available", 404);
  }

  const catalogItem = data.catalogItemId ? await findPublicCatalogItem(data.catalogItemId) : null;
  if (data.catalogItemId && !catalogItem) {
    return error("This market reference is no longer available", 404);
  }

  // A free-text request is intentionally allowed. It is the fallback when the
  // catalogue has no product record and is the least-friction sourcing path.
  // Server evidence wins over browser-supplied labels whenever a catalogue
  // record was selected. The free-text value is used only for request-anything.
  const resolvedName = baseline?.itemName ?? product?.name ?? catalogItem?.name ?? data.itemName ?? null;
  if (!resolvedName) return error("Describe the item you need", 400);

  if (product && !baseline) {
    const pricing = await evaluatePricingMode(product.id, data.requestedQty, auth.tenantId);
    if (pricing.mode !== "RFQ") {
      return error("This product has a fixed supplier price; use checkout instead.", 400);
    }
  }

  const rfq = await prisma.$transaction(async (tx) => {
    const created = await tx.rfqRequest.create({
      data: {
      buyerId: auth.userId,
      productId: baseline?.productId ?? product?.id ?? null,
      catalogItemId: catalogItem?.id ?? null,
      baselineId: baseline?.id ?? null,
      itemName: resolvedName,
      unitOfMeasure: baseline?.unitOfMeasure ?? data.unitOfMeasure ?? catalogItem?.unitOfMeasure ?? null,
      normalizedItemKey: baseline?.normalizedItemKey ?? null,
      packDescription: baseline?.packDescription ?? null,
      deliveryLocation: data.deliveryLocation ?? null,
      // Supplier identity is resolved by the matcher. It must not be accepted
      // from the browser, and remains null until a real quote is returned.
      supplierId: null,
      requestedQty: data.requestedQty,
      targetPrice: data.targetPrice,
      deliveryTimeline: data.deliveryTimeline,
      specialReq: data.specialReq,
      notes: data.notes,
      tenantId: auth.tenantId,
      // Do not promise a turnaround until a connected source actually
      // acknowledges the request.
      estimatedResponse: null,
      matchingStatus: "QUEUED",
      status: "PENDING",
      },
      select: {
      id: true,
      status: true,
      matchingStatus: true,
      requestedQty: true,
      unitOfMeasure: true,
      itemName: true,
      baselineId: true,
      normalizedItemKey: true,
      packDescription: true,
      deliveryTimeline: true,
      deliveryLocation: true,
      estimatedResponse: true,
      createdAt: true,
      },
    });
    await appendAuditEntry({
      tenantId: auth.tenantId,
      entityName: "RFQ",
      entityId: created.id,
      actionType: "CREATE",
      actorId: auth.userId,
      actorRole: auth.platformRole,
      changes: {
        after: {
          itemName: resolvedName,
          requestedQty: data.requestedQty,
          requestSource: baseline ? "CONTRACT_BASELINE" : product ? "VERIFIED_SUPPLIER_OFFER" : catalogItem ? "MARKET_REFERENCE" : "REQUEST_ANYTHING",
          baselineId: baseline?.id ?? null,
          supplierIdentity: "internal_matching_only",
        },
      },
    }, tx);
    return created;
  });

  // The event is the connection point for the matching/outreach workers. It
  // is intentionally non-blocking: creating a request must not wait on a
  // supplier portal, email, WhatsApp or marketplace connector.
  void swarm.dispatch("rfq.submitted", {
    tenantId: auth.tenantId,
    eventId: rfq.id,
    timestamp: new Date().toISOString(),
    payload: {
      rfqId: rfq.id,
      productId: baseline?.productId ?? product?.id ?? null,
      catalogItemId: catalogItem?.id ?? null,
      category: product?.category ?? catalogItem?.category ?? null,
      requestedQty: data.requestedQty,
      deliveryTimeline: data.deliveryTimeline ?? null,
      deliveryLocation: data.deliveryLocation ?? null,
    },
  }).catch((dispatchError) => {
    console.error("[RFQ] matching dispatch failed", dispatchError);
  });

  return success({
    rfq: publicRequest(rfq),
    message: "Request recorded. Review fixed commercial responses when they are submitted.",
    next: "No commercial conclusion is shown until a qualified supplier response is available.",
  }, 201);
});

/** GET /api/v1/rfq — buyer's own RFQ status feed. */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:read");

  const { searchParams } = new URL(request.url);
  const requestedStatus = searchParams.get("status");
  const status = requestedStatus && Object.values(RfqStatus).includes(requestedStatus as RfqStatus)
    ? (requestedStatus as RfqStatus)
    : undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const rfqs = await prisma.rfqRequest.findMany({
    where: {
      tenantId: auth.tenantId,
      buyerId: auth.userId,
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      matchingStatus: true,
      requestedQty: true,
      unitOfMeasure: true,
      itemName: true,
      baselineId: true,
      normalizedItemKey: true,
      packDescription: true,
      deliveryTimeline: true,
      deliveryLocation: true,
      estimatedResponse: true,
      createdAt: true,
    },
  });

  return success({
    rfqs: rfqs.map(publicRequest),
    supplierIdentity: "hidden_until_permitted_stage",
  });
});
