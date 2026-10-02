import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripCreateSchema } from "@/lib/zod";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const hubId = searchParams.get("hubId") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (hubId) where.hubId = hubId;
  if (status) where.status = status;

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      hub: { select: { id: true, name: true, city: true } },
      stops: {
        include: {
          hotel: { select: { id: true, name: true } },
        },
      },
    },
  });

  return success(trips);
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const validated = TripCreateSchema.parse(body);

  const tripNumber = `TRIP-${Date.now()}`;
  const trip = await prisma.trip.create({
    data: {
      tenantId: auth.tenantId,
      ...validated,
      tripNumber,
      scheduledDate: new Date(validated.scheduledDate),
    },
    include: {
      hub: { select: { id: true, name: true, city: true } },
      stops: true,
    },
  });

  return success(trip, 201);
}, { rateLimit: "api" });
