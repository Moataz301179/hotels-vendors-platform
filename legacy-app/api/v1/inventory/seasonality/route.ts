/**
 * Product Seasonality API (v1)
 * ────────────────────────────
 * GET    — Returns the seasonal profile for a product (12-month multipliers)
 * PUT    — Sets (upserts) the seasonal profile for a product
 * POST   — Suggests a default profile based on product category (no persistence)
 *
 * AGENTS.md G1: All queries are tenant-scoped.
 * AGENTS.md G2: RBAC enforced via requirePermission.
 * D2-04: Seasonal SKU Tagging for Forecast Engine.
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
  getSeasonalProfile,
  setSeasonalProfile,
  suggestSeasonalProfile,
} from "@/lib/inventory/seasonality";

// ── Zod Schemas ────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  productId: z.string().min(1, "productId is required"),
});

const PutBodySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  months: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        multiplier: z.number().min(0.1).max(5.0),
      })
    )
    .min(1, "At least one month entry required")
    .max(12, "Maximum 12 entries (one per month)"),
});

const PostBodySchema = z.object({
  category: z.enum(["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"]),
});

// ── GET /api/v1/inventory/seasonality ──────────────────────────────────

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const { searchParams } = new URL(request.url);
  const parsed = GetQuerySchema.safeParse({
    productId: searchParams.get("productId"),
  });

  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid query", 400);
  }

  try {
    const profile = await getSeasonalProfile(parsed.data.productId, auth.tenantId);
    return success(profile);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Failed to fetch profile", 404);
  }
});

// ── PUT /api/v1/inventory/seasonality ──────────────────────────────────

export const PUT = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:write");

  const body = await request.json();
  const parsed = PutBodySchema.safeParse(body);

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return error(`Validation error: ${messages}`, 400);
  }

  try {
    const profile = await setSeasonalProfile(
      parsed.data.productId,
      auth.tenantId,
      parsed.data.months
    );

    // Audit log
    const { audit } = await import("@/lib/api-utils");
    await audit({
      entityType: "ProductSeasonality",
      entityId: parsed.data.productId,
      action: "SET_SEASONAL_PROFILE",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: {
        months: parsed.data.months,
        source: profile.source,
      },
    });

    return success(profile);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Failed to set profile", 400);
  }
});

// ── POST /api/v1/inventory/seasonality ─────────────────────────────────

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "inventory:read");

  const body = await request.json();
  const parsed = PostBodySchema.safeParse(body);

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return error(`Validation error: ${messages}`, 400);
  }

  const suggestion = suggestSeasonalProfile(parsed.data.category);

  return success({
    category: parsed.data.category,
    suggestion,
    note: "Default profile suggestion. Use PUT to apply to a specific product.",
  });
});
