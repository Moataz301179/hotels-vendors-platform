/**
 * /api/v1/suppliers/catalog-sync
 * REST / Webhook ingestion endpoint. External supplier ERPs push live catalog
 * batches; server normalizes → AI-enriches → idempotent DB upsert.
 *
 * POST  { providerKey, supplierId, products: ScrapedProduct[] }
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, requirePermission, validateBody } from "@/lib/api-utils";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enrichProduct, upsertCatalog } from "@/lib/ingestion/ingest";

const ProductInput = z.object({ title: z.string().max(300).optional(), name: z.string().max(300).optional(), category: z.string().max(100).optional(), unit: z.string().max(50).optional(), unitOfMeasure: z.string().max(50).optional(), priceEGP: z.number().finite().nonnegative().optional(), unitPrice: z.number().finite().nonnegative().optional(), imageURL: z.string().url().optional(), images: z.union([z.string().url(), z.array(z.string().url())]).optional(), sku: z.string().max(128).optional(), skuCode: z.string().max(128).optional() }).refine(value => Boolean(value.title?.trim() || value.name?.trim()), "Product title is required");
const SyncInput = z.object({ supplierId: z.string().min(1).max(128), providerKey: z.string().min(1).max(128).default("erp-sync"), products: z.array(ProductInput).min(1).max(1000) });

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "product:update");
  const { supplierId, providerKey: sourceId, products: raw } = validateBody(SyncInput, await request.json());

  // Resolve the supplier's tenant
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, tenantId: auth.tenantId, deletedAt: null } });
  if (!supplier) return error("Supplier not found", 404);
  const tenantId = auth.tenantId;

  // Normalize + AI enrich
  const enriched = raw.map((p) =>
    enrichProduct(
      {
        title: p.title || p.name || "",
        category: p.category,
        unit: p.unit || p.unitOfMeasure,
        priceEGP: p.priceEGP ?? p.unitPrice ?? 0,
        imageURL: p.imageURL || (typeof p.images === "string" ? p.images : p.images?.[0]),
        sku: p.sku || p.skuCode,
        supplierName: supplier.name,
      },
      tenantId
    )
  ).filter((p) => p.title && p.unitPrice > 0);

  const result = await upsertCatalog(enriched, tenantId, sourceId, supplier.id);

  return success({
    providerKey: sourceId,
    supplierId,
    supplierName: supplier.name,
    received: raw.length,
    ...result,
    message: `Synced ${result.created} new + ${result.updated} updated products from ${sourceId}.`,
  }, 201);
});
