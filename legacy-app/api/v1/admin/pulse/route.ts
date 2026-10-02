import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  try {
    const [
      pendingApprovals,
      activeOrders,
      etaInvoices,
      creditLines,
      totalUsers,
      totalHotels,
      totalSuppliers,
      totalProducts,
      recentOrders,
      monthlySpend,
    ] = await Promise.all([
      // Pending approval orders
      prisma.order.count({ where: { status: "PENDING_APPROVAL" } }),
      // Active orders (confirmed or in transit)
      prisma.order.count({
        where: { status: { in: ["CONFIRMED", "IN_TRANSIT", "DELIVERED"] } },
      }),
      // Invoices with ETA submitted or accepted
      prisma.invoice.count({
        where: { etaStatus: { in: ["SUBMITTING", "ACCEPTED"] } },
      }),
      // Active credit facilities
      prisma.creditFacility.count({ where: { status: "ACTIVE" } }),
      // Total users
      prisma.user.count(),
      // Total hotels
      prisma.hotel.count(),
      // Total suppliers
      prisma.supplier.count(),
      // Total products
      prisma.product.count(),
      // Recent orders (last 30 days)
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Monthly spend (last 30 days, confirmed+ orders)
      prisma.order.aggregate({
        where: {
          status: { in: ["CONFIRMED", "IN_TRANSIT", "DELIVERED"] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingApprovals,
        activeOrders,
        etaInvoices,
        creditLines,
        totalUsers,
        totalHotels,
        totalSuppliers,
        totalProducts,
        recentOrders,
        monthlySpend: monthlySpend._sum.total || 0,
      },
    });
  } catch (error) {
    console.error("[Admin Pulse] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch platform metrics" },
      { status: 500 }
    );
  }
});
