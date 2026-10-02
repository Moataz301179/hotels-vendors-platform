/**
 * RFQ API — Hybrid Pricing: FIXED checkout vs RFQ submission
 * HotelsVendors Platform
 *
 * POST /api/v1/rfq  — Submit RFQ
 * GET  /api/v1/rfq  — List RFQs (filter by status, buyerId, supplierId)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";

/* ── Schema ── */
const CreateRfqSchema = z.object({
  productId: z.string().min(1),
  supplierId: z.string().min(1),
  requestedQty: z.number().int().min(1),
  targetPrice: z.number().min(0).optional(),
  deliveryTimeline: z.string().optional(),
  specialReq: z.string().optional(),
  notes: z.string().optional(),
});

/* ── Pricing Evaluator — decides FIXED checkout vs RFQ ── */
export async function evaluatePricingMode(productId: string, quantity: number, tenantId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId, tenantId, deletedAt: null },
    select: {
      unitPrice: true,
      basePrice: true,
      pricingMode: true,
      rfqThresholdQty: true,
    },
  });

  if (!product) throw new Error("Product not found");

  // RFQ-only
  if (product.pricingMode === "RFQ") {
    return { mode: "RFQ" as const, reason: "RFQ-only product" };
  }

  // Hybrid — quantity threshold triggers RFQ
  if (product.pricingMode === "HYBRID" && product.rfqThresholdQty && quantity >= product.rfqThresholdQty) {
    return { mode: "RFQ" as const, reason: `Quantity ${quantity} >= threshold ${product.rfqThresholdQty}` };
  }

  // FIXED or HYBRID below threshold — instant checkout
  return {
    mode: "FIXED" as const,
    unitPrice: Number(product.unitPrice || product.basePrice || 0),
  };
}

/* ── POST /api/v1/rfq — Submit RFQ ── */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "rfq:create");

  const body = await request.json();
  const data = CreateRfqSchema.parse(body);

  const pricing = await evaluatePricingMode(data.productId, data.requestedQty, auth.tenantId);
  if (pricing.mode !== "RFQ") {
    return error(`This product supports instant checkout. No RFQ needed. (reason: ${(pricing as any).reason})`, 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { name: true },
  });

  const rfq = await prisma.rfqRequest.create({
    data: {
      buyerId: auth.userId,
      productId: data.productId,
      supplierId: data.supplierId,
      requestedQty: data.requestedQty,
      targetPrice: data.targetPrice,
      deliveryTimeline: data.deliveryTimeline,
      specialReq: data.specialReq,
      notes: data.notes,
      tenantId: auth.tenantId,
      estimatedResponse: "24 hours",
      status: "PENDING",
    },
  });

  const webhookPayload = {
    rfqId: rfq.id,
    productName: product?.name || "Unknown",
    requestedQty: data.requestedQty,
    targetPrice: data.targetPrice,
    buyerId: auth.userId,
    supplierId: data.supplierId,
    tenantId: auth.tenantId,
    createdAt: rfq.createdAt.toISOString(),
  };

  await prisma.rfqRequest.update({
    where: { id: rfq.id },
    data: { webhookPayload: JSON.stringify(webhookPayload) },
  });

  return success({ rfq, estimatedResponse: "24 hours" }, 201);
});

/* ── GET /api/v1/rfq — List RFQs ── */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const buyerId = searchParams.get("buyerId");
  const supplierId = searchParams.get("supplierId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const where: Record<string, unknown> = { tenantId: auth.tenantId, deletedAt: null };
  if (status) where.status = status;
  if (buyerId) where.buyerId = buyerId;
  if (supplierId) where.supplierId = supplierId;

  const rfqs = await prisma.rfqRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return success({ rfqs });
});