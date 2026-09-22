import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const [
    totalRevenue,
    monthlyRevenue,
    outstandingInvoices,
    recentTransactions,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["DELIVERED", "CONFIRMED"] } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") as month,
             SUM("total") as revenue,
             COUNT(*)::int as orders
      FROM "Order"
      WHERE status IN ('DELIVERED', 'CONFIRMED')
        AND "createdAt" > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
    prisma.invoice.aggregate({
      where: { paymentStatus: { in: ["UNPAID", "OVERDUE", "PARTIALLY_PAID"] } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["DELIVERED", "CONFIRMED"] } },
      include: {
        hotel: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const revenue = Number(totalRevenue._sum.total || 0);
  const platformFees = revenue * 0.025;

  return NextResponse.json({
    success: true,
    data: {
      totalRevenue: revenue,
      platformFees,
      outstandingInvoices: {
        total: Number(outstandingInvoices._sum.total || 0),
        count: outstandingInvoices._count.id,
      },
      monthlyRevenue: (monthlyRevenue as Array<{ month: Date; revenue: number; orders: number }>).map(
        (row) => ({
          month: row.month,
          revenue: Number(row.revenue || 0),
          orders: row.orders,
        })
      ),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        orderNumber: tx.orderNumber,
        total: Number(tx.total || 0),
        status: tx.status,
        createdAt: tx.createdAt,
        hotelName: tx.hotel?.name ?? "Unknown",
        supplierName: tx.supplier?.name ?? "Unknown",
      })),
      orderCount: totalRevenue._count.id,
    },
  });
});
