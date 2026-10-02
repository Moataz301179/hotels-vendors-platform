import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, ApiError } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const authCtx = await authenticate(request);
    await requirePermission(authCtx, "admin:read");

    const period = request.nextUrl.searchParams.get("period") || "30d";
    const now = new Date();
    const startDate = new Date(now.getTime() - (period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365) * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalSuppliers, totalHotels, totalOrders, completedOrders, pendingOrders,
      totalRevenueResult, factoringVolumeResult, topSuppliers, topHotels, ordersByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.supplier.count(),
      prisma.hotel.count(),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: "DELIVERED", createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: "PENDING_APPROVAL", createdAt: { gte: startDate } } }),
      prisma.order.aggregate({
        where: { status: { in: ["DELIVERED", "CONFIRMED"] }, createdAt: { gte: startDate } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { factoringStatus: { in: ["ACCEPTED", "PAID"] }, createdAt: { gte: startDate } },
        _sum: { total: true },
      }),
      prisma.supplier.findMany({
        orderBy: { orders: { _count: "desc" } },
        take: 5,
        select: { id: true, name: true, _count: { select: { orders: true } } },
      }),
      prisma.hotel.findMany({
        orderBy: { orders: { _count: "desc" } },
        take: 5,
        select: { id: true, name: true, _count: { select: { orders: true } } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    const activeUsers = await prisma.user.count({
      where: { lastActive: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    });

    const totalRevenue = Number(totalRevenueResult._sum?.total ?? 0);
    const factoringVolume = Number(factoringVolumeResult._sum?.total ?? 0);
    const platformFees = Math.round(totalRevenue * 0.025);

    // Revenue by month
    const revenueByMonth: Array<{ month: string; revenue: number; fees: number }> = [];
    const months = period === "7d" ? 1 : period === "30d" ? 6 : period === "90d" ? 9 : 12;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthRevenue = await prisma.order.aggregate({
        where: { status: { in: ["DELIVERED", "CONFIRMED"] }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { total: true },
      });
      revenueByMonth.push({
        month: startOfMonth.toLocaleDateString("en-EG", { month: "short" }),
        revenue: Number(monthRevenue._sum.total ?? 0),
        fees: Math.round(Number(monthRevenue._sum.total ?? 0) * 0.025),
      });
    }

    // Top suppliers with revenue
    const supplierIds = topSuppliers.map((s) => s.id);
    const supplierRevenues = await prisma.order.aggregate({
      where: { supplierId: { in: supplierIds }, status: { in: ["DELIVERED", "CONFIRMED"] }, createdAt: { gte: startDate } },
      _sum: { total: true },
    });

    // Top hotels with spend
    const hotelIds = topHotels.map((h) => h.id);
    const hotelSpends = await prisma.order.aggregate({
      where: { hotelId: { in: hotelIds }, status: { in: ["DELIVERED", "CONFIRMED"] }, createdAt: { gte: startDate } },
      _sum: { total: true },
    });

    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousRevenue = await prisma.order.aggregate({
      where: { status: { in: ["DELIVERED", "CONFIRMED"] }, createdAt: { gte: previousPeriodStart, lt: startDate } },
      _sum: { total: true },
    });
    const prevTotal = Number(previousRevenue._sum?.total ?? 0);
    const monthlyGrowth = prevTotal > 0 ? Math.round(((totalRevenue - prevTotal) / prevTotal) * 1000) / 10 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalSuppliers,
        totalHotels,
        platformFees,
        factoringVolume,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        monthlyGrowth,
        activeUsers,
        pendingOrders,
        completedOrders,
        rejectedOrders: totalOrders - completedOrders - pendingOrders,
        topSuppliers: topSuppliers.map((s) => ({
          id: s.id,
          name: s.name,
          orders: s._count.orders,
          revenue: Number(supplierRevenues._sum.total ?? 0) > 0 
            ? Math.round((Number(supplierRevenues._sum.total ?? 0) * (s._count.orders / topSuppliers.reduce((sum, x) => sum + x._count.orders, 0))))
            : 0,
        })),
        topHotels: topHotels.map((h) => ({
          id: h.id,
          name: h.name,
          orders: h._count.orders,
          spend: Number(hotelSpends._sum.total ?? 0) > 0
            ? Math.round((Number(hotelSpends._sum.total ?? 0) * (h._count.orders / topHotels.reduce((sum, x) => sum + x._count.orders, 0))))
            : 0,
        })),
        revenueByMonth,
        ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
      },
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 403 });
    }
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
