import "server-only";
import { prisma } from "@/lib/prisma";
import { requireServerPermission } from "@/lib/auth/server-auth";
export interface HotelDashboardData {
  openOrders: number; ordersInFulfillment: number; inventoryCritical: number;
  supplierCount: number; topSupplierId: string | null; monthlySpend: number;
}
export async function loadHotelData(): Promise<HotelDashboardData> {
  const user = await requireServerPermission("order:read");
  if (user.platformRole !== "HOTEL") throw new Error("Hotel workspace required");
  const where = { tenantId: user.tenantId, deletedAt: null };
  const since = new Date(); since.setUTCDate(1); since.setUTCHours(0, 0, 0, 0);
  const [openOrders, ordersInFulfillment, inventoryCritical, supplierCount, topSupplier, spend] = await Promise.all([
    prisma.order.count({ where: { ...where, status: "PENDING_APPROVAL" } }),
    prisma.order.count({ where: { ...where, status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED"] } } }),
    prisma.inventorySnapshot.count({ where: { ...where, projectedDays: { lte: 1 } } }),
    prisma.hotelSupplier.count({ where }),
    prisma.order.groupBy({ by: ["supplierId"], where, _count: { _all: true }, orderBy: { _count: { supplierId: "desc" } }, take: 1 }),
    prisma.order.aggregate({ where: { ...where, createdAt: { gte: since }, status: { in: ["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"] } }, _sum: { total: true } }),
  ]);
  return { openOrders, ordersInFulfillment, inventoryCritical, supplierCount, topSupplierId: topSupplier[0]?.supplierId ?? null, monthlySpend: Number(spend._sum.total ?? 0) };
}
