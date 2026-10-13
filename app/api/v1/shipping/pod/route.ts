import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, validateBody, validateQuery, success, error, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import { captureDeliveryProof } from "@/lib/shipping/capture-proof";
import { ProofCaptureSchema } from "@/lib/shipping/proof-contract";
import { hasPermission } from "@/lib/auth/rbac";
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:capture_proof");
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) throw new ApiError("Proof upload is too large", 413);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new ApiError("Upload proof as multipart form data; public and device URLs are not accepted", 400);
  const form = await request.formData();
  const input = validateBody(ProofCaptureSchema, { stopId: form.get("stopId"), receivedBy: form.get("receivedBy"), notes: form.get("notes") || undefined, idempotencyKey: request.headers.get("x-idempotency-key") });
  const photo = form.get("photo");
  if (!photo || typeof photo === "string" || photo.size > 5 * 1024 * 1024) throw new ApiError("One proof photo up to 5 MB is required", 400);
  try {
    return success(await captureDeliveryProof(auth, input, Buffer.from(await photo.arrayBuffer()), photo.type));
  } catch (cause) {
    if ((cause as { code?: string }).code === "P2021" || (cause as { code?: string }).code === "P2022") return error("Delivery proof requires the approved carrier schema migration before use. No delivery was recorded.", 503);
    if (["P2002", "P2034"].includes((cause as { code?: string }).code || "")) return error("Proof capture conflicted with another request. Retry with the same idempotency key.", 409);
    throw cause;
  }
}, { rateLimit: "api" });
const QuerySchema = z.object({ tripId: z.string().min(1).max(128) });
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");
  const { tripId } = validateQuery(QuerySchema, request.nextUrl.searchParams);
  const trip = await prisma.trip.findFirst({ where: { id: tripId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true, assignedDriverId: true } });
  if (!trip) throw new ApiError("Trip not found", 404);
  const dispatcher = await hasPermission(auth, "shipping:create_trip");
  if (!dispatcher && (trip.assignedDriverId !== auth.userId || !await hasPermission(auth, "shipping:capture_proof"))) throw new ApiError("Proof access requires assigned driver or dispatcher permission", 403);
  const stops = await prisma.tripStop.findMany({
    where: { tripId, tenantId: auth.tenantId, deletedAt: null },
    select: { id: true, stopNumber: true, status: true, actualArrival: true, hotel: { select: { name: true } }, deliveryProofs: { select: { id: true, createdAt: true } } },
    orderBy: { stopOrder: "asc" },
  });
  const captured = stops.filter(stop => stop.deliveryProofs.length > 0).length;
  // Never expose legacy public proof URLs as private evidence.
  return success({ tripId, totalStops: stops.length, capturedStops: captured, percentComplete: stops.length ? Math.round(captured / stops.length * 100) : 0, stops, submissionAvailable: trip.assignedDriverId === auth.userId && await hasPermission(auth, "shipping:capture_proof"), message: "Capture records delivery evidence only. Order acceptance and trip completion are governed separately." });
}, { rateLimit: "api" });
