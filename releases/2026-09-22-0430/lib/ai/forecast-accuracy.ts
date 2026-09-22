/**
 * Forecast Accuracy Tracking
 *
 * Compares predicted vs actual consumption to build a feedback loop.
 * Tracks MAE (Mean Absolute Error), MAPE (Mean Absolute Percentage Error),
 * and seasonal accuracy patterns so the forecast model can self-improve.
 *
 * All queries are tenant-scoped (G1).
 */

import { prisma } from "@/lib/prisma";
import { type ProductCategory } from "@prisma/client";

// ─── Recording ──────────────────────────────────────────────

/**
 * Store a prediction for later comparison.
 * Called when a forecast is generated for a product.
 */
export async function recordForecast(params: {
  productId: string;
  predictedQty: number;
  forecastDate: Date;
  tenantId: string;
  seasonPeak?: boolean;
}) {
  return prisma.forecastAccuracy.create({
    data: {
      productId: params.productId,
      predictedQty: params.predictedQty,
      forecastDate: params.forecastDate,
      seasonPeak: params.seasonPeak ?? false,
      tenantId: params.tenantId,
    },
  });
}

/**
 * Record actual consumption and calculate accuracy for matching predictions.
 * Updates all unfulfilled ForecastAccuracy rows for the product+date window.
 */
export async function recordActual(params: {
  productId: string;
  actualQty: number;
  forecastDate: Date;
  tenantId: string;
}) {
  const windowStart = startOfDay(params.forecastDate);
  const windowEnd = endOfDay(params.forecastDate);

  // Find matching predictions within the date window
  const predictions = await prisma.forecastAccuracy.findMany({
    where: {
      productId: params.productId,
      tenantId: params.tenantId,
      forecastDate: { gte: windowStart, lte: windowEnd },
      actualQty: null,
    },
  });

  if (predictions.length === 0) {
    // No prediction recorded yet — create one with actual only
    return prisma.forecastAccuracy.create({
      data: {
        productId: params.productId,
        predictedQty: 0,
        actualQty: params.actualQty,
        accuracyPercent: 0,
        forecastDate: params.forecastDate,
        tenantId: params.tenantId,
      },
    });
  }

  // Update each matching prediction with actual + accuracy
  const updates = predictions.map((pred) => {
    const accuracy =
      params.actualQty > 0
        ? (1 - Math.abs(pred.predictedQty - params.actualQty) / params.actualQty) * 100
        : pred.predictedQty === 0
          ? 100
          : 0;

    return prisma.forecastAccuracy.update({
      where: { id: pred.id },
      data: {
        actualQty: params.actualQty,
        accuracyPercent: Math.max(0, Math.round(accuracy * 100) / 100),
      },
    });
  });

  return Promise.all(updates);
}

// ─── Reporting ──────────────────────────────────────────────

export interface AccuracyReport {
  tenantId: string;
  dateRange: { from: Date; to: Date };
  totalForecasts: number;
  forecastsWithActuals: number;
  /** Mean Absolute Error */
  mae: number;
  /** Mean Absolute Percentage Error */
  mape: number;
  /** Overall average accuracy % */
  avgAccuracy: number;
  /** Accuracy trend: positive = improving */
  trend: number;
  byCategory: CategoryAccuracy[];
}

export interface CategoryAccuracy {
  category: ProductCategory;
  totalForecasts: number;
  avgAccuracy: number;
  mape: number;
}

/**
 * Full accuracy report for a tenant within a date range.
 */
export async function getAccuracyReport(params: {
  tenantId: string;
  from: Date;
  to: Date;
}): Promise<AccuracyReport> {
  const records = await prisma.forecastAccuracy.findMany({
    where: {
      tenantId: params.tenantId,
      createdAt: { gte: params.from, lte: params.to },
      actualQty: { not: null },
    },
    include: { /* product for category join */ },
    orderBy: { createdAt: "asc" },
  });

  // We need product category — fetch separately for simplicity
  const productIds = [...new Set(records.map((r) => r.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, category: true },
  });
  const categoryMap = new Map(products.map((p) => [p.id, p.category]));

  // Compute MAE and MAPE
  let totalAbsError = 0;
  let totalPctError = 0;
  let totalAccuracy = 0;
  let count = 0;

  for (const r of records) {
    if (r.actualQty === null || r.actualQty === 0) continue;
    const absErr = Math.abs(r.predictedQty - r.actualQty);
    totalAbsError += absErr;
    totalPctError += (absErr / r.actualQty) * 100;
    totalAccuracy += r.accuracyPercent ?? 0;
    count++;
  }

  const mae = count > 0 ? totalAbsError / count : 0;
  const mape = count > 0 ? totalPctError / count : 0;
  const avgAccuracy = count > 0 ? totalAccuracy / count : 0;

  // Trend: compare second-half avg accuracy vs first-half
  const mid = Math.floor(records.length / 2);
  const firstHalf = records.slice(0, mid);
  const secondHalf = records.slice(mid);
  const avgFirst =
    firstHalf.length > 0
      ? firstHalf.reduce((s, r) => s + (r.accuracyPercent ?? 0), 0) / firstHalf.length
      : 0;
  const avgSecond =
    secondHalf.length > 0
      ? secondHalf.reduce((s, r) => s + (r.accuracyPercent ?? 0), 0) / secondHalf.length
      : 0;
  const trend = Math.round((avgSecond - avgFirst) * 100) / 100;

  // By category
  const catMap = new Map<ProductCategory, { total: number; accSum: number; pctSum: number }>();
  for (const r of records) {
    if (r.actualQty === null || r.actualQty === 0) continue;
    const cat = categoryMap.get(r.productId);
    if (!cat) continue;
    const entry = catMap.get(cat) ?? { total: 0, accSum: 0, pctSum: 0 };
    entry.total++;
    entry.accSum += r.accuracyPercent ?? 0;
    entry.pctSum += (Math.abs(r.predictedQty - r.actualQty) / r.actualQty) * 100;
    catMap.set(cat, entry);
  }

  const byCategory: CategoryAccuracy[] = Array.from(catMap.entries()).map(([cat, v]) => ({
    category: cat,
    totalForecasts: v.total,
    avgAccuracy: Math.round((v.accSum / v.total) * 100) / 100,
    mape: Math.round((v.pctSum / v.total) * 100) / 100,
  }));

  return {
    tenantId: params.tenantId,
    dateRange: { from: params.from, to: params.to },
    totalForecasts: count,
    forecastsWithActuals: count,
    mae: Math.round(mae * 100) / 100,
    mape: Math.round(mape * 100) / 100,
    avgAccuracy: Math.round(avgAccuracy * 100) / 100,
    trend,
    byCategory,
  };
}

/**
 * Accuracy breakdown by product category for the entire history.
 */
export async function getAccuracyByCategory(tenantId: string): Promise<CategoryAccuracy[]> {
  const records = await prisma.forecastAccuracy.findMany({
    where: {
      tenantId,
      actualQty: { not: null },
    },
    orderBy: { createdAt: "asc" },
  });

  const productIds = [...new Set(records.map((r) => r.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, category: true },
  });
  const categoryMap = new Map(products.map((p) => [p.id, p.category]));

  const catMap = new Map<ProductCategory, { total: number; accSum: number; pctSum: number }>();
  for (const r of records) {
    if (r.actualQty === null || r.actualQty === 0) continue;
    const cat = categoryMap.get(r.productId);
    if (!cat) continue;
    const entry = catMap.get(cat) ?? { total: 0, accSum: 0, pctSum: 0 };
    entry.total++;
    entry.accSum += r.accuracyPercent ?? 0;
    entry.pctSum += (Math.abs(r.predictedQty - r.actualQty) / r.actualQty) * 100;
    catMap.set(cat, entry);
  }

  return Array.from(catMap.entries()).map(([cat, v]) => ({
    category: cat,
    totalForecasts: v.total,
    avgAccuracy: Math.round((v.accSum / v.total) * 100) / 100,
    mape: Math.round((v.pctSum / v.total) * 100) / 100,
  }));
}

/**
 * Accuracy during peak vs off-peak seasons.
 */
export async function getSeasonalAccuracy(tenantId: string) {
  const records = await prisma.forecastAccuracy.findMany({
    where: {
      tenantId,
      actualQty: { not: null },
    },
  });

  let peakTotal = 0;
  let peakAccSum = 0;
  let offPeakTotal = 0;
  let offPeakAccSum = 0;

  for (const r of records) {
    if (r.actualQty === null || r.actualQty === 0) continue;
    if (r.seasonPeak) {
      peakTotal++;
      peakAccSum += r.accuracyPercent ?? 0;
    } else {
      offPeakTotal++;
      offPeakAccSum += r.accuracyPercent ?? 0;
    }
  }

  return {
    peak: {
      count: peakTotal,
      avgAccuracy: peakTotal > 0 ? Math.round((peakAccSum / peakTotal) * 100) / 100 : null,
    },
    offPeak: {
      count: offPeakTotal,
      avgAccuracy: offPeakTotal > 0 ? Math.round((offPeakAccSum / offPeakTotal) * 100) / 100 : null,
    },
  };
}

/**
 * Get historical accuracy weights for a product to use in weighted moving average.
 * Returns recent accuracy scores (newer = higher weight).
 */
export async function getProductAccuracyWeights(params: {
  productId: string;
  tenantId: string;
  lookbackDays?: number;
}): Promise<number[]> {
  const lookback = params.lookbackDays ?? 90;
  const since = new Date(Date.now() - lookback * 86400000);

  const records = await prisma.forecastAccuracy.findMany({
    where: {
      productId: params.productId,
      tenantId: params.tenantId,
      actualQty: { not: null },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { accuracyPercent: true },
  });

  return records.map((r) => (r.accuracyPercent ?? 50) / 100);
}

// ─── Helpers ────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
