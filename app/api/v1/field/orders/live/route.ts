import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Live inbound order inbox for field/dispatch operators.
 * Returns recently created orders for the authenticated tenant that are
 * in early lifecycle stages (PENDING, APPROVED, CONFIRMED, IN_TRANSIT).
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");

  const query = request.nextUrl.searchParams;
  const status = query.get("status")?.toUpperCase() || "";
  const limit = Math.min(parseInt(query.get("limit") || "50"), 200);
  const cursor = query.get("cursor");

  const where: Record<string, unknown> = { tenantId: auth.tenantId };

  if (status) {
    where.status = status;
  } else {
    where.status = { in: ["PENDING", "APPROVED", "CONFIRMED", "IN_TRANSIT"] };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      supplier: { select: { id: true, name: true, city: true } },
      items: { take: 5, include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });

  return success({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total ?? 0),
      currency: o.currency ?? "EGP",
      createdAt: o.createdAt.toISOString(),
      supplier: o.supplier,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.product?.name ?? "",
        sku: i.product?.sku ?? "",
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice ?? 0),
      })),
    })),
    nextCursor: orders.length > 0 ? orders[orders.length - 1].id : null,
  });
});
