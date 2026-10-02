import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripStopCreateSchema } from "@/lib/zod";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const POST = apiRoute(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const auth = await authenticate(request);
    const { id } = await params;
    const body = await request.json();
    const validated = TripStopCreateSchema.parse(body);

    const trip = await prisma.trip.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: { stops: true },
    });

    if (!trip || !trip.hubId) {
      return success(null);
    }

    const stop = await prisma.tripStop.create({
      data: {
        tenantId: auth.tenantId,
        tripId: id,
        hotelId: trip.hubId,
        orderId: validated.orderId,
        stopOrder: validated.stopNumber,
        stopNumber: validated.stopNumber,
        eta: validated.eta ? new Date(validated.eta) : null,
        estimatedArrival: validated.eta ? new Date(validated.eta) : null,
      },
      include: {
        trip: { select: { id: true, tripNumber: true } },
        hotel: { select: { id: true, name: true } },
      },
    });

    return success(stop, 201);
  },
  { rateLimit: "api" }
);
