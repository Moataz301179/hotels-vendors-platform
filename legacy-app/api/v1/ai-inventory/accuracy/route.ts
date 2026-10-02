/**
 * Forecast Accuracy API (v1)
 *
 * GET  — Returns accuracy report for the tenant.
 * POST — Records a forecast prediction or actual consumption.
 *
 * AGENTS.md G1: All queries are tenant-scoped.
 * AGENTS.md G4: ZERO ETA exposure.
 */

import { NextRequest } from "next/server";
import {
  apiRoute,
  authenticate,
  requirePermission,
  success,
  error,
} from "@/lib/api-utils";
import { z } from "zod";
import {
  recordForecast,
  recordActual,
  getAccuracyReport,
  getAccuracyByCategory,
  getSeasonalAccuracy,
} from "@/lib/ai/forecast-accuracy";

const GetQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  view: z.enum(["summary", "category", "seasonal"]).optional(),
});

const PostBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("record_prediction"),
    productId: z.string().min(1),
    predictedQty: z.number().min(0),
    forecastDate: z.string().datetime(),
    seasonPeak: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("record_actual"),
    productId: z.string().min(1),
    actualQty: z.number().min(0),
    forecastDate: z.string().datetime(),
  }),
]);

/** GET /api/v1/ai-inventory/accuracy — accuracy report */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const { searchParams } = new URL(request.url);
  const parsed = GetQuerySchema.parse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

  const from = parsed.from ? new Date(parsed.from) : new Date(Date.now() - 90 * 86400000);
  const to = parsed.to ? new Date(parsed.to) : new Date();

  const view = parsed.view ?? "summary";

  if (view === "category") {
    const byCategory = await getAccuracyByCategory(auth.tenantId);
    return success({ byCategory });
  }

  if (view === "seasonal") {
    const seasonal = await getSeasonalAccuracy(auth.tenantId);
    return success({ seasonal });
  }

  const report = await getAccuracyReport({
    tenantId: auth.tenantId,
    from,
    to,
  });

  return success({ report });
});

/** POST /api/v1/ai-inventory/accuracy — record prediction or actual */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:write");

  const body = await request.json();
  const data = PostBodySchema.parse(body);

  if (data.action === "record_prediction") {
    const result = await recordForecast({
      productId: data.productId,
      predictedQty: data.predictedQty,
      forecastDate: new Date(data.forecastDate),
      tenantId: auth.tenantId,
      seasonPeak: data.seasonPeak ?? false,
    });
    return success({ prediction: result });
  }

  // record_actual
  const results = await recordActual({
    productId: data.productId,
    actualQty: data.actualQty,
    forecastDate: new Date(data.forecastDate),
    tenantId: auth.tenantId,
  });

  return success({ updated: 1, records: Array.isArray(results) ? results : [results] });
});
