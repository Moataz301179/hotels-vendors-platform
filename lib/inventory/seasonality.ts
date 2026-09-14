/**
 * Product Seasonality Service
 * ──────────────────────────
 * Manages per-product seasonal demand multipliers for the Forecast Engine.
 * Each product gets a month-by-month multiplier array (1.0 = baseline,
 * >1.0 = above-baseline demand, <1.0 = below-baseline demand).
 *
 * D2-04: Seasonal SKU Tagging
 * - getSeasonalProfile: returns the full 12-month multiplier array
 * - setSeasonalProfile: upserts multipliers for a product
 * - suggestSeasonalProfile: returns a default profile based on product category
 * - getCurrentMultiplier: returns the multiplier for the current month
 *
 * AGENTS.md G1: All queries are tenant-scoped.
 */

import { prisma } from "@/lib/prisma";
import type { ProductCategory } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────

export interface MonthMultiplier {
  month: number; // 1-12
  multiplier: number; // 0.1-5.0
}

export interface SeasonalProfile {
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  months: MonthMultiplier[];
  source: "custom" | "suggested";
}

// ── Default Seasonal Profiles by Category ──────────────────────────────
// Calibrated for Egyptian coastal / Red Sea hospitality market.
//
// Red Sea tourism pattern:
//   High season: Oct–Mar (winter sun, European tourists)
//   Shoulder: Apr, Sep (transition)
//   Low season: May–Aug (extreme heat, domestic-only)
//
// Category-specific peaks:
//   F_AND_B: Peaks with tourist occupancy (Oct–Apr)
//   CONSUMABLES: Roughly tracks occupancy but with floor (cleaning never stops)
//   GUEST_SUPPLIES: Tightly coupled to room occupancy
//   FFE: Pre-season restocking (Aug–Sep), replacement during peak
//   SERVICES: Year-round, slight peak in shoulder for maintenance

const CATEGORY_DEFAULT_PROFILES: Record<ProductCategory, MonthMultiplier[]> = {
  F_AND_B: [
    { month: 1, multiplier: 1.4 },  // Jan — peak tourism
    { month: 2, multiplier: 1.35 }, // Feb — peak, pre-Ramadan stocking
    { month: 3, multiplier: 1.2 },  // Mar — still peak, Ramadan variable
    { month: 4, multiplier: 0.9 },  // Apr — shoulder, Easter bump
    { month: 5, multiplier: 0.5 },  // May — low season begins
    { month: 6, multiplier: 0.4 },  // Jun — low, minimal F&B
    { month: 7, multiplier: 0.4 },  // Jul — low, staff canteen only
    { month: 8, multiplier: 0.45 }, // Aug — low, late-summer uptick
    { month: 9, multiplier: 0.8 },  // Sep — shoulder, pre-season ramp
    { month: 10, multiplier: 1.2 }, // Oct — peak begins
    { month: 11, multiplier: 1.35 },// Nov — full peak
    { month: 12, multiplier: 1.4 }, // Dec — holiday peak
  ],
  CONSUMABLES: [
    { month: 1, multiplier: 1.3 },  // Jan — high occupancy cleaning
    { month: 2, multiplier: 1.25 }, // Feb
    { month: 3, multiplier: 1.15 }, // Mar
    { month: 4, multiplier: 0.9 },  // Apr — shoulder
    { month: 5, multiplier: 0.7 },  // May — reduced but never zero
    { month: 6, multiplier: 0.65 }, // Jun — baseline cleaning only
    { month: 7, multiplier: 0.65 }, // Jul
    { month: 8, multiplier: 0.7 },  // Aug
    { month: 9, multiplier: 0.85 }, // Sep — pre-season deep clean
    { month: 10, multiplier: 1.2 }, // Oct — peak starts
    { month: 11, multiplier: 1.3 }, // Nov
    { month: 12, multiplier: 1.3 }, // Dec
  ],
  GUEST_SUPPLIES: [
    { month: 1, multiplier: 1.4 },  // Jan — full rooms
    { month: 2, multiplier: 1.35 }, // Feb
    { month: 3, multiplier: 1.2 },  // Mar
    { month: 4, multiplier: 0.85 }, // Apr — shoulder
    { month: 5, multiplier: 0.4 },  // May — few guests
    { month: 6, multiplier: 0.3 },  // Jun — minimal
    { month: 7, multiplier: 0.3 },  // Jul
    { month: 8, multiplier: 0.35 }, // Aug
    { month: 9, multiplier: 0.75 }, // Sep — pre-season
    { month: 10, multiplier: 1.2 }, // Oct — peak
    { month: 11, multiplier: 1.35 },// Nov
    { month: 12, multiplier: 1.4 }, // Dec — holiday
  ],
  FFE: [
    { month: 1, multiplier: 0.8 },  // Jan — post-holiday recovery
    { month: 2, multiplier: 0.7 },  // Feb — quiet
    { month: 3, multiplier: 0.7 },  // Mar
    { month: 4, multiplier: 0.9 },  // Apr — spring replacements
    { month: 5, multiplier: 0.6 },  // May — low
    { month: 6, multiplier: 0.5 },  // Jun — low
    { month: 7, multiplier: 0.5 },  // Jul — low
    { month: 8, multiplier: 1.5 },  // Aug — PRE-SEASON RESTOCKING
    { month: 9, multiplier: 1.8 },  // Sep — peak FFE ordering
    { month: 10, multiplier: 0.9 }, // Oct — minor replacements
    { month: 11, multiplier: 0.7 }, // Nov
    { month: 12, multiplier: 0.8 }, // Dec — holiday damage replacements
  ],
  SERVICES: [
    { month: 1, multiplier: 1.1 },  // Jan — peak maintenance calls
    { month: 2, multiplier: 1.05 }, // Feb
    { month: 3, multiplier: 1.0 },  // Mar
    { month: 4, multiplier: 1.2 },  // Apr — pre-summer AC servicing
    { month: 5, multiplier: 1.3 },  // May — heavy AC maintenance
    { month: 6, multiplier: 1.2 },  // Jun — ongoing AC/pool
    { month: 7, multiplier: 1.15 }, // Jul
    { month: 8, multiplier: 1.1 },  // Aug
    { month: 9, multiplier: 1.4 },  // Sep — pre-season deep maintenance
    { month: 10, multiplier: 1.0 }, // Oct
    { month: 11, multiplier: 0.9 }, // Nov
    { month: 12, multiplier: 0.95 },// Dec
  ],
};

// ── Multiplier Sanitization ────────────────────────────────────────────

function sanitizeMultiplier(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1.0;
  return Math.max(0.1, Math.min(5.0, Math.round(num * 100) / 100));
}

function sanitizeMonth(month: unknown): number {
  const num = Number(month);
  if (!Number.isInteger(num) || num < 1 || num > 12) return 1;
  return num;
}

// ── Core Functions ─────────────────────────────────────────────────────

/**
 * Get the full 12-month seasonal profile for a product.
 * Returns default profile if no custom profile exists.
 */
export async function getSeasonalProfile(
  productId: string,
  tenantId: string
): Promise<SeasonalProfile> {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true, name: true, sku: true, category: true },
  });

  if (!product) {
    throw new Error("Product not found in tenant");
  }

  const rows = await prisma.productSeasonality.findMany({
    where: { productId, tenantId },
    select: { month: true, multiplier: true },
    orderBy: { month: "asc" },
  });

  const source = rows.length > 0 ? "custom" : "suggested";

  // Merge with defaults — custom rows override, missing months use defaults
  const defaults = CATEGORY_DEFAULT_PROFILES[product.category];
  const customMap = new Map(rows.map((r) => [r.month, r.multiplier]));

  const months: MonthMultiplier[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    multiplier: customMap.get(i + 1) ?? defaults[i].multiplier,
  }));

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    months,
    source,
  };
}

/**
 * Set (upsert) the seasonal profile for a product.
 * Replaces all existing monthly entries for this product+tenant.
 */
export async function setSeasonalProfile(
  productId: string,
  tenantId: string,
  months: MonthMultiplier[]
): Promise<SeasonalProfile> {
  // Verify product exists and belongs to tenant
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true, name: true, sku: true, category: true },
  });

  if (!product) {
    throw new Error("Product not found in tenant");
  }

  // Sanitize all inputs
  const sanitized = months.map((m) => ({
    month: sanitizeMonth(m.month),
    multiplier: sanitizeMultiplier(m.multiplier),
  }));

  // Deduplicate by month (last wins)
  const uniqueMap = new Map<number, number>();
  for (const m of sanitized) {
    uniqueMap.set(m.month, m.multiplier);
  }

  // Transaction: delete old + insert new
  await prisma.$transaction(async (tx) => {
    await tx.productSeasonality.deleteMany({
      where: { productId, tenantId },
    });

    const data = Array.from(uniqueMap.entries()).map(([month, multiplier]) => ({
      productId,
      month,
      multiplier,
      tenantId,
    }));

    if (data.length > 0) {
      await tx.productSeasonality.createMany({ data });
    }
  });

  return getSeasonalProfile(productId, tenantId);
}

/**
 * Suggest a default seasonal profile based on product category.
 * Does NOT persist — returns the suggestion for preview/apply.
 */
export function suggestSeasonalProfile(
  category: ProductCategory
): MonthMultiplier[] {
  return CATEGORY_DEFAULT_PROFILES[category].map((m) => ({ ...m }));
}

/**
 * Get the seasonal multiplier for the current month (or a specific date).
 * Falls back to the category default if no custom profile exists.
 */
export async function getCurrentMultiplier(
  productId: string,
  tenantId: string,
  date?: Date
): Promise<number> {
  const targetDate = date ?? new Date();
  const month = targetDate.getMonth() + 1; // 1-indexed

  const row = await prisma.productSeasonality.findUnique({
    where: {
      productId_month_tenantId: { productId, month, tenantId },
    },
    select: { multiplier: true },
  });

  if (row) return row.multiplier;

  // Fallback: get product category and use default
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { category: true },
  });

  if (!product) return 1.0;

  return CATEGORY_DEFAULT_PROFILES[product.category][month - 1].multiplier;
}

/**
 * Get seasonal profiles for multiple products in a single query.
 * Used by the batch forecast endpoint.
 */
export async function getBulkSeasonalMultipliers(
  productIds: string[],
  tenantId: string,
  date?: Date
): Promise<Map<string, number>> {
  const targetDate = date ?? new Date();
  const month = targetDate.getMonth() + 1;

  const rows = await prisma.productSeasonality.findMany({
    where: {
      productId: { in: productIds },
      tenantId,
      month,
    },
    select: { productId: true, multiplier: true },
  });

  const multiplierMap = new Map(rows.map((r) => [r.productId, r.multiplier]));

  // For products without custom profiles, fetch categories for defaults
  const missingIds = productIds.filter((id) => !multiplierMap.has(id));
  if (missingIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: missingIds }, tenantId },
      select: { id: true, category: true },
    });

    for (const p of products) {
      multiplierMap.set(
        p.id,
        CATEGORY_DEFAULT_PROFILES[p.category][month - 1].multiplier
      );
    }
  }

  return multiplierMap;
}
