/** Supplier feed ingestion and a persisted-catalog basket quote. Ordering uses canonical checkout. */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, validateBody, success, ApiError } from "@/lib/api-utils";
import { enrichProduct, upsertCatalog } from "@/lib/ingestion/ingest";
import { splitOrder, round2 } from "@/lib/dropshipping/aggregator";

const FeedSchema = z.object({ vendorId: z.string().min(1).max(128), items: z.array(z.object({ title: z.string().min(1).max(300), sku: z.string().min(1).max(128), category: z.string().max(100).optional(), unit: z.string().max(50).optional(), priceEGP: z.number().finite().positive(), imageURL: z.string().url().optional() })).min(1).max(1000) });
const BasketSchema = z.object({ lines: z.array(z.object({ sku: z.string().min(1).max(128), qty: z.number().int().positive().max(100000) })).min(1).max(100) }).strict();

export const POST = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ action: string }> }) => {
  const auth = await authenticate(request);
  const { action } = await params;
  if (action === "ingest") {
    await requirePermission(auth, "product:update");
    const data = validateBody(FeedSchema, await request.json());
    const supplier = await prisma.supplier.findFirst({ where: { id: data.vendorId, tenantId: auth.tenantId, deletedAt: null }, select: { id: true, name: true } });
    if (!supplier) throw new ApiError("Supplier not found", 404);
    const products = data.items.map(item => enrichProduct({ ...item, supplierName: supplier.name }, auth.tenantId));
    return success({ vendorId: supplier.id, ...await upsertCatalog(products, auth.tenantId, "aggregator-feed", supplier.id) }, 201);
  }
  if (action === "checkout") {
    await requirePermission(auth, "order:create");
    const { lines } = validateBody(BasketSchema, await request.json());
    const quantities = new Map<string, number>();
    for (const line of lines) quantities.set(line.sku, (quantities.get(line.sku) || 0) + line.qty);
    const products = await prisma.product.findMany({ where: { tenantId: auth.tenantId, sku: { in: [...quantities.keys()] }, deletedAt: null, status: "ACTIVE", source: { not: "FIXTURE" } }, select: { id: true, sku: true, supplierId: true, unitPrice: true, stockQuantity: true } });
    const basket = [...quantities].map(([sku, qty]) => {
      const product = products.find(item => item.sku === sku);
      if (!product || product.unitPrice === null) throw new ApiError(`Priced catalog product not found: ${sku}`, 404);
      if (product.stockQuantity < qty) throw new ApiError(`Insufficient available stock: ${sku}`, 409);
      return { productId: product.id, sku, qty, supplierId: product.supplierId, unitPrice: Number(product.unitPrice) };
    });
    const purchaseOrders = [...splitOrder(basket).values()].map(order => ({ ...order, totalEGP: round2(order.totalEGP), status: "QUOTE" }));
    return success({ status: "QUOTE", quoteOnly: true, orderCreated: false, stockReserved: false, splitInto: purchaseOrders.length, purchaseOrders, totalEGP: round2(purchaseOrders.reduce((sum, item) => sum + item.totalEGP, 0)), message: "Basket quote prepared from catalog prices. Submit through canonical checkout for approved orders and stock reservation." });
  }
  throw new ApiError("Unknown aggregator action", 404);
});
