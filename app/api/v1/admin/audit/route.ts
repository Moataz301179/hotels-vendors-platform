import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read_audit");

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: { auditLogs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});
