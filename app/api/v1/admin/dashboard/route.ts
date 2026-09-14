import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * Admin Dashboard Stats
 * Returns aggregated metrics for the admin dashboard
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  // Count stats scoped to tenant
  const [orders, suppliers, products, tenants, users] = await Promise.all([
    prisma.order.count({ where: { tenantId: auth.tenantId } }),
    prisma.supplier.count({ where: { tenantId: auth.tenantId } }),
    prisma.product.count({ where: { tenantId: auth.tenantId } }),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { tenantId: auth.tenantId } }),
  ]);

  return success({
    orders: { total: orders },
    suppliers: { total: suppliers },
    products: { total: products },
    tenants: { total: tenants },
    users: { total: users },
  });
});
