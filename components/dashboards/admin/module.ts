import "server-only";
import { prisma } from "@/lib/prisma";
import { requireServerPermission } from "@/lib/auth/server-auth";
export interface AdminDashboardData {
  totalOrders: number; totalVendors: number; auditEntryCount: number;
  feeRevenue: number | null; crossTenantFlags: number | null;
}
export async function loadAdminData(): Promise<AdminDashboardData> {
  const user = await requireServerPermission("admin:manage_platform");
  if (user.platformRole !== "ADMIN") throw new Error("Platform administrator required");
  const where = { tenantId: user.tenantId, deletedAt: null };
  const [totalOrders, totalVendors, auditEntryCount] = await Promise.all([
    prisma.order.count({ where }), prisma.supplier.count({ where }),
    prisma.auditLog.count({ where: { tenantId: user.tenantId } }),
  ]);
  return { totalOrders, totalVendors, auditEntryCount, feeRevenue: null, crossTenantFlags: null };
}
