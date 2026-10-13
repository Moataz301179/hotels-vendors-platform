import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { adminOrderQuery } from "@/lib/validators/admin-directory";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePlatformAdmin(auth, "admin:manage_tenants");
  const { status, limit, page } = validateQuery(adminOrderQuery, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { deletedAt: null, tenant: { deletedAt: null } };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        hotel: { select: { name: true } },
        supplier: { select: { name: true } },
        items: { take: 3, include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentGuaranteed: o.paymentGuaranteed,
        subtotal: o.subtotal,
        vat: o.vatAmount,
        total: o.total,
        hotelName: o.hotel?.name || "Unknown",
        supplierName: o.supplier?.name || "Unknown",
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
