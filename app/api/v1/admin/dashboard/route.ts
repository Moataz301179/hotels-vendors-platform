import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { z } from "zod";

/**
 * Admin Dashboard Stats
 * Returns aggregated metrics for the admin dashboard
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePlatformAdmin(auth, "admin:manage_tenants");
  validateQuery(z.object({}).strict(), request.nextUrl.searchParams);

  // Explicit platform exception: authorized active PLATFORM admin only.
  const [orders, suppliers, products, tenants, users] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null, tenant: { deletedAt: null } } }),
    prisma.supplier.count({ where: { deletedAt: null, tenant: { deletedAt: null } } }),
    prisma.product.count({ where: { deletedAt: null, tenant: { deletedAt: null } } }),
    prisma.tenant.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, tenant: { deletedAt: null } } }),
  ]);

  return NextResponse.json({ success: true, data: {
    scope: "platform",
    generatedAt: new Date().toISOString(),
    orders: { total: orders },
    suppliers: { total: suppliers },
    products: { total: products },
    tenants: { total: tenants },
    users: { total: users },
  } }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
