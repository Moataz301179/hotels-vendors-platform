import { NextRequest } from "next/server";
import { ProductCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, validateBody, validateQuery, success, ApiError } from "@/lib/api-utils";
import { requireAnyPermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
const Query = z.object({ supplierId: z.string().max(128).optional(), category: z.nativeEnum(ProductCategory).optional(), search: z.string().max(200).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
const Item = z.object({ sku: z.string().min(1).max(128), name: z.string().min(1).max(300), category: z.nativeEnum(ProductCategory), price: z.number().finite().positive(), quantity: z.number().int().nonnegative(), supplierId: z.string().min(1).max(128), unit: z.string().min(1).max(50).default("piece") });
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "product:read");
  const query = validateQuery(Query, request.nextUrl.searchParams);
  const where = { tenantId: auth.tenantId, deletedAt: null, source: { not: "FIXTURE" as const }, supplierId: query.supplierId, category: query.category, ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { sku: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
  const [products, total] = await Promise.all([prisma.product.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { createdAt: "desc" } }), prisma.product.count({ where })]);
  return success({ products: products.map(product => ({ id: product.id, sku: product.sku, name: product.name, category: product.category, price: product.unitPrice === null ? null : Number(product.unitPrice), quantity: product.stockQuantity, supplierId: product.supplierId, unit: product.unitOfMeasure, createdAt: product.createdAt, updatedAt: product.updatedAt })), meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
});
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requireAnyPermission(auth, ["product:create", "product:update"]);
  const input = validateBody(Item, await request.json());
  const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true } });
  if (!supplier) throw new ApiError("Supplier not found", 404);
  const existing = await prisma.product.findFirst({ where: { sku: input.sku, tenantId: auth.tenantId, supplierId: supplier.id, deletedAt: null }, select: { id: true } });
  await requirePermission(auth, existing ? "product:update" : "product:create");
  const result = await prisma.$transaction(async tx => {
    const data = { name: input.name, category: input.category, unitPrice: input.price, stockQuantity: input.quantity, unitOfMeasure: input.unit, source: "MANUAL" as const };
    const product = existing ? await tx.product.update({ where: { id: existing.id, tenantId: auth.tenantId }, data }) : await tx.product.create({ data: { ...data, sku: input.sku, supplierId: supplier.id, tenantId: auth.tenantId } });
    await appendAuditEntry({ tenantId: auth.tenantId, entityName: "PRODUCT", entityId: product.id, actionType: existing ? "UPDATE" : "CREATE", actorId: auth.userId, actorRole: auth.platformRole, changes: { source: "MANUAL", sku: product.sku, stockQuantity: product.stockQuantity } }, tx);
    return product;
  });
  return success({ product: result, action: existing ? "updated" : "created" }, existing ? 200 : 201);
});
