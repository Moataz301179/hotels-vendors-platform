import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * GET /api/v1/shipping/fleet — List all vehicles for the tenant's logistics fleet.
 * Derived from Trip data (driverName + vehiclePlate).
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;

  // Aggregate distinct vehicles from trips
  const trips = await prisma.trip.findMany({
    where: { tenantId: auth.tenantId },
    select: {
      vehiclePlate: true,
      driverName: true,
      driverPhone: true,
      status: true,
      scheduledDate: true,
      completedAt: true,
      id: true,
      tripNumber: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by vehicle plate to create fleet view
  const vehicleMap = new Map<string, {
    plate: string;
    drivers: Set<string>;
    phones: Set<string>;
    totalTrips: number;
    activeTrips: number;
    lastUsed: Date | null;
    tripIds: string[];
  }>();

  for (const trip of trips) {
    const plate = trip.vehiclePlate || "UNASSIGNED";
    if (!vehicleMap.has(plate)) {
      vehicleMap.set(plate, {
        plate,
        drivers: new Set(),
        phones: new Set(),
        totalTrips: 0,
        activeTrips: 0,
        lastUsed: null,
        tripIds: [],
      });
    }
    const v = vehicleMap.get(plate)!;
    if (trip.driverName) v.drivers.add(trip.driverName);
    if (trip.driverPhone) v.phones.add(trip.driverPhone);
    v.totalTrips++;
    if (!["DELIVERED", "CANCELLED", "COMPLETED"].includes(trip.status)) {
      v.activeTrips++;
    }
    if (!v.lastUsed || (trip.scheduledDate && trip.scheduledDate > v.lastUsed)) {
      v.lastUsed = trip.scheduledDate;
    }
    v.tripIds.push(trip.id);
  }

  const fleet = Array.from(vehicleMap.values()).map((v) => ({
    plate: v.plate,
    drivers: Array.from(v.drivers),
    phones: Array.from(v.phones),
    totalTrips: v.totalTrips,
    activeTrips: v.activeTrips,
    status: v.activeTrips > 0 ? "ACTIVE" : "IDLE",
    lastUsed: v.lastUsed?.toISOString() || null,
  }));

  // Filter by status if provided
  const filtered = status
    ? fleet.filter((v) => v.status === status.toUpperCase())
    : fleet;

  return success(filtered);
}, { rateLimit: "api" });
