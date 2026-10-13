import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TripCreateSchema, PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateBody, validateQuery, success, requirePermission, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");

  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { tenantId: auth.tenantId, deletedAt: null };
  if (query.search) {
    where.driverName = { contains: query.search };
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: { [query.sortBy && ["scheduledDate", "createdAt", "tripNumber", "status"].includes(query.sortBy) ? query.sortBy : "scheduledDate"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { stops: { where: { tenantId: auth.tenantId, deletedAt: null }, include: { hotel: { select: { id: true, name: true } } } }, hub: true },
    }),
    prisma.trip.count({ where }),
  ]);

  return success({ trips, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "shipping:create_trip");

  const body = await request.json();
  const data = validateBody(TripCreateSchema.extend({ assignedDriverId: z.string().min(1).max(128).optional() }), body);
  const hub = await prisma.logisticsHub.findFirst({ where: { id: data.hubId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true } });
  if (!hub) throw new ApiError("Hub not found", 404);
  if (data.assignedDriverId) {
    const driver = await prisma.user.findFirst({ where: { id: data.assignedDriverId, tenantId: auth.tenantId, platformRole: "SHIPPING", status: "ACTIVE", deletedAt: null }, select: { id: true } });
    if (!driver) throw new ApiError("Active tenant driver not found", 404);
  }

  const tripNumber = `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const trip = await prisma.$transaction(async tx => {
  const created = await tx.trip.create({
    data: {
          tenantId: auth.tenantId,
      tripNumber,
      hubId: data.hubId,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      assignedDriverId: data.assignedDriverId,
      vehiclePlate: data.vehiclePlate,
      scheduledDate: new Date(data.scheduledDate),
      status: "SCHEDULED",
    },
    include: { hub: true },
  });

  await appendAuditEntry({
    entityId: created.id,
    actionType: "CREATE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    changes: { event: "TRIP_CREATED", driverName: created.driverName, assignedDriverId: created.assignedDriverId, vehiclePlate: created.vehiclePlate },
  }, tx);
  return created;
  });

  return success({ trip }, 201);
});
