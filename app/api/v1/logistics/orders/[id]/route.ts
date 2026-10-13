import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";

/**
 * Get logistics tracking for a specific order.
 * Returns trip stops, driver assignment, and POD state via TripStop links.
 */
export const GET = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "logistics:read");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      tripStops: {
        orderBy: { stopOrder: "asc" },
        include: {
          trip: {
            select: {
              id: true,
              tripNumber: true,
              driverName: true,
              driverPhone: true,
              vehiclePlate: true,
              status: true,
              departureDate: true,
              arrivalDate: true,
            },
          },
        },
      },
    },
  });

  if (!order) return error("Order not found", 404);
  if (order.tenantId !== auth.tenantId) return error("Order not found", 404);

  const stops = order.tripStops ?? [];

  return success({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryAddress: order.deliveryAddress,
    estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    deliveryInstructions: order.deliveryInstructions,
    stops: stops.map((s) => ({
      id: s.id,
      stopOrder: s.stopOrder,
      stopNumber: s.stopNumber,
      hotelId: s.hotelId,
      status: s.status,
      estimatedArrival: s.estimatedArrival?.toISOString() ?? null,
      eta: s.eta?.toISOString() ?? null,
      actualArrival: s.actualArrival?.toISOString() ?? null,
      arrivedAt: s.arrivedAt?.toISOString() ?? null,
      podPhotoUrl: s.podPhotoUrl,
      signatureUrl: s.signatureUrl,
      notes: s.notes,
      trip: s.trip ? {
        id: s.trip.id,
        tripNumber: s.trip.tripNumber,
        driverName: s.trip.driverName,
        driverPhone: s.trip.driverPhone,
        vehiclePlate: s.trip.vehiclePlate,
        status: s.trip.status,
        departureDate: s.trip.departureDate?.toISOString() ?? null,
        arrivalDate: s.trip.arrivalDate?.toISOString() ?? null,
      } : null,
    })),
  });
});
