import "server-only";
import { prisma } from "@/lib/prisma";
import { requireServerPermission } from "@/lib/auth/server-auth";
export interface ShippingDashboardData {
  deliveriesInTransit: number; onTimeRate: number | null;
  delayedDeliveries: number; fuelCostEstimate: number | null;
}
export async function loadShippingData(): Promise<ShippingDashboardData> {
  const user = await requireServerPermission("shipping:manage_trips");
  if (user.platformRole !== "SHIPPING") throw new Error("Shipping workspace required");
  const trips = await prisma.trip.findMany({ where: { tenantId: user.tenantId, deletedAt: null }, select: { status: true, stops: { where: { tenantId: user.tenantId, deletedAt: null }, select: { status: true, estimatedArrival: true, eta: true, actualArrival: true, arrivedAt: true } } } });
  const completed = trips.flatMap(trip => trip.stops).filter(stop => ["DELIVERED", "POD_CAPTURED"].includes(stop.status));
  const measured = completed.filter(stop => (stop.estimatedArrival || stop.eta) && (stop.actualArrival || stop.arrivedAt));
  const delayed = measured.filter(stop => (stop.actualArrival || stop.arrivedAt)!.getTime() > (stop.estimatedArrival || stop.eta)!.getTime()).length;
  return {
    deliveriesInTransit: trips.filter(trip => ["PICKED_UP", "LOADING", "IN_TRANSIT"].includes(trip.status)).length,
    onTimeRate: measured.length ? Math.round((measured.length - delayed) / measured.length * 100) : null,
    delayedDeliveries: delayed, fuelCostEstimate: null,
  };
}
