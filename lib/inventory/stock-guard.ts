/**
 * Stock Verification Guard — Anti-Cancellation Safeguard
 * HotelsVendors Platform
 *
 * Runs before order placement. Verifies every item in the cart
 * has sufficient stock. Returns items that are out-of-stock or
 * low stock with recommendations.
 *
 * Competitor Flaw Prevention: Prevents the #1 Egyptian B2B
 * complaint — "accepted order, then cancelled due to stock."
 * MaxAB, Cartona, and Suplyd all suffer from this.
 */

import { prisma } from "@/lib/prisma";

interface StockCheckItem {
  productId: string;
  sku: string;
  name: string;
  requestedQty: number;
}

interface StockCheckResult {
  allAvailable: boolean;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    requestedQty: number;
    availableStock: number;
    status: "available" | "low_stock" | "out_of_stock" | "partial";
    suggestedQty?: number;
    leadTimeDays: number;
    alternativeSupplierId?: string;
  }>;
}

const LOW_STOCK_THRESHOLD = 0.3; // 30% — if requested > 70% of available, flag

export async function verifyStockAvailability(
  items: StockCheckItem[],
  tenantId: string
): Promise<StockCheckResult> {
  const productIds = items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId, deletedAt: null },
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      leadTimeDays: true,
      minOrderQty: true,
      supplierId: true,
      status: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const checkedItems = items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product || product.status === "OUT_OF_STOCK" || product.status === "DISCONTINUED") {
      return {
        productId: item.productId,
        sku: item.sku || "UNKNOWN",
        name: item.name || "Unknown product",
        requestedQty: item.requestedQty,
        availableStock: 0,
        status: "out_of_stock" as const,
        leadTimeDays: 0,
      };
    }

    const available = product.stockQuantity;

    if (available === 0) {
      return {
        productId: item.productId,
        sku: product.sku,
        name: product.name,
        requestedQty: item.requestedQty,
        availableStock: 0,
        status: "out_of_stock" as const,
        leadTimeDays: product.leadTimeDays,
      };
    }

    if (item.requestedQty > available) {
      // Partial — can fulfill some
      return {
        productId: item.productId,
        sku: product.sku,
        name: product.name,
        requestedQty: item.requestedQty,
        availableStock: available,
        status: "partial" as const,
        suggestedQty: available,
        leadTimeDays: product.leadTimeDays,
      };
    }

    const ratio = item.requestedQty / available;
    if (ratio > LOW_STOCK_THRESHOLD) {
      // Low stock — available but running low
      return {
        productId: item.productId,
        sku: product.sku,
        name: product.name,
        requestedQty: item.requestedQty,
        availableStock: available,
        status: "low_stock" as const,
        suggestedQty: item.requestedQty,
        leadTimeDays: product.leadTimeDays,
      };
    }

    return {
      productId: item.productId,
      sku: product.sku,
      name: product.name,
      requestedQty: item.requestedQty,
      availableStock: available,
      status: "available" as const,
      leadTimeDays: product.leadTimeDays,
    };
  });

  const allAvailable = checkedItems.every((i) => i.status === "available" || i.status === "low_stock");

  return { allAvailable, items: checkedItems };
}

/**
 * Find alternative supplier for out-of-stock items.
 * Searches same category products with sufficient stock from different suppliers.
 */
export async function findAlternatives(productId: string, requestedQty: number, tenantId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: true, name: true },
  });

  if (!product) return [];

  return prisma.product.findMany({
    where: {
      category: product.category,
      stockQuantity: { gte: requestedQty },
      supplierId: { not: (await prisma.product.findUnique({ where: { id: productId }, select: { supplierId: true } }))?.supplierId || "" },
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      unitPrice: true,
      supplierId: true,
      supplier: { select: { name: true, rating: true } },
    },
    take: 3,
    orderBy: { stockQuantity: "desc" },
  });
}