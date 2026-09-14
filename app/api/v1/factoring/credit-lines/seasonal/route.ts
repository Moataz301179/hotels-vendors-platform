/**
 * Seasonal Credit Line Calculator
 *
 * GET: Calculate seasonal credit adjustment for a hotel based on occupancy and historical spend.
 * Query params: hotelId, occupancyRate
 */

import { NextRequest } from "next/server";
import { getSeasonalCreditForHotel } from "@/lib/fintech/seasonal-credit";
import {
  apiRoute,
  authenticate,
  success,
  error,
  requirePermission,
  tenantWhereClause,
} from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  const hotelId = request.nextUrl.searchParams.get("hotelId");
  const occupancyRateStr = request.nextUrl.searchParams.get("occupancyRate");

  if (!hotelId) {
    return error("Missing required query parameter: hotelId", 400);
  }

  if (!occupancyRateStr) {
    return error("Missing required query parameter: occupancyRate (0-1)", 400);
  }

  const occupancyRate = parseFloat(occupancyRateStr);
  if (isNaN(occupancyRate) || occupancyRate < 0 || occupancyRate > 1) {
    return error("occupancyRate must be a number between 0 and 1", 400);
  }

  // Tenant isolation: verify hotel belongs to user's tenant
  const hotel = await prisma.hotel.findFirst({
    where: {
      id: hotelId,
      ...tenantWhereClause(auth.tenantId),
    },
    select: { id: true, name: true, tier: true },
  });

  if (!hotel) {
    return error("Hotel not found or access denied", 404);
  }

  const result = await getSeasonalCreditForHotel(hotelId, occupancyRate);

  if (!result) {
    return error("Hotel has no base credit limit set", 422);
  }

  return success({
    hotelId: result.hotelId,
    hotelName: hotel.name,
    hotelTier: hotel.tier,
    currentMonth: result.currentMonth,
    season: result.season,
    occupancyRate,
    historicalSpend: result.historicalSpend,
    baseCredit: result.baseCredit,
    adjustedCredit: result.adjustedCredit,
    multiplier: result.multiplier,
    creditDelta: result.adjustedCredit - result.baseCredit,
    creditDeltaPercent: ((result.adjustedCredit - result.baseCredit) / result.baseCredit * 100).toFixed(1),
  });
});
