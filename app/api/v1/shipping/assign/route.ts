/**
 * Auto-Assignment API
 * POST /api/v1/shipping/assign — Assign carriers to orders
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, validateBody, validateQuery } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";
import { assignCarrier, batchAssign } from "@/lib/logistics/assign";
import { z } from "zod";

const AssignSingleSchema = z.object({
  orderId: z.string().min(1).max(128),
}).strict();

const AssignBatchSchema = z.object({
  orderIds: z.array(z.string().min(1).max(128)).min(1).max(50),
}).strict();

// POST /api/v1/shipping/assign — Assign carrier(s) to order(s)
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:create_trip");

  const data = validateBody(z.union([AssignSingleSchema, AssignBatchSchema]), await request.json());

  // Batch assignment
  if ("orderIds" in data) {
    const results = await batchAssign(data.orderIds, auth.tenantId, auth);

    const assigned = results.filter((r) => r.result !== null);
    const failed = results.filter((r) => r.result === null);

    return success({
      assigned: assigned.length,
      failed: failed.length,
      results,
    });
  }

  // Single assignment
  let result;
  try { result = await assignCarrier(data.orderId, auth.tenantId, auth); }
  catch (cause) {
    const code = (cause as { code?: string }).code;
    if (code === "P2021" || code === "P2022") return error("Carrier assignment requires the approved schema migration before use.", 503);
    if (code === "P2034" || code === "P2002") return error("Assignment conflicted with another request. Retry this order.", 409);
    throw cause;
  }

  if (!result) {
    return error("No eligible carrier found for this delivery zone", 404);
  }

  return success(result);
});

// GET /api/v1/shipping/assign?orderId=xxx — Check assignment status
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");

  const { orderId } = validateQuery(z.object({ orderId: z.string().min(1).max(128) }), request.nextUrl.searchParams);

  const stop = await prisma.tripStop.findFirst({
    where: { orderId, tenantId: auth.tenantId, deletedAt: null, trip: { tenantId: auth.tenantId, deletedAt: null } },
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
