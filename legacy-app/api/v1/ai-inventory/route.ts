/**
 * AI Inventory Forecast API (v1)
 *
 * GET  — Returns seasonal forecasts for all products in the tenant.
 * POST — Generate forecasts for specific products with custom occupancy.
 *
 * Replaces the deprecated Math.random() forecast with a deterministic
 * seasonal baseline model. No black-box ML — fully explainable.
 *
 * AGENTS.md G4: This route has ZERO ETA exposure.
 * AGENTS.md G1: All queries are tenant-scoped.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  requirePermission,
  success,
  error,
} from "@/lib/api-utils";
import { z } from "zod";
import {
  generateForecast,
  generateBatchForecast,
} from "@/lib/ai/forecast";
import { getBulkSeasonalMultipliers } from "@/lib/inventory/seasonality";

const ForecastQuerySchema = z.object({
  /** Filter by product category */
  category: z
    .enum(["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"])
    .optional(),
  /** Override occupancy rate for all products (0.0–1.0) */
  occupancyRate: z.number().min(0).max(1).optional(),
  /** Forecast horizon in days (default 30) */
  horizonDays: z.number().min(1).max(365).optional(),
  /** Filter to specific product IDs */
  productIds: z.array(z.string()).optional(),
});

const ForecastPostSchema = z.object({
  occupancyRate: z.number().min(0).max(1).optional(),
  horizonDays: z.number().min(1).max(365).optional(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        occupancyRate: z.number().min(0).max(1).optional(),
      })
    )
    .min(1)
    .max(200),
});

/** GET /api/v1/ai-inventory — batch forecast for all tenant products */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const { searchParams } = new URL(request.url);
  const parsed = ForecastQuerySchema.parse({
    category: searchParams.get("category") ?? undefined,
    occupancyRate: searchParams.has("occupancyRate")
      ? Number(searchParams.get("occupancyRate"))
      : undefined,
    horizonDays: searchParams.has("horizonDays")
      ? Number(searchParams.get("horizonDays"))
      : undefined,
    productIds: searchParams.has("productIds")
      ? JSON.parse(searchParams.get("productIds")!)
      : undefined,
  });

  // Fetch products — TENANT SCOPED
  const where: Record<string, unknown> = {
    tenantId: auth.tenantId,
    status: "ACTIVE",
  };
  if (parsed.category) where.category = parsed.category;
  if (parsed.productIds?.length) where.id = { in: parsed.productIds };

  const products = await prisma.product.findMany({
    where,
    select: {
      sku: true,
      category: true,
      avgDailyUsage: true,
      stockQuantity: true,
      leadTimeDays: true,
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  if (products.length === 0) {
    return success({
      forecasts: [],
      summary: {
        totalProducts: 0,
        criticalCount: 0,
        urgentCount: 0,
        soonCount: 0,
      },
    });
  }

  // Also fetch hotel room count for occupancy estimation (if no explicit rate)
  const hotelId = (
    await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { hotelId: true },
    })
  )?.hotelId;

  const hotel = hotelId
    ? await prisma.hotel.findUnique({
        where: { id: hotelId },
        select: { roomCount: true },
      })
    : null;

  // Fetch per-product seasonal multipliers (D2-04)
  const productIds = products.map((p) => p.id);
  const seasonalMultipliers = await getBulkSeasonalMultipliers(
    productIds,
    auth.tenantId
  );

  const batchResult = await generateBatchForecast({
    products: products.map((p) => ({
      sku: p.sku,
      category: p.category,
      avgDailyUsage: p.avgDailyUsage,
      currentStock: p.stockQuantity,
      leadTimeDays: p.leadTimeDays,
      roomCount: hotel?.roomCount ?? undefined,
      occupancyRate: parsed.occupancyRate,
      productId: p.id,
      tenantId: auth.tenantId,
      seasonalMultiplierOverride: seasonalMultipliers.get(p.id),
    })),
    defaultOccupancyRate: parsed.occupancyRate,
    horizonDays: parsed.horizonDays,
  });

  // Enrich with product names for UI display
  const enriched = batchResult.forecasts.map((f, i) => ({
    ...f,
    productId: products[i].id,
    productName: products[i].name,
  }));

  return success({
    ...batchResult,
    forecasts: enriched,
  });
});

/** POST /api/v1/ai-inventory — forecast for specific products with per-product occupancy */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const body = await request.json();
  const data = ForecastPostSchema.parse(body);

  const productIds = data.products.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: auth.tenantId },
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      avgDailyUsage: true,
      stockQuantity: true,
      leadTimeDays: true,
    },
  });

  if (products.length !== productIds.length) {
    return error("Some products were not found in your tenant", 400);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const occupancyMap = new Map(
    data.products.map((p) => [p.productId, p.occupancyRate])
  );

  // Fetch per-product seasonal multipliers (D2-04)
  const seasonalMultipliers = await getBulkSeasonalMultipliers(
    productIds,
    auth.tenantId
  );

  const forecasts = await Promise.all(
    data.products.map(async (req) => {
      const product = productMap.get(req.productId)!;
      return {
        forecast: await generateForecast({
          sku: product.sku,
          category: product.category,
          avgDailyUsage: product.avgDailyUsage,
          currentStock: product.stockQuantity,
          leadTimeDays: product.leadTimeDays,
          occupancyRate:
            occupancyMap.get(req.productId) ?? data.occupancyRate,
          horizonDays: data.horizonDays,
          productId: product.id,
          tenantId: auth.tenantId,
          seasonalMultiplierOverride: seasonalMultipliers.get(product.id),
        }),
        productId: product.id,
        productName: product.name,
      };
    })
  );

  const enriched = forecasts.map((f) => ({
    ...f.forecast,
    productId: f.productId,
    productName: f.productName,
  }));

  const criticalCount = forecasts.filter(
    (f) => f.forecast.reorderUrgency === "critical"
  ).length;
  const urgentCount = forecasts.filter(
    (f) => f.forecast.reorderUrgency === "urgent"
  ).length;
  const soonCount = forecasts.filter(
    (f) => f.forecast.reorderUrgency === "soon"
  ).length;

  return success({
    generatedAt: new Date().toISOString(),
    horizonDays: data.horizonDays ?? 30,
    summary: {
      totalProducts: forecasts.length,
      criticalCount,
      urgentCount,
      soonCount,
    },
    forecasts: enriched,
  });
});
