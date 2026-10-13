import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import { hasPermission } from "@/lib/auth/rbac";

export const GET = apiRoute(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");
  const { id } = z.object({ id: z.string().min(1).max(128) }).parse(await context.params);
  const proof = await prisma.deliveryProof.findFirst({ where: { id, tenantId: auth.tenantId, stop: { deletedAt: null, trip: { deletedAt: null, tenantId: auth.tenantId } } }, include: { stop: { select: { trip: { select: { assignedDriverId: true } } } } } });
  if (!proof) throw new ApiError("Delivery proof not found", 404);
  if (!await hasPermission(auth, "shipping:create_trip") && (proof.stop.trip.assignedDriverId !== auth.userId || !await hasPermission(auth, "shipping:capture_proof"))) throw new ApiError("Proof access requires assigned driver or dispatcher permission", 403);
  return new Response(new Uint8Array(proof.content), { headers: { "content-type": proof.mimeType, "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-disposition": "inline" } });
});
