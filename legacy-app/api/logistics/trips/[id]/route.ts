import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripUpdateSchema } from "@/lib/zod";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const GET = apiRoute(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const auth = await authenticate(_request);
    const { id } = await params;
    const trip = await prisma.trip.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        hub: { select: { id: true, name: true, city: true } },
        stops: {
          include: {
            hotel: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!trip) {
      return success(null);
    }

    return success(trip);
  }
);

export const PATCH = apiRoute(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const auth = await authenticate(request);
    const { id } = await params;
    const body = await request.json();
    const validated = TripUpdateSchema.parse(body);

    const data: Record<string, unknown> = { ...validated };
    if (validated.scheduledDate) {
      data.scheduledDate = new Date(validated.scheduledDate);
    }
    if (validated.status === "COMPLETED") {
      data.completedAt = new Date();
    }

    const trip = await prisma.trip.update({
      where: { id, tenantId: auth.tenantId },
      data,
      include: {
        hub: { select: { id: true, name: true, city: true } },
        stops: {
          include: {
            hotel: { select: { id: true, name: true } },
          },
        },
      },
    });

    return success(trip);
  },
  { rateLimit: "api" }
);
