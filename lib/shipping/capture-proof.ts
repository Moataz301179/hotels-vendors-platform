import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, type AuthContext } from "@/lib/api-utils";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { ProofCaptureSchema, validProofImage } from "./proof-contract";

export async function captureDeliveryProof(auth: AuthContext, input: unknown, content: Buffer, mimeType: string) {
  const data = ProofCaptureSchema.parse(input);
  if (!validProofImage(content, mimeType)) throw new ApiError("A JPEG, PNG or WebP image up to 5 MB is required", 400);
  const sha256 = createHash("sha256").update(content).digest("hex");
  return prisma.$transaction(async tx => {
    // Lock the stop before checking completion/idempotency to serialize competing captures.
    await tx.$queryRaw`SELECT "id" FROM "TripStop" WHERE "id" = ${data.stopId} AND "tenantId" = ${auth.tenantId} FOR UPDATE`;
    const stop = await tx.tripStop.findFirst({ where: { id: data.stopId, tenantId: auth.tenantId, deletedAt: null }, include: { trip: true } });
    if (!stop || stop.trip.deletedAt || stop.trip.tenantId !== auth.tenantId) throw new ApiError("Delivery stop not found", 404);
    if (stop.trip.assignedDriverId !== auth.userId) throw new ApiError("Only the authenticated assigned driver can capture this proof", 403);
    const prior = await tx.deliveryProof.findUnique({ where: { tenantId_uploadedById_idempotencyKey: { tenantId: auth.tenantId, uploadedById: auth.userId, idempotencyKey: data.idempotencyKey } } });
    if (prior) {
      if (prior.stopId !== data.stopId || prior.sha256 !== sha256 || prior.receivedBy !== data.receivedBy || (prior.notes || "") !== (data.notes || "")) throw new ApiError("Idempotency key was used for different proof", 409);
      return { proofId: prior.id, stopId: prior.stopId, status: "POD_CAPTURED", replayed: true };
    }
    if (!["PENDING", "ARRIVED"].includes(stop.status)) throw new ApiError("Proof already recorded or stop is not eligible", 409);
    if (["CANCELLED", "COMPLETED", "RETURNING"].includes(stop.trip.status)) throw new ApiError("Trip is not eligible for proof capture", 409);
    const proof = await tx.deliveryProof.create({ data: { tenantId: auth.tenantId, uploadedById: auth.userId, stopId: stop.id, idempotencyKey: data.idempotencyKey, content: new Uint8Array(content), mimeType, sha256, receivedBy: data.receivedBy, notes: data.notes } });
    await tx.tripStop.updateMany({ where: { id: stop.id, tenantId: auth.tenantId, deletedAt: null }, data: { status: "POD_CAPTURED", actualArrival: stop.actualArrival || new Date() } });
    // Audit is mandatory inside this same transaction; failure rolls the evidence and status back.
    const changes = { event: "DELIVERY_PROOF_CAPTURED", tripId: stop.tripId, stopId: stop.id, proofId: proof.id, sha256, before: { status: stop.status }, after: { status: "POD_CAPTURED" } };
    await appendAuditEntry({ entityName: stop.orderId ? "ORDER" : undefined, entityId: stop.orderId || stop.id, actionType: "UPDATE", actorId: auth.userId, actorRole: auth.platformRole, changes, tenantId: auth.tenantId }, tx);
    // Capturing evidence does not deliver an order or complete a trip; those have separate governance gates.
    return { proofId: proof.id, stopId: stop.id, status: "POD_CAPTURED", replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
