import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalGmv,
    monthlyGmv,
    weeklyGmv,
    orderStats,
    topHotels,
    topSuppliers,
    categoryBreakdown,
    factoringStats,
    etaStats,
    userGrowth,
  ] = await Promise.all([
    // Total GMV
    prisma.order.aggregate({ _sum: { total: true } }),
    // Monthly GMV
    prisma.order.aggregate({ where: { createdAt: { gte: thirtyDaysAgo } }, _sum: { total: true } }),
    // Weekly GMV
    prisma.order.aggregate({ where: { createdAt: { gte: sevenDaysAgo } }, _sum: { total: true } }),
    // Order stats by status
    prisma.order.groupBy({ by: ["status"], _count: { id: true }, _sum: { total: true } }),
    // Top hotels by GMV
    prisma.order.groupBy({
      by: ["hotelId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    // Top suppliers by GMV
    prisma.order.groupBy({
      by: ["supplierId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    // Category breakdown (via products)
    prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    // Factoring stats
    prisma.factoringRequest.aggregate({
      _sum: { disbursedAmount: true, platformFee: true },
      _count: { id: true },
    }),
    // ETA stats
    prisma.invoice.groupBy({ by: ["etaStatus"], _count: { id: true } }),
    // User growth (last 30 days)
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  // Fetch names for top hotels/suppliers
  const hotelIds = topHotels.map((h) => h.hotelId).filter(Boolean);
  const supplierIds = topSuppliers.map((s) => s.supplierId).filter(Boolean);

  const [hotelsMap, suppliersMap] = await Promise.all([
    prisma.hotel.findMany({ where: { id: { in: hotelIds } }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } }),
  ]);

  const hotelNameMap = Object.fromEntries(hotelsMap.map((h) => [h.id, h.name]));
  const supplierNameMap = Object.fromEntries(suppliersMap.map((s) => [s.id, s.name]));

  return NextResponse.json({
    success: true,
    data: {
      gmv: {
        total: totalGmv._sum.total || 0,
        monthly: monthlyGmv._sum.total || 0,
        weekly: weeklyGmv._sum.total || 0,
      },
      orders: orderStats.map((s) => ({
        status: s.status,
        count: s._count.id,
        value: s._sum.total || 0,
      })),
      topHotels: topHotels.map((h) => ({
        id: h.hotelId,
        name: hotelNameMap[h.hotelId] || "Unknown",
        orderCount: h._count.id,
        gmv: h._sum.total || 0,
      })),
      topSuppliers: topSuppliers.map((s) => ({
        id: s.supplierId,
        name: supplierNameMap[s.supplierId] || "Unknown",
        orderCount: s._count.id,
        gmv: s._sum.total || 0,
      })),
      categories: categoryBreakdown.map((c) => ({
        category: c.category || "Uncategorized",
        count: c._count.id,
      })),
      factoring: {
        totalDisbursed: factoringStats._sum.disbursedAmount || 0,
        totalPlatformFees: factoringStats._sum.platformFee || 0,
        requestCount: factoringStats._count.id,
      },
      eta: etaStats.map((e) => ({ status: e.etaStatus, count: e._count.id })),
      userGrowth: {
        newUsers30d: userGrowth,
        totalUsers: await prisma.user.count(),
      },
    },
  });
});
