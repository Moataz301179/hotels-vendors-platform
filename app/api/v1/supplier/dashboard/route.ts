import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");

  const supplier = await prisma.supplier.findFirst({ where: { tenantId: auth.tenantId } });
  const supplierId = supplier?.id;
  const orderWhere = supplierId
    ? { supplierId }
    : { tenantId: auth.tenantId };

  const [orderCounts, revenueAgg, productsCount, recentOrders, recentGrns, lowStock] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { ...orderWhere, deletedAt: null }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...orderWhere, deletedAt: null }, _sum: { total: true } }),
    prisma.product.count({ where: { tenantId: auth.tenantId, deletedAt: null } }),
    prisma.order.findMany({
      where: { ...orderWhere, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { hotel: { select: { name: true, city: true } } },
    }),
    prisma.goodsReceiptNote.findMany({
      where: supplierId ? { supplierId } : { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.product.findMany({
      where: { tenantId: auth.tenantId, deletedAt: null, stockQuantity: { lte: 10 } },
      select: { id: true, name: true, sku: true, stockQuantity: true, unitOfMeasure: true },
      orderBy: { stockQuantity: "asc" },
      take: 10,
    }),
  ]);

  const statusMap = Object.fromEntries(orderCounts.map((c) => [c.status, c._count._all]));
  const countOf = (key: string) => (statusMap[key] as number | undefined) || 0;

  const kpis = {
    totalOrders: orderCounts.reduce((s, c) => s + c._count._all, 0),
    pendingOrders: countOf("PENDING_APPROVAL"),
    approvedOrders: countOf("APPROVED") + countOf("CONFIRMED"),
    inTransitOrders: countOf("IN_TRANSIT"),
    deliveredOrders: countOf("DELIVERED"),
    totalRevenue: revenueAgg._sum.total ? Number(revenueAgg._sum.total) : 0,
    productsCount,
    lowStockCount: lowStock.length,
  };

  return success({
    kpis,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      poNumber: o.poNumber,
      status: o.status,
      total: o.total ? Number(o.total) : 0,
      currency: o.currency,
      createdAt: o.createdAt,
      deliveryDate: o.deliveryDate,
      hotelName: o.hotel?.name,
      hotelCity: o.hotel?.city,
    })),
    recentGrns: recentGrns.map((g) => ({
      id: g.id,
      grnNumber: g.grnNumber,
      status: g.status,
      receivedAt: g.receivedAt,
      orderNumber: g.order?.orderNumber,
    })),
    lowStock,
  });
});
