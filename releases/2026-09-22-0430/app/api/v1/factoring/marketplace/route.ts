/**
 * Factoring Marketplace — Browse invoices available for factoring
 *
 * GET:
 *  - Hotels: see their own invoices with factoringStatus = AVAILABLE
 *  - Factoring companies: see all AVAILABLE invoices across the tenant
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaginationSchema } from "@/lib/zod";
import {
  apiRoute,
  authenticate,
  validateQuery,
  success,
  requirePermission,
  tenantWhereClause,
} from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  // Build tenant-scoped base filter
  const baseWhere: Record<string, unknown> = {
    ...tenantWhereClause(auth.tenantId),
    factoringStatus: "AVAILABLE",
    status: "ISSUED",
  };

  // Role-based filtering
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { hotelId: true, supplierId: true, factoringCompanyId: true },
  });

  if (auth.platformRole === "HOTEL" && user?.hotelId) {
    baseWhere.hotelId = user.hotelId;
  }
  // SUPPLIER sees nothing in marketplace (they don't offer factoring)
  // FACTORING sees all AVAILABLE invoices (no additional filter)
  // ADMIN sees all

  const invoices = await prisma.invoice.findMany({
    where: baseWhere,
    orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      etaUuid: true,
      etaStatus: true,
      factoringStatus: true,
      hotel: { select: { id: true, name: true, tier: true, city: true } },
      supplier: { select: { id: true, name: true, city: true } },
      order: { select: { id: true, createdAt: true } },
      createdAt: true,
    },
  });

  const total = await prisma.invoice.count({ where: baseWhere });

  return success({
    invoices,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
});
