/**
 * /api/v1/suppliers/catalog-sync
 * REST / Webhook ingestion endpoint. External supplier ERPs push live catalog
 * batches; server normalizes → AI-enriches → idempotent DB upsert.
 *
 * POST  { providerKey, supplierId, products: ScrapedProduct[] }
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { enrichProduct, upsertCatalog } from "@/lib/ingestion/ingest";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();

  const supplierId = (body.supplierId as string) || "";
  const sourceId = (body.providerKey as string) || "erp-sync";
  const raw = Array.isArray(body.products) ? body.products : [];

  if (!supplierId) return error("supplierId is required", 400);
  if (raw.length === 0) return error("products[] must not be empty", 400);
  if (raw.length > 1000) return error("Batch too large (max 1000). Send in chunks.", 400);

  // Resolve the supplier's tenant
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId }, include: { tenant: true } });
  if (!supplier) return error("Supplier not found", 404);
  const tenantId = supplier.tenantId || auth.tenantId;

  // Normalize + AI enrich
  const enriched = raw.map((p: any) =>
    enrichProduct(
      {
        title: p.title || p.name || "",
        category: p.category,
        unit: p.unit || p.unitOfMeasure,
        priceEGP: p.priceEGP ?? p.unitPrice ?? 0,
        imageURL: p.imageURL || p.images,
        sku: p.sku || p.skuCode,
        supplierName: supplier.name,
      },
      tenantId
    )
  ).filter((p: any) => p.title && p.unitPrice > 0);

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
