/**
 * Auto-Assignment API
 * POST /api/v1/shipping/assign — Assign carriers to orders
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { assignCarrier, batchAssign } from "@/lib/logistics/assign";
import { z } from "zod";

const AssignSingleSchema = z.object({
  orderId: z.string().min(1),
});

const AssignBatchSchema = z.object({
  orderIds: z.array(z.string()).min(1).max(50),
});

// POST /api/v1/shipping/assign — Assign carrier(s) to order(s)
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:create_trip");

  const body = await request.json();

  // Batch assignment
  if (body.orderIds) {
    const data = AssignBatchSchema.parse(body);
    const results = await batchAssign(data.orderIds, auth.tenantId);

    const assigned = results.filter((r) => r.result !== null);
    const failed = results.filter((r) => r.result === null);

    return success({
      assigned: assigned.length,
      failed: failed.length,
      results,
    });
  }

  // Single assignment
  const data = AssignSingleSchema.parse(body);
  const result = await assignCarrier(data.orderId, auth.tenantId);

  if (!result) {
    return error("No eligible carrier found for this delivery zone", 404);
  }

  return success(result);
});

// GET /api/v1/shipping/assign?orderId=xxx — Check assignment status
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return error("orderId is required", 400);
  }

  const stop = await prisma.tripStop.findFirst({
    where: { orderId },
    include: {
      trip: {
        select: {
          tripNumber: true,
          driverName: true,
          driverPhone: true,
          vehiclePlate: true,
          status: true,
          scheduledDate: true,
        },
      },
    },
  });

  if (!stop) {
    return success({ assigned: false });
  }

  return success({
    assigned: true,
    trip: stop.trip ? {
      tripNumber: stop.trip.tripNumber,
      driverName: stop.trip.driverName,
      driverPhone: stop.trip.driverPhone,
      vehiclePlate: stop.trip.vehiclePlate,
      status: stop.trip.status,
      scheduledDate: stop.trip.scheduledDate,
    } : null,
    estimatedArrival: stop.estimatedArrival,
    stopStatus: stop.status,
  });
});
