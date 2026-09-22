/**
 * Seasonal Credit Calculator — Occupancy-linked credit lines
 * Hotels Vendors
 *
 * Egyptian hospitality seasonality:
 *   Peak   (Oct–Mar): 1.0–1.2× multiplier — high occupancy, high procurement
 *   Shoulder (Apr, Sep): 0.7–0.9× multiplier — transition months
 *   Low    (May–Aug): 0.4–0.6× multiplier — summer slump, reduced spend
 *
 * Credit is adjusted by both the seasonal baseline and the hotel's actual
 * occupancy rate, with historical spend as a normalization factor.
 */

// Egyptian hospitality season definitions
const SEASONS = {
  PEAK: { months: [10, 11, 12, 1, 2, 3], min: 1.0, max: 1.2, label: "Peak Season" },
  SHOULDER: { months: [4, 9], min: 0.7, max: 0.9, label: "Shoulder Season" },
  LOW: { months: [5, 6, 7, 8], min: 0.4, max: 0.6, label: "Low Season" },
} as const;

type SeasonKey = keyof typeof SEASONS;

function getSeasonForMonth(month: number): { key: SeasonKey; config: (typeof SEASONS)[SeasonKey] } {
  for (const [key, config] of Object.entries(SEASONS) as [SeasonKey, (typeof SEASONS)[SeasonKey]][]) {
    if ((config.months as readonly number[]).includes(month)) {
      return { key, config };
    }
  }
  // Fallback (shouldn't happen with valid month 1-12)
  return { key: "LOW", config: SEASONS.LOW };
}

/**
 * Calculate the seasonal multiplier based on occupancy rate.
 * Maps occupancy (0–1) to the seasonal min–max range.
 *
 * Higher occupancy → higher multiplier (hotel is active and needs credit).
 * Lower occupancy → lower multiplier (reduced procurement needs).
 */
function occupancyToMultiplier(
  occupancyRate: number,
  seasonConfig: (typeof SEASONS)[SeasonKey]
): number {
  const clamped = Math.max(0, Math.min(1, occupancyRate));
  return seasonConfig.min + clamped * (seasonConfig.max - seasonConfig.min);
}

/**
 * Calculate the seasonal multiplier based on historical spend.
 * Hotels with higher historical spend get a modest boost (up to +5%).
 */
function spendBonus(historicalSpend: number): number {
  // Normalized bonus: 0–5% based on spend level
  // EGP 0 → 0, EGP 5M+ → 5%
  const maxSpend = 5_000_000;
  const bonusRate = 0.05;
  return Math.min(bonusRate, (historicalSpend / maxSpend) * bonusRate);
}

/**
 * Main seasonal credit calculation.
 *
 * @param baseCredit — The hotel's base credit limit (from CreditFacility or Hotel.creditLimit)
 * @param currentMonth — 1–12 calendar month
 * @param occupancyRate — 0–1 (0% to 100%)
 * @param historicalSpend — Total spend in EGP over the trailing 12 months
 * @returns Adjusted credit, season label, and combined multiplier
 */
export function calculateSeasonalCredit(
  baseCredit: number,
  currentMonth: number,
  occupancyRate: number,
  historicalSpend: number
): { adjustedCredit: number; season: string; multiplier: number } {
  if (currentMonth < 1 || currentMonth > 12) {
    throw new Error("currentMonth must be between 1 and 12");
  }

  const { key, config } = getSeasonForMonth(currentMonth);
  const seasonMultiplier = occupancyToMultiplier(occupancyRate, config);
  const spendBonusRate = spendBonus(historicalSpend);

  // Combined multiplier: season × (1 + spend bonus)
  const combinedMultiplier = seasonMultiplier * (1 + spendBonusRate);
  const adjustedCredit = Math.round(baseCredit * combinedMultiplier * 100) / 100;

  return {
    adjustedCredit,
    season: config.label,
    multiplier: Math.round(combinedMultiplier * 10000) / 10000, // 4 decimal precision
  };
}

/**
 * Calculate seasonal credit for a hotel from the database.
 * Fetches the active CreditFacility limit and historical spend, then applies seasonal adjustment.
 */
export async function getSeasonalCreditForHotel(
  hotelId: string,
  occupancyRate: number
): Promise<{
  hotelId: string;
  baseCredit: number;
  adjustedCredit: number;
  season: string;
  multiplier: number;
  currentMonth: number;
  historicalSpend: number;
} | null> {
  // Dynamic import to avoid circular deps
  const { prisma } = await import("@/lib/prisma");

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      creditLimit: true,
    },
  });

  if (!hotel || !hotel.creditLimit) return null;

  // Calculate historical spend (trailing 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const spendAggregation = await prisma.invoice.aggregate({
    where: {
      hotelId,
      status: "ISSUED",
      createdAt: { gte: twelveMonthsAgo },
    },
    _sum: { total: true },
  });

  const historicalSpend = Number(spendAggregation._sum.total ?? 0);
  const currentMonth = new Date().getMonth() + 1;

  const baseCredit = Number(hotel.creditLimit);
  const result = calculateSeasonalCredit(
    baseCredit,
    currentMonth,
    occupancyRate,
    historicalSpend
  );

  return {
    hotelId,
    baseCredit,
    ...result,
    currentMonth,
    historicalSpend,
  };
}
