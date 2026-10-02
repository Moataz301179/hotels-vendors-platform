/**
 * Admin Data Explorer API
 * Cross-tenant search across all platform entities.
 * ADMIN only — no tenant scoping.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, error as apiError } from "@/lib/api-utils";

const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
  users: ["createdAt", "name", "email", "lastActive"],
  suppliers: ["createdAt", "name", "city", "tier", "rating", "reviewCount"],
  hotels: ["createdAt", "name", "city", "starRating", "creditLimit"],
  orders: ["createdAt", "orderNumber", "total", "status", "deliveryDate"],
  products: ["createdAt", "name", "sku", "unitPrice", "stockQuantity"],
  invoices: ["createdAt", "invoiceNumber", "total", "issueDate", "status"],
  factoring: ["createdAt", "requestedAmount", "status", "riskScore"],
  leads: ["createdAt", "name", "priority", "status", "lastContactAt"],
};

const ExplorerQuerySchema = z.object({
  entity: z.enum(["users", "suppliers", "hotels", "orders", "products", "invoices", "factoring", "leads"]),
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const query = ExplorerQuerySchema.safeParse(params);

    if (!query.success) {
      return apiError("Invalid query parameters", 400);
    }

    const { entity, search, status, page, limit, sortOrder } = query.data;
    const allowedSort = ALLOWED_SORT_FIELDS[entity];
    const sortBy = allowedSort.includes(query.data.sortBy) ? query.data.sortBy : "createdAt";
    const skip = (page - 1) * limit;

    let data: unknown[] = [];
    let total = 0;

    // Helper to build where with proper enum typing
    const buildWhere = (searchFields: Record<string, unknown>, statusValue?: string) => {
      const where: Record<string, unknown> = { ...searchFields };
      if (statusValue) where.status = statusValue;
      return where;
    };

    switch (entity) {
      case "users": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.user.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              platformRole: true,
              role: true,
              status: true,
              createdAt: true,
              lastActive: true,
              tenant: { select: { name: true, type: true } },
              hotel: { select: { name: true } },
              supplier: { select: { name: true } },
              factoringCompany: { select: { name: true } },
            },
          }),
          prisma.user.count({ where: where as any }),
        ]);
        break;
      }

      case "suppliers": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                  { city: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.supplier.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              governorate: true,
              status: true,
              tier: true,
              rating: true,
              reviewCount: true,
              createdAt: true,
              tenant: { select: { name: true } },
              _count: { select: { products: true, orders: true } },
            },
          }),
          prisma.supplier.count({ where: where as any }),
        ]);
        break;
      }

      case "hotels": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { city: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.hotel.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              city: true,
              governorate: true,
              starRating: true,
              roomCount: true,
              tier: true,
              status: true,
              creditLimit: true,
              creditUsed: true,
              createdAt: true,
              tenant: { select: { name: true } },
              _count: { select: { orders: true, users: true } },
            },
          }),
          prisma.hotel.count({ where: where as any }),
        ]);
        break;
      }

      case "orders": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { orderNumber: { contains: search, mode: "insensitive" as const } },
                  { hotel: { name: { contains: search, mode: "insensitive" as const } } },
                  { supplier: { name: { contains: search, mode: "insensitive" as const } } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.order.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              currency: true,
              createdAt: true,
              deliveryDate: true,
              paymentGuaranteed: true,
              hotel: { select: { name: true } },
              supplier: { select: { name: true } },
              requester: { select: { name: true, email: true } },
              _count: { select: { items: true } },
            },
          }),
          prisma.order.count({ where: where as any }),
        ]);
        break;
      }

      case "products": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { sku: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.product.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              sku: true,
              name: true,
              category: true,
              unitPrice: true,
              currency: true,
              stockQuantity: true,
              status: true,
              createdAt: true,
              supplier: { select: { name: true } },
              tenant: { select: { name: true } },
            },
          }),
          prisma.product.count({ where: where as any }),
        ]);
        break;
      }

      case "invoices": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { invoiceNumber: { contains: search, mode: "insensitive" as const } },
                  { order: { orderNumber: { contains: search, mode: "insensitive" as const } } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.invoice.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              total: true,
              currency: true,
              issueDate: true,
              etaStatus: true,
              hotel: { select: { name: true } },
              supplier: { select: { name: true } },
              order: { select: { orderNumber: true } },
            },
          }),
          prisma.invoice.count({ where: where as any }),
        ]);
        break;
      }

      case "factoring": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { invoice: { invoiceNumber: { contains: search, mode: "insensitive" as const } } },
                  { factoringCompany: { name: { contains: search, mode: "insensitive" as const } } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.factoringRequest.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              status: true,
              requestedAmount: true,
              riskScore: true,
              riskTier: true,
              disbursedAmount: true,
              createdAt: true,
              invoice: { select: { invoiceNumber: true } },
              factoringCompany: { select: { name: true } },
            },
          }),
          prisma.factoringRequest.count({ where: where as any }),
        ]);
        break;
      }

      case "leads": {
        const where = buildWhere(
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                  { city: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {},
          status
        );
        [data, total] = await Promise.all([
          prisma.lead.findMany({
            where: where as any,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              entityType: true,
              city: true,
              governorate: true,
              status: true,
              priority: true,
              tier: true,
              source: true,
              createdAt: true,
              lastContactAt: true,
            },
          }),
          prisma.lead.count({ where: where as any }),
        ]);
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Admin Explorer] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch explorer data" },
      { status: 500 }
    );
  }
});
