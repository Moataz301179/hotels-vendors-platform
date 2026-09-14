import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateQuery, success, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "product:read");
  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  // Marketplace catalog: all active products from all suppliers
  const where: Record<string, unknown> = { status: "ACTIVE" };

  const search = request.nextUrl.searchParams.get("category");
  if (search) {
    where.category = search;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { supplier: { select: { id: true, name: true, tier: true, city: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return success({ products, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});
