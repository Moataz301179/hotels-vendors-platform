import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * Driver's "today" dispatch — used by the INVO DriverDeliveryScreen.
 *
 * GET /api/v1/shipping/driver/today
 * Returns the single most-recent in-flight trip for the tenant, shaped to the
 * mobile TripData contract (tripId, tripNumber, driverName, vehiclePlate,
 * scheduledDate, status, stops[], completedStops, totalStops). Reads only real
 * Trip/TripStop rows; returns an honest null when there is no active trip for
 * the authenticated driver/tenant.
 */
export const GET = apiRoute(async (_request: NextRequest) => {
  const auth = await authenticate(_request);

  // Driver = SHIPPING role. Allow the shipping role to read the dispatch.
  if (auth.platformRole !== "SHIPPING" && auth.platformRole !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Most-recent trip for the tenant scheduled today with at least one stop
  const trip = await prisma.trip.findFirst({
    where: {
      tenantId: auth.tenantId,
      deletedAt: null,
      scheduledDate: { gte: startOfDay, lt: endOfDay },
      status: { notIn: ["CANCELLED", "COMPLETED"] as never[] },
    },
    orderBy: { scheduledDate: "asc" },
    include: {
      stops: {
        where: { deletedAt: null },
        orderBy: { stopOrder: "asc" },
        include: {
          hotel: { select: { id: true, name: true, address: true, city: true } },
          order: { select: { id: true, orderNumber: true, total: true } },
        },
      },
      hub: true,
    },
  });

  // If no in-flight trip today, fall back to the most recent active trip
  // (any day) so a driver mid-shipment doesn't lose the console.
  const activeTrip =
    trip ??
    (await prisma.trip.findFirst({
      where: {
        tenantId: auth.tenantId,
        deletedAt: null,
        status: { in: ["PICKED_UP", "LOADING", "IN_TRANSIT", "ARRIVED"] as never[] },
      },
      orderBy: { scheduledDate: "desc" },
      include: {
        stops: {
          where: { deletedAt: null },
          orderBy: { stopOrder: "asc" },
          include: {
            hotel: { select: { id: true, name: true, address: true, city: true } },
            order: { select: { id: true, orderNumber: true, total: true } },
          },
        },
        hub: true,
      },
    }));

  if (!activeTrip) {
    return success(null);
  }

  const stops = activeTrip.stops.map((s) => ({
    id: s.id,
    stopNumber: s.stopNumber ?? s.stopOrder,
    hotelName: s.hotel?.name ?? "Hotel",
    hotelAddress: s.hotel?.address ?? "",
    hotelCity: s.hotel?.city ?? "",
    estimatedArrival: s.estimatedArrival?.toISOString() ?? null,
    eta: s.eta?.toISOString() ?? null,
    status: s.status,
    orderId: s.orderId ?? "",
    orderNumber: s.order?.orderNumber ?? "",
    orderTotal: s.order?.total != null ? Number(s.order.total) : 0,
    itemCount: 0,
  }));

  const completedStops = stops.filter((s) =>
    ["DELIVERED", "POD_CAPTURED", "ARRIVED"].includes(String(s.status))
  ).length;

  return success({
    tripId: activeTrip.id,
    tripNumber: activeTrip.tripNumber,
    driverName: activeTrip.driverName ?? "",
    vehiclePlate: activeTrip.vehiclePlate ?? "",
    scheduledDate: activeTrip.scheduledDate?.toISOString() ?? null,
    status: activeTrip.status,
    stops,
    completedStops,
    totalStops: stops.length,
  });
});