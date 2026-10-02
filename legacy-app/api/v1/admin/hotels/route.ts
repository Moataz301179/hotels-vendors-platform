import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        tenant: { select: { name: true } },
        _count: { select: { orders: true, users: true } },
      },
    }),
    prisma.hotel.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      hotels: hotels.map((h) => ({
        id: h.id,
        name: h.name,
        phone: h.phone,
        city: h.city,
        starRating: h.starRating,
        status: h.status,
        tenantName: h.tenant?.name,
        orderCount: h._count.orders,
        userCount: h._count.users,
        createdAt: h.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});
