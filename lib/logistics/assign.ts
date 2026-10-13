/** Tenant-owned, verified driver assignment. No name-based identity or fabricated vehicles. */
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { ApiError } from "@/lib/api-utils";

interface AssignmentResult { carrierId: string; carrierName: string; tripId: string; estimatedDelivery: Date | null; score: number; reason: string; replayed: boolean }
interface AssignmentActor { userId: string; platformRole: string }

export async function assignCarrier(orderId: string, tenantId: string, actor: AssignmentActor): Promise<AssignmentResult | null> {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "tenantId" = ${tenantId} FOR UPDATE`;
    const order = await tx.order.findFirst({ where: { id: orderId, tenantId, deletedAt: null }, include: { hotel: { select: { city: true, governorate: true, id: true } } } });
    if (!order) throw new ApiError("Order not found", 404);
    if (!order.paymentGuaranteed || !["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED"].includes(order.status)) throw new ApiError("Order requires confirmed approval and payment guarantee before dispatch assignment", 409);
    const existing = await tx.tripStop.findFirst({ where: { orderId, tenantId, deletedAt: null, trip: { tenantId, deletedAt: null, status: { notIn: ["CANCELLED", "RETURNING"] } } }, include: { trip: { include: { assignedDriver: { select: { id: true, name: true } } } } } });
    if (existing) {
      if (!existing.trip.assignedDriver) throw new ApiError("Existing trip requires explicit authenticated driver assignment", 409);
      return { carrierId: existing.trip.assignedDriver.id, carrierName: existing.trip.assignedDriver.name, tripId: existing.trip.id, estimatedDelivery: existing.estimatedArrival, score: 0, reason: "Existing assignment", replayed: true };
    }
    const candidates = await tx.user.findMany({ where: { tenantId, platformRole: "SHIPPING", status: "ACTIVE", deletedAt: null, carrierProfile: { tenantId, deletedAt: null, status: { in: ["VERIFIED", "ACTIVE"] }, verifiedAt: { not: null } } }, include: { carrierProfile: true } });
    const eligible: { driver: typeof candidates[number]; score: number; reason: string }[] = [];
    for (const driver of candidates) {
      const profile = driver.carrierProfile;
      if (!profile || profile.tenantId !== tenantId || (profile.licenseExpiry && profile.licenseExpiry <= new Date()) || (profile.insuranceExpiry && profile.insuranceExpiry <= new Date())) continue;
      const cityMatch = profile.zones.includes(order.hotel.city);
      const governorateMatch = profile.zones.includes(order.hotel.governorate);
      if (!cityMatch && !governorateMatch && !profile.zones.includes("ALL")) continue;
      const active = await tx.trip.count({ where: { tenantId, assignedDriverId: driver.id, deletedAt: null, status: { in: ["SCHEDULED", "LOADING", "IN_TRANSIT"] } } });
      if (profile.vehicleCount < 1 || active >= profile.vehicleCount) continue;
      // Rating is usable only with recorded reviews; no guessed punctuality or reliability scores.
      const ratingPoints = profile.reviewCount > 0 ? Math.max(0, Math.min(5, profile.rating)) * 5 : 0;
      eligible.push({ driver, score: (cityMatch ? 60 : governorateMatch ? 40 : 20) + ratingPoints + (1 - active / profile.vehicleCount) * 15, reason: cityMatch ? "Verified city coverage" : governorateMatch ? "Verified governorate coverage" : "Verified national coverage" });
    }
    eligible.sort((a, b) => b.score - a.score || a.driver.id.localeCompare(b.driver.id));
    if (!eligible[0]) return null;
    const best = eligible[0];
    const zone = await tx.deliveryZone.findFirst({ where: { tenantId, zone: order.hotel.city, deletedAt: null } });
    const estimatedDelivery = zone ? new Date(Date.now() + Math.ceil((zone.minDays + zone.maxDays) / 2) * 86400000) : null;
    const trip = await tx.trip.create({ data: { tenantId, tripNumber: `TRP-${randomUUID()}`, assignedDriverId: best.driver.id, driverName: best.driver.name, driverPhone: best.driver.phone, vehiclePlate: null, scheduledDate: estimatedDelivery || new Date(), status: "SCHEDULED" } });
    const stop = await tx.tripStop.create({ data: { tripId: trip.id, hotelId: order.hotelId, orderId, tenantId, stopOrder: 1, stopNumber: 1, estimatedArrival: estimatedDelivery, status: "PENDING" } });
    await appendAuditEntry({ tenantId, entityName: "ORDER", entityId: orderId, actorId: actor.userId, actorRole: actor.platformRole, actionType: "UPDATE", changes: { event: "DRIVER_ASSIGNED", tripId: trip.id, stopId: stop.id, assignedDriverId: best.driver.id, vehiclePlate: null, estimatedDelivery: estimatedDelivery?.toISOString() || null } }, tx);
    return { carrierId: best.driver.id, carrierName: best.driver.name, tripId: trip.id, estimatedDelivery, score: Math.round(best.score * 10) / 10, reason: best.reason, replayed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function batchAssign(orderIds: string[], tenantId: string, actor: AssignmentActor) {
  const results: { orderId: string; result: AssignmentResult | null; error?: string }[] = [];
  for (const orderId of [...new Set(orderIds)]) {
    try { results.push({ orderId, result: await assignCarrier(orderId, tenantId, actor) }); }
    catch (cause) { results.push({ orderId, result: null, error: cause instanceof Error ? cause.message : "Assignment failed" }); }
  }
  return results;
}
