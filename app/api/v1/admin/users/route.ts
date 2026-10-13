import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, validateQuery } from "@/lib/api-utils";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { adminUserQuery } from "@/lib/validators/admin-directory";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePlatformAdmin(auth, "admin:manage_tenants");
  const { search, role, status, limit, page } = validateQuery(adminUserQuery, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { deletedAt: null, tenant: { deletedAt: null } };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.platformRole = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        assignedRole: { select: { id: true, name: true } },
        hotel: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        platformRole: u.platformRole,
        status: u.status,
        tenant: u.tenant,
        assignedRole: u.assignedRole,
        hotel: u.hotel,
        supplier: u.supplier,
        lastActive: u.lastActive,
        createdAt: u.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}, { rateLimit: "api" });
