import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Returns orders eligible for early 48h cash-out (reverse factoring).
 * Eligibility: order status CONFIRMED or IN_TRANSIT or DELIVERED, paymentGuaranteed=true.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "fintech:read");

  const query = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(query.get("limit") || "50"), 200);
  const cursor = query.get("cursor");

  const where: Record<string, unknown> = {
    tenantId: auth.tenantId,
    paymentGuaranteed: true,
    status: { in: ["CONFIRMED", "IN_TRANSIT", "DELIVERED"] },
  };

  if (query.get("status")) {
    where.status = query.get("status");
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      supplier: { select: { id: true, name: true } },
      items: { take: 3 },
    },
  });

  return success({
    eligibleOrders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total ?? 0),
      currency: o.currency ?? "EGP",
      paymentGuaranteed: o.paymentGuaranteed,
      createdAt: o.createdAt.toISOString(),
      estimatedDelivery: o.estimatedDelivery?.toISOString() ?? null,
    })),
    nextCursor: orders.length > 0 ? orders[orders.length - 1].id : null,
  });
});
