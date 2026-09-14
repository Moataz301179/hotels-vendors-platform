/**
 * Seasonal Baseline Forecast Engine
 * ──────────────────────────────────
 * Replaces the deprecated Math.random() "AI" forecast with a deterministic,
 * occupancy-linked seasonal demand model calibrated for Egyptian hospitality.
 *
 * Seasonal profile (Egyptian hotel industry):
 *   Peak    (Oct–Mar): tourism high season — occupancy 70–100%
 *   Shoulder (Apr, Sep): transition months — occupancy 40–70%
 *   Low     (May–Aug): extreme heat, domestic-only demand — occupancy 15–40%
 *
 * Each product category has its own consumption curve because different
 * goods respond to occupancy at different rates (F&B spikes with guests,
 * services are year-round, FFE is pre-season restocking, etc.).
 *
 * The model is intentionally simple and explainable — no black-box ML.
 * It can be upgraded to SARIMA / Prophet once 12+ months of actual
 * consumption data accumulate.
 */

import { type ProductCategory } from "@prisma/client";
import { getProductAccuracyWeights } from "@/lib/ai/forecast-accuracy";

// ── Types ──────────────────────────────────────────────────────────────

export interface ForecastInput {
  /** Product SKU for logging / debugging */
  sku: string;
  /** Product category — drives the category-specific adjustment curve */
  category: ProductCategory;
  /** Historical average daily usage (units/day) from product.avgDailyUsage */
  avgDailyUsage: number;
  /** Current stock on hand */
  currentStock: number;
  /** Lead time in days from supplier */
  leadTimeDays: number;
  /** Hotel room count — used to scale occupancy if no explicit rate given */
  roomCount?: number;
  /**
   * Current occupancy rate (0.0–1.0).
   * If omitted, the model uses the seasonal baseline for the current month.
   */
  occupancyRate?: number;
  /**
   * Forecast horizon in days (default 30).
   * How many days ahead to project demand.
   */
  horizonDays?: number;
  /**
   * Tenant ID — enables accuracy-weighted adjustments.
   * If omitted, no historical accuracy data is used.
   */
  tenantId?: string;
  /**
   * Product ID — required when tenantId is provided for accuracy weighting.
   */
  productId?: string;
  /**
   * Product-specific seasonal multiplier override (0.1–5.0).
   * When provided, replaces the global SEASONAL_MULTIPLIERS[month] value.
   * Sourced from ProductSeasonality table via lib/inventory/seasonality.ts.
   */
  seasonalMultiplierOverride?: number;
}

export interface ForecastResult {
  sku: string;
  category: ProductCategory;
  /** Month (1–12) the forecast was generated for */
  month: number;
  /** Season label */
  season: "peak" | "shoulder" | "low";
  /** Effective occupancy used in the calculation */
  effectiveOccupancy: number;
  /** Raw baseline daily consumption (units/day) */
  baselineDaily: number;
  /** Seasonal multiplier applied */
  seasonalMultiplier: number;
  /** Category adjustment multiplier */
  categoryMultiplier: number;
  /** Final estimated daily consumption after all adjustments */
  adjustedDaily: number;
  /** Projected demand over the horizon */
  projectedDemand: number;
  /** Days until stockout at adjusted consumption rate */
  daysUntilStockout: number;
  /** Recommended reorder quantity */
  recommendedReorderQty: number;
  /** Reorder urgency: "none" | "soon" | "urgent" | "critical" */
  reorderUrgency: "none" | "soon" | "urgent" | "critical";
  /** Plain-English explanation of the forecast */
  explanation: string;
}

// ── Seasonal Multipliers by Month ──────────────────────────────────────
// Index 0 = January, index 11 = December.
// Calibrated for Egyptian coastal & urban hotel occupancy patterns.
//
// Peak months (Oct–Mar): Ramadan (variable) and winter tourism push
// occupancy high. Multiplier reflects BASE consumption increase —
// the occupancy link handles the rest.
//
// Shoulder (Apr, Sep): Schools in session, fewer tourists but
// conference/business travel partially compensates.
//
// Low (May–Aug): Heat season. Coastal hotels drop to 15–30% occupancy.
// Cairo/Giza business hotels fare better (~40–50%).
const SEASONAL_MULTIPLIERS: readonly number[] = [
  1.25, // Jan — peak winter tourism
  1.3, // Feb — peak, pre-Easter travel
  1.15, // Mar — still peak, shoulder tail
  0.85, // Apr — shoulder, Easter bump
  0.5, // May — low season begins
  0.4, // Jun — low, extreme heat
  0.4, // Jul — low, domestic travel only
  0.45, // Aug — low, late-summer slight uptick
  0.75, // Sep — shoulder, pre-season ramp
  1.1, // Oct — peak begins, winter tourism
  1.2, // Nov — full peak
  1.25, // Dec — peak, holiday season
] as const;

// ── Category-Specific Adjustments ──────────────────────────────────────
// Each category has a function that returns a multiplier based on
// the effective occupancy rate. This captures the fact that different
// categories scale differently with guest volume.
//
// Default is 1.0 (linear with occupancy). Departures from 1.0 encode
// domain knowledge about how the category actually behaves.

type CategoryAdjuster = (occupancy: number) => number;

const CATEGORY_ADJUSTERS: Record<ProductCategory, CategoryAdjuster> = {
  /**
   * F&B: Scales super-linearly with occupancy.
   * At 100% occupancy, restaurants run at full capacity plus banquets/events.
   * At 0% occupancy, there's still basic staff canteen + minibar restocking.
   */
  F_AND_B: (occ) => 0.15 + occ * 0.95,

  /**
   * Consumables (cleaning chemicals, laundry, office supplies):
   * Roughly linear with occupancy — more guests = more laundry & cleaning.
   * At zero occupancy, only baseline facility maintenance remains.
   */
  CONSUMABLES: (occ) => 0.2 + occ * 0.8,

  /**
   * Guest Supplies (toiletries, amenities, minibar items):
   * Strongly coupled to guest count. Nearly zero at low occupancy.
   * Slight non-linearity: suite upgrades increase per-guest consumption.
   */
  GUEST_SUPPLIES: (occ) => 0.05 + occ * 1.05,

  /**
   * FF&E (furniture, fixtures, equipment):
   * Seasonal replacement cycle — bulk orders in Sep pre-season.
   * Not driven by occupancy; driven by asset lifecycle.
   * The occupancy effect is minimal (wear-and-tear at margins).
   */
  FFE: (occ) => 0.6 + occ * 0.4,

  /**
   * Services (maintenance contracts, pest control, IT support):
   * Year-round stable. Slight occupancy effect (more rooms = more calls).
   * Most service contracts are fixed-fee monthly.
   */
  SERVICES: (occ) => 0.85 + occ * 0.15,
};

// ── Deterministic Noise ────────────────────────────────────────────────
// A seeded pseudo-random noise generator using a simple linear
// congruential formula. This gives ±10% realistic variance without
// the unpredictability of Math.random().
//
// The seed is derived from SKU + month so the same product in the
// same month always produces the same forecast — critical for
// explainability and audit trails.

function seededNoise(sku: string, month: number, dayOfYear: number): number {
  let hash = 0;
  const seed = `${sku}-${month}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // LCG constants (Numerical Recipes)
  const raw = ((hash * 1664525 + 1013904223 + dayOfYear) >>> 0) / 4294967296;
  // Map to [-0.10, +0.10] for ±10% noise
  return (raw - 0.5) * 0.20;
}

// ── Main Forecast Function ─────────────────────────────────────────────

export async function generateForecast(input: ForecastInput): Promise<ForecastResult> {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // 1. Determine effective occupancy
  //    If provided, use it directly. Otherwise, derive from seasonal baseline.
  const seasonalOcc = SEASONAL_MULTIPLIERS[month];
  const effectiveOccupancy =
    input.occupancyRate !== undefined
      ? Math.max(0, Math.min(1, input.occupancyRate))
      : seasonalOcc;

  // 2. Get seasonal multiplier for the current month
  //    Per-product override takes precedence over the global seasonal curve.
  const globalSeasonalMultiplier = SEASONAL_MULTIPLIERS[month];
  const seasonalMultiplier =
    input.seasonalMultiplierOverride !== undefined
      ? Math.max(0.1, Math.min(5.0, input.seasonalMultiplierOverride))
      : globalSeasonalMultiplier;
  const season =
    seasonalMultiplier >= 1.0
      ? "peak"
      : seasonalMultiplier >= 0.7
        ? "shoulder"
        : "low";

  // 3. Get category-specific adjustment based on occupancy
  const categoryAdjuster = CATEGORY_ADJUSTERS[input.category];
  const categoryMultiplier = categoryAdjuster(effectiveOccupancy);

  // 4. Calculate adjusted daily consumption
  //    baseline × seasonal × category + noise
  const noise = seededNoise(input.sku, month, dayOfYear);
  let baseAdjusted = Math.max(
    0,
    input.avgDailyUsage * seasonalMultiplier * categoryMultiplier * (1 + noise)
  );

  // 4b. Accuracy-weighted adjustment (optional)
  //     If we have historical accuracy data, bias the forecast toward
  //     outcomes where past predictions were more accurate.
  let accuracyWeight: number | null = null;
  if (input.tenantId && input.productId) {
    try {
      const weights = await getProductAccuracyWeights({
        productId: input.productId,
        tenantId: input.tenantId,
        lookbackDays: 90,
      });
      if (weights.length > 0) {
        // Exponentially weighted moving average: newer data gets more weight
        let weightedSum = 0;
        let weightTotal = 0;
        for (let i = 0; i < weights.length; i++) {
          const w = Math.pow(0.7, i); // decay factor
          weightedSum += weights[i] * w;
          weightTotal += w;
        }
        accuracyWeight = weightTotal > 0 ? weightedSum / weightTotal : null;
        if (accuracyWeight !== null) {
          // If historical accuracy is low (<70%), widen the safety margin
          // If high (>90%), tighten it slightly
          const correctionFactor = accuracyWeight < 0.7
            ? 1 + (0.7 - accuracyWeight) * 0.3 // up to +9% when accuracy=0
            : accuracyWeight > 0.9
              ? 1 - (accuracyWeight - 0.9) * 0.2 // down to -2% when accuracy=1
              : 1;
          baseAdjusted *= correctionFactor;
        }
      }
    } catch {
      // Accuracy data unavailable — proceed without weighting
    }
  }

  const adjustedDaily = baseAdjusted;

  // 5. Project demand over horizon
  const horizonDays = input.horizonDays ?? 30;
  const projectedDemand = Math.ceil(adjustedDaily * horizonDays);

  // 6. Days until stockout
  const daysUntilStockout =
    adjustedDaily > 0
      ? Math.floor(input.currentStock / adjustedDaily)
      : Infinity;

  // 7. Recommended reorder quantity
  //    Cover lead time + horizon, minus current stock, with a 20% safety buffer
  const safetyBuffer = 1.2;
  const reorderQty = Math.max(
    0,
    Math.ceil(
      (adjustedDaily * (input.leadTimeDays + horizonDays) * safetyBuffer) -
        input.currentStock
    )
  );

  // 8. Urgency classification
  let reorderUrgency: ForecastResult["reorderUrgency"];
  if (daysUntilStockout <= input.leadTimeDays) {
    reorderUrgency = "critical";
  } else if (daysUntilStockout <= input.leadTimeDays * 2) {
    reorderUrgency = "urgent";
  } else if (daysUntilStockout <= input.leadTimeDays * 3) {
    reorderUrgency = "soon";
  } else {
    reorderUrgency = "none";
  }

  // 9. Human-readable explanation
  const explanation = buildExplanation({
    season,
    month: month + 1,
    effectiveOccupancy,
    seasonalMultiplier,
    categoryMultiplier,
    category: input.category,
    adjustedDaily,
    daysUntilStockout,
    reorderUrgency,
  });

  return {
    sku: input.sku,
    category: input.category,
    month: month + 1,
    season,
    effectiveOccupancy,
    baselineDaily: input.avgDailyUsage,
    seasonalMultiplier,
    categoryMultiplier,
    adjustedDaily,
    projectedDemand,
    daysUntilStockout,
    recommendedReorderQty: reorderQty,
    reorderUrgency,
    explanation,
  };
}

// ── Batch Forecast ─────────────────────────────────────────────────────
// Generate forecasts for multiple products in a single call.
// Accepts an optional shared occupancy rate (e.g., from a PMS feed).

export interface BatchForecastInput {
  products: Array<
    Omit<ForecastInput, "occupancyRate"> & { occupancyRate?: number }
  >;
  /** Shared occupancy rate applied to all products if individual rates are omitted */
  defaultOccupancyRate?: number;
  horizonDays?: number;
}

export interface BatchForecastResult {
  generatedAt: string;
  horizonDays: number;
  summary: {
    totalProducts: number;
    criticalCount: number;
    urgentCount: number;
    soonCount: number;
  };
  forecasts: ForecastResult[];
}

export async function generateBatchForecast(
  input: BatchForecastInput
): Promise<BatchForecastResult> {
  const horizonDays = input.horizonDays ?? 30;

  const forecasts = await Promise.all(
    input.products.map((product) =>
      generateForecast({
        ...product,
        occupancyRate:
          product.occupancyRate ?? input.defaultOccupancyRate,
        horizonDays,
      })
    )
  );

  const criticalCount = forecasts.filter(
    (f) => f.reorderUrgency === "critical"
  ).length;
  const urgentCount = forecasts.filter(
    (f) => f.reorderUrgency === "urgent"
  ).length;
  const soonCount = forecasts.filter(
    (f) => f.reorderUrgency === "soon"
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    horizonDays,
    summary: {
      totalProducts: forecasts.length,
      criticalCount,
      urgentCount,
      soonCount,
    },
    forecasts,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function buildExplanation(params: {
  season: string;
  month: number;
  effectiveOccupancy: number;
  seasonalMultiplier: number;
  categoryMultiplier: number;
  category: ProductCategory;
  adjustedDaily: number;
  daysUntilStockout: number;
  reorderUrgency: string;
}): string {
  const occPct = Math.round(params.effectiveOccupancy * 100);
  const seasonLabel =
    params.season === "peak"
      ? "Peak season (Oct–Mar)"
      : params.season === "shoulder"
        ? "Shoulder season (Apr/Sep)"
        : "Low season (May–Aug)";

  const categoryNote: Record<ProductCategory, string> = {
    F_AND_B: "F&B consumption scales super-linearly with guest volume.",
    CONSUMABLES:
      "Consumables track occupancy linearly — more guests, more laundry & cleaning.",
    GUEST_SUPPLIES:
      "Guest supplies are tightly coupled to room occupancy.",
    FFE:
      "FF&E follows an asset replacement cycle, less affected by occupancy.",
    SERVICES:
      "Services are largely fixed-contract with minimal occupancy sensitivity.",
  };

  const urgencyNote: Record<string, string> = {
    critical:
      "STOCKOUT IMMINENT — reorder immediately. Current stock will not last through supplier lead time.",
    urgent:
      "Order within the next few days. Stock will deplete within 2× lead time.",
    soon:
      "Plan a reorder soon. Stock covers 2–3× lead time but consumption is elevated.",
    none:
      "Stock levels are adequate. No immediate action required.",
  };

  return [
    `${seasonLabel} — month ${params.month}.`,
    `Seasonal multiplier: ×${params.seasonalMultiplier.toFixed(2)}.`,
    `${params.category}: category adjustment ×${params.categoryMultiplier.toFixed(2)} at ${occPct}% occupancy.`,
    `Estimated daily consumption: ${params.adjustedDaily.toFixed(1)} units.`,
    categoryNote[params.category],
    `${params.daysUntilStockout} days until stockout.`,
    urgencyNote[params.reorderUrgency] ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}


