import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [monthlyInvoices, yearlyInvoices, totalOrders, activeHotels, activeSuppliers] = await Promise.all([
    prisma.invoice.findMany({ where: { tenantId: auth.tenantId, createdAt: { gte: startOfMonth } }, select: { total: true } }),
    prisma.invoice.findMany({ where: { tenantId: auth.tenantId, createdAt: { gte: startOfYear } }, select: { total: true } }),
    prisma.order.count({ where: { tenantId: auth.tenantId } }),
    prisma.hotel.count({ where: { tenantId: auth.tenantId, status: "ACTIVE" } }),
    prisma.supplier.count({ where: { tenantId: auth.tenantId, status: "ACTIVE" } }),
  ]);

  const platformFeeRate = 0.025;
  const monthlyGmv = monthlyInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const yearlyGmv = yearlyInvoices.reduce((s, i) => s + Number(i.total || 0), 0);

  return success({
    fees: {
      monthlyGmv,
      yearlyGmv,
      monthlyPlatformFees: monthlyGmv * platformFeeRate,
      yearlyPlatformFees: yearlyGmv * platformFeeRate,
      platformFeeRate,
      totalOrders,
      activeHotels,
      activeSuppliers,
      avgOrderValue: totalOrders > 0 ? yearlyGmv / totalOrders : 0,
    },
  });
});
