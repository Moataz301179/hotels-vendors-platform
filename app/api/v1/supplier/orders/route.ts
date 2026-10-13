import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateQuery, success, error, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");

  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const user = await prisma.user.findFirst({ where: { id: auth.userId, tenantId: auth.tenantId }, select: { supplierId: true } });
  if (!user?.supplierId) return error("Supplier profile not found", 404);
  const supplier = await prisma.supplier.findFirst({ where: { id: user.supplierId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true } });
  if (!supplier) return error("Supplier profile not found", 404);
  if (query.sortBy && !["createdAt", "orderNumber", "status", "total", "deliveryDate"].includes(query.sortBy)) return error("Invalid sort field", 400);
  // Buyer-owned orders are visible only to their authenticated supplier.
  const where = { supplierId: supplier.id, supplier: { tenantId: auth.tenantId }, deletedAt: null, ...(query.search ? { orderNumber: { contains: query.search } } : {}) };


  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        hotel: { select: { id: true, name: true, city: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        invoices: { select: { id: true, invoiceNumber: true, status: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return success({ orders, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});
