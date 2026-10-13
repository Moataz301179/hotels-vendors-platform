import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { adminTenantQuery } from "@/lib/validators/admin-directory";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePlatformAdmin(auth, "admin:manage_tenants");
  const { search, status, limit, page } = validateQuery(adminTenantQuery, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { deletedAt: null };
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
  }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
