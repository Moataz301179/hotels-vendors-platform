import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripCreateSchema, PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateBody, validateQuery, success, error, audit, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");

  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (query.search) {
    where.driverName = { contains: query.search };
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { [query.sortBy || "scheduledDate"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { stops: { include: { hotel: { select: { id: true, name: true } } } }, hub: true },
    }),
    prisma.trip.count({ where }),
  ]);

  return success({ trips, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "shipping:create_trip");

  const body = await request.json();
  const data = validateBody(TripCreateSchema, body);

  const tripNumber = `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const trip = await prisma.trip.create({
    data: {
          tenantId: auth.tenantId,
      tripNumber,
      hubId: data.hubId,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      vehiclePlate: data.vehiclePlate,
      scheduledDate: new Date(data.scheduledDate),
      status: "SCHEDULED",
    },
    include: { hub: true },
  });

  await audit({
    entityType: "TRIP",
    entityId: trip.id,
    action: "CREATE_TRIP",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { driverName: trip.driverName, vehiclePlate: trip.vehiclePlate },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ trip }, 201);
});
