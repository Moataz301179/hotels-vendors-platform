/**
 * Carrier Registration & Management API
 * Handles carrier onboarding, zone selection, and profile management.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";

const RegisterCarrierSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  city: z.string().min(2),
  governorate: z.string().min(2),
  address: z.string().optional(),
  taxId: z.string().optional(),
  vehicleCount: z.number().int().min(1).max(100),
  zones: z.array(z.string()).min(1, "At least one delivery zone required"),
  vehicleTypes: z.array(z.string()).optional(), // Van, Truck, Motorcycle
  maxWeight: z.number().optional(), // kg per vehicle
  temperatureControlled: z.boolean().default(false),
});

const UpdateCarrierSchema = z.object({
  vehicleCount: z.number().int().min(1).max(100).optional(),
  zones: z.array(z.string()).optional(),
  vehicleTypes: z.array(z.string()).optional(),
  maxWeight: z.number().optional(),
  temperatureControlled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/shipping/carriers — List carriers
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // active, inactive, all
  const zone = searchParams.get("zone");

  const where: Record<string, unknown> = { tenantId: auth.tenantId, role: "LOGISTICS_COORDINATOR" };
  if (status === "active") where.status = "ACTIVE";
  if (status === "inactive") where.status = "INACTIVE";

  const carriers = await prisma.user.findMany({
    where,
    include: {
      carrierProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by zone if specified
  const filtered = zone
    ? carriers.filter((c) => {
        const zones = (c.carrierProfile?.zones as string[]) ?? [];
        return zones.includes(zone) || zones.includes("ALL");
      })
    : carriers;

  // Enrich with trip stats
  const enriched = await Promise.all(
    filtered.map(async (c) => {
      const [activeTrips, completedTrips, recentTrips] = await Promise.all([
        prisma.trip.count({
          where: { driverName: c.name, status: { in: ["SCHEDULED", "LOADING", "IN_TRANSIT"] } },
        }),
        prisma.trip.count({
          where: { driverName: c.name, status: "COMPLETED" },
        }),
        prisma.trip.findMany({
          where: { driverName: c.name, status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 20,
          select: { scheduledDate: true, arrivalDate: true },
        }),
      ]);

      const onTimeCount = recentTrips.filter((t) => {
        if (!t.arrivalDate || !t.scheduledDate) return true;
        return new Date(t.arrivalDate) <= new Date(t.scheduledDate);
      }).length;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        profile: c.carrierProfile,
        stats: {
          activeTrips,
          completedTrips,
          onTimeRate: recentTrips.length > 0 ? Math.round((onTimeCount / recentTrips.length) * 100) : 0,
          rating: c.carrierProfile?.rating ?? 0,
        },
      };
    })
  );

  return success({ carriers: enriched });
});

// POST /api/v1/shipping/carriers — Register new carrier
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  const body = await request.json();
  const data = RegisterCarrierSchema.parse(body);

  // Check if carrier already exists by email
  const existing = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existing) {
    return error("A user with this email already exists", 409);
  }

  // Create carrier user
  const carrier = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: "pending_setup",
      role: "LOGISTICS_COORDINATOR",
      platformRole: "SHIPPING",
      tenantId: auth.tenantId,
      status: "PENDING_VERIFICATION",
      roleId: (await prisma.role.findFirst({ where: { name: "Logistics Coordinator" } }))?.id ?? "",
    },
  });

  // Create carrier profile
  const profile = await prisma.carrierProfile.create({
    data: {
      userId: carrier.id,
      tenantId: auth.tenantId,
      city: data.city,
      governorate: data.governorate,
      address: data.address,
      taxId: data.taxId,
      vehicleCount: data.vehicleCount,
      zones: data.zones,
      vehicleTypes: data.vehicleTypes ?? [],
      maxWeight: data.maxWeight,
      temperatureControlled: data.temperatureControlled,
      status: "PENDING_VERIFICATION",
    },
  });

  return success({
    carrier: {
      id: carrier.id,
      name: carrier.name,
      email: carrier.email,
      status: profile.status,
    },
    message: "Carrier registered. Verification pending.",
  }, 201);
});
