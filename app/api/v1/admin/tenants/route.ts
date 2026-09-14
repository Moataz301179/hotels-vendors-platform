import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_tenants");

  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: {
          select: { users: true, hotels: true, suppliers: true },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { tenants, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});
