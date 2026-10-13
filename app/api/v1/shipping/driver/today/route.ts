import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, error, success } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  try {
    const trip = await prisma.trip.findFirst({
      where: { tenantId: auth.tenantId, assignedDriverId: auth.userId, deletedAt: null, scheduledDate: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "COMPLETED", "RETURNING"] } },
      orderBy: { scheduledDate: "asc" },
      include: { stops: { where: { tenantId: auth.tenantId, deletedAt: null }, orderBy: { stopOrder: "asc" }, include: { hotel: { select: { name: true, address: true, city: true } }, order: { select: { id: true, orderNumber: true, total: true, tenantId: true, _count: { select: { items: true } } } } } } },
    });
    if (!trip) return success(null);
    return success({ tripId: trip.id, tripNumber: trip.tripNumber, vehiclePlate: trip.vehiclePlate, scheduledDate: trip.scheduledDate, status: trip.status, driverName: trip.driverName,
      completedStops: trip.stops.filter(stop => stop.status === "DELIVERED").length, proofCapturedStops: trip.stops.filter(stop => stop.status === "POD_CAPTURED").length, totalStops: trip.stops.length,
      stops: trip.stops.map(stop => ({ id: stop.id, stopNumber: stop.stopNumber || stop.stopOrder, hotelName: stop.hotel.name, hotelAddress: stop.hotel.address, hotelCity: stop.hotel.city, estimatedArrival: stop.estimatedArrival, status: stop.status,
        orderId: stop.order?.tenantId === auth.tenantId ? stop.order.id : null, orderNumber: stop.order?.tenantId === auth.tenantId ? stop.order.orderNumber : null, orderTotal: stop.order?.tenantId === auth.tenantId ? Number(stop.order.total) : null, itemCount: stop.order?.tenantId === auth.tenantId ? stop.order._count.items : null })) });
  } catch (cause) {
    if (["P2021", "P2022"].includes((cause as { code?: string }).code || "")) return error("Driver dispatch requires the approved carrier schema migration before use.", 503);
    throw cause;
  }
});
