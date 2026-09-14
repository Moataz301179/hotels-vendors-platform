/**
 * Admin Support Tickets API
 *
 * GET /api/v1/admin/support/tickets — admin lists ALL tickets
 * (requirePermission admin:manage_platform)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

const ListSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z.enum(["BILLING", "TECHNICAL", "ORDER", "SUPPLIER", "FACTORING", "ETA", "OTHER"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const { searchParams } = new URL(request.url);
  const parsed = ListSchema.safeParse({
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    category: searchParams.get("category") || undefined,
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "50",
  });
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid query parameters", 400);
  }
  const { status, priority, category, page, limit } = parsed.data;

  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return success({
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
