import "server-only";
import { prisma } from "@/lib/prisma";
import { requireServerPermission } from "@/lib/auth/server-auth";
export interface SupplierDashboardData {
  productsListed: number; ordersReceived: number; revenueThisMonth: number | null;
  activeContracts: number | null; lowStockAlerts: number;
}
export async function loadSupplierData(supplierId: string): Promise<SupplierDashboardData> {
  const user = await requireServerPermission("order:read");
  if (user.platformRole !== "SUPPLIER") throw new Error("Supplier workspace required");
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, tenantId: user.tenantId, deletedAt: null }, select: { id: true } });
  if (!supplier) throw new Error("Supplier not found in authenticated tenant");
  const [productsListed, ordersReceived, lowStockAlerts] = await Promise.all([
    prisma.product.count({ where: { tenantId: user.tenantId, supplierId, deletedAt: null, status: "ACTIVE" } }),
    prisma.order.count({ where: { supplierId: supplier.id, deletedAt: null } }),
    prisma.product.count({ where: { tenantId: user.tenantId, supplierId, deletedAt: null, stockQuantity: { lte: 10 } } }),
  ]);
  // Sales orders are not collected revenue; contract instrumentation is not available.
  return { productsListed, ordersReceived, lowStockAlerts, revenueThisMonth: null, activeContracts: null };
}
