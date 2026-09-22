import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  // Find products with price changes > 15% in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = await prisma.order.findMany({
    where: { tenantId: auth.tenantId, createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
    include: {
      items: { include: { product: true } },
      hotel: { select: { id: true, name: true, email: true } },
    },
  });

  // Aggregate by product to find average price
  const productPrices: Record<string, { prices: number[]; hotels: Set<string>; productName: string; supplierName: string }> = {};

  for (const order of recentOrders) {
    for (const item of order.items) {
      const pid = item.productId;
      if (!productPrices[pid]) {
        productPrices[pid] = {
          prices: [],
          hotels: new Set(),
          productName: item.product.name,
          supplierName: order.supplierId, // simplified
        };
      }
      productPrices[pid].prices.push(Number(item.unitPrice || 0));
      productPrices[pid].hotels.add(order.hotelId);
    }
  }

  const anomalies: Array<{
    productId: string;
    productName: string;
    avgPrice: number;
    currentPrice: number;
    percentChange: number;
    affectedHotels: number;
  }> = [];

  for (const [pid, data] of Object.entries(productPrices)) {
    if (data.prices.length < 3) continue;
    const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
    const current = data.prices[data.prices.length - 1];
    const change = Math.abs((current - avg) / avg) * 100;
    if (change > 15) {
      anomalies.push({
        productId: pid,
        productName: data.productName,
        avgPrice: Math.round(avg * 100) / 100,
        currentPrice: current,
        percentChange: Math.round(change * 100) / 100,
        affectedHotels: data.hotels.size,
      });
    }
  }

  return success({
    checkedAt: new Date().toISOString(),
    anomaliesFound: anomalies.length,
    anomalies,
  });
});
