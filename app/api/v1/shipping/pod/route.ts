import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const PodSchema = z.object({
  stopId: z.string(),
  photoUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  receivedBy: z.string().min(1).optional(),
});

/**
 * POST /api/v1/shipping/pod — Submit proof-of-delivery for a trip stop.
 */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const validated = PodSchema.parse(body);

  // Verify the stop belongs to this tenant
  const stop = await prisma.tripStop.findFirst({
    where: {
      id: validated.stopId,
      tenantId: auth.tenantId,
    },
    include: {
      trip: { select: { id: true, tripNumber: true, status: true } },
    },
  });

  if (!stop) {
    throw new ApiError("Trip stop not found", 404);
  }

  // Update the stop with POD data
  const updatedStop = await prisma.tripStop.update({
    where: { id: validated.stopId },
    data: {
      podPhotoUrl: validated.photoUrl || stop.podPhotoUrl,
      signatureUrl: validated.signatureUrl || stop.signatureUrl,
      status: "POD_CAPTURED",
      actualArrival: new Date(),
      arrivedAt: new Date(),
    },
    include: {
      trip: { select: { id: true, tripNumber: true } },
      hotel: { select: { id: true, name: true } },
    },
  });

  // Check if all stops on this trip now have POD
  const allStops = await prisma.tripStop.findMany({
    where: { tripId: stop.tripId },
  });
  const allCaptured = allStops.every((s) => s.status === "POD_CAPTURED" || s.status === "DELIVERED");

  // Auto-complete trip if all stops have POD
  if (allCaptured && stop.trip.status !== "COMPLETED") {
    await prisma.trip.update({
      where: { id: stop.tripId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  return success({
    stop: updatedStop,
    tripComplete: allCaptured,
    message: allCaptured
      ? "All stops delivered — trip auto-completed"
      : "POD captured successfully",
  });
}, { rateLimit: "api" });

/**
 * GET /api/v1/shipping/pod?tripId=xxx — Get POD status for a trip.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");

  if (!tripId) {
    throw new ApiError("tripId query param required", 400);
  }

  const stops = await prisma.tripStop.findMany({
    where: {
      tripId,
      tenantId: auth.tenantId,
    },
    select: {
      id: true,
      stopNumber: true,
      status: true,
      podPhotoUrl: true,
      signatureUrl: true,
      actualArrival: true,
      hotel: { select: { name: true } },
    },
    orderBy: { stopOrder: "asc" },
  });

  const total = stops.length;
  const captured = stops.filter((s) => s.status === "POD_CAPTURED" || s.status === "DELIVERED").length;

  return success({
    tripId,
    totalStops: total,
    capturedStops: captured,
    percentComplete: total > 0 ? Math.round((captured / total) * 100) : 0,
    stops,
  });
}, { rateLimit: "api" });
