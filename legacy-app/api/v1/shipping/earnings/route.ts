import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * GET /api/v1/shipping/earnings — Earnings summary for the logistics provider.
 * Aggregates completed trips into revenue metrics.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, all

  const now = new Date();
  let dateFilter: Date | undefined;
  switch (period) {
    case "7d":
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = undefined;
  }

  const where: Record<string, unknown> = {
    tenantId: auth.tenantId,
    status: { in: ["DELIVERED", "COMPLETED"] },
  };
  if (dateFilter) {
    where.completedAt = { gte: dateFilter };
  }

  const completedTrips = await prisma.trip.findMany({
    where,
    select: {
      id: true,
      tripNumber: true,
      completedAt: true,
      vehiclePlate: true,
      driverName: true,
      _count: { select: { stops: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const totalTrips = completedTrips.length;
  const totalStops = completedTrips.reduce((sum, t) => sum + t._count.stops, 0);

  // Earnings estimation: EGP 3000 base per trip + EGP 1500 per stop
  const BASE_PER_TRIP = 3000;
  const PER_STOP = 1500;
  const totalEarnings = totalTrips * BASE_PER_TRIP + totalStops * PER_STOP;

  // Daily breakdown
  const dailyMap = new Map<string, { trips: number; stops: number; earnings: number }>();
  for (const trip of completedTrips) {
    const day = trip.completedAt
      ? trip.completedAt.toISOString().split("T")[0]
      : "unknown";
    if (!dailyMap.has(day)) {
      dailyMap.set(day, { trips: 0, stops: 0, earnings: 0 });
    }
    const d = dailyMap.get(day)!;
    d.trips++;
    d.stops += trip._count.stops;
    d.earnings += BASE_PER_TRIP + trip._count.stops * PER_STOP;
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Top performing vehicles
  const vehicleEarnings = new Map<string, { trips: number; earnings: number }>();
  for (const trip of completedTrips) {
    const plate = trip.vehiclePlate || "UNASSIGNED";
    if (!vehicleEarnings.has(plate)) {
      vehicleEarnings.set(plate, { trips: 0, earnings: 0 });
    }
    const v = vehicleEarnings.get(plate)!;
    v.trips++;
    v.earnings += BASE_PER_TRIP + trip._count.stops * PER_STOP;
  }

  const topVehicles = Array.from(vehicleEarnings.entries())
    .map(([plate, data]) => ({ plate, ...data }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  return success({
    summary: {
      totalTrips,
      totalStops,
      totalEarnings,
      averagePerTrip: totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0,
      period,
    },
    daily,
    topVehicles,
  });
}, { rateLimit: "api" });
