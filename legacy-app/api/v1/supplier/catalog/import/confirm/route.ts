/**
 * POST /api/v1/supplier/catalog/import/confirm
 * Confirm enriched preview and create products in batch
 */

import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { getImportJob } from "@/lib/ai/catalog-importer";
import { z } from "zod";

const ConfirmSchema = z.object({
  jobId: z.string().min(1),
  rows: z.array(z.object({
    rowIndex: z.number(),
    sku: z.string().min(2),
    name: z.string().min(2),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
    shortDescriptionEn: z.string().optional(),
    shortDescriptionAr: z.string().optional(),
    category: z.enum(["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"]),
    subcategory: z.string().optional(),
    unitPrice: z.number().positive(),
    currency: z.string().default("EGP"),
    stockQuantity: z.number().int().min(0).default(0),
    minOrderQty: z.number().int().min(1).default(1),
    unitOfMeasure: z.string().default("piece"),
    leadTimeDays: z.number().int().min(1).default(1),
    shelfLifeDays: z.number().int().min(0).optional(),
    temperatureReq: z.boolean().optional(),
    tierPrices: z.array(z.object({
      minQty: z.number().int().min(1),
      maxQty: z.number().int().min(1).optional(),
      unitPrice: z.number().positive(),
      label: z.string(),
    })).optional(),
    images: z.array(z.string().url()).optional(),
  })).min(1),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "product:create");

  const body = await request.json();
  const { jobId, rows } = ConfirmSchema.parse(body);

  const job = getImportJob(jobId);

  if (!job) {
    return error("Job not found or expired", 404);
  }

  if (job.tenantId !== auth.tenantId && auth.platformRole !== "ADMIN") {
    return error("Access denied", 403);
  }

  if (job.status !== "preview_ready") {
    return error(`Job not ready for confirmation. Status: ${job.status}`, 400);
  }

  // Verify supplier
  const supplier = await prisma.supplier.findFirst({
    where: { tenantId: auth.tenantId },
    select: { id: true },
  });

  if (!supplier && auth.platformRole !== "ADMIN") {
    return error("No supplier found for your tenant", 403);
  }

  const supplierId = supplier?.id || auth.tenantId;

  // Batch create products
  const createdProducts = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const row of rows) {
      // Check SKU uniqueness
      const existing = await tx.product.findUnique({ where: { sku: row.sku } });
      if (existing) {
        throw new Error(`SKU "${row.sku}" already exists (row ${row.rowIndex})`);
      }

      // Create product
      const product = await tx.product.create({
        data: {
          tenantId: auth.tenantId,
          supplierId,
          sku: row.sku,
          name: row.name,
          description: row.descriptionEn || row.description || row.name,
          category: row.category,
          subcategory: row.subcategory,
          unitPrice: row.unitPrice,
          currency: row.currency,
          stockQuantity: row.stockQuantity,
          minOrderQty: row.minOrderQty,
          unitOfMeasure: row.unitOfMeasure,
          leadTimeDays: row.leadTimeDays,
          shelfLifeDays: row.shelfLifeDays ?? null,
          temperatureReq:
            row.temperatureReq === true
              ? "REQUIRED"
              : row.temperatureReq === false
                ? "AMBIENT"
                : (row.temperatureReq ?? null),
          images: row.images ? JSON.stringify(row.images) : null,
          status: "ACTIVE",
        },
      });

      // Create tier prices if provided
      if (row.tierPrices && row.tierPrices.length > 0) {
        await tx.productTierPrice.createMany({
          data: row.tierPrices.map((tp) => ({
            id: randomUUID(),
            productId: product.id,
            minQty: tp.minQty,
            unitPrice: tp.unitPrice,
          })),
          skipDuplicates: true,
        });
      }

      created.push(product);
    }

    return created;
  });

  // Update job status
  job.status = "completed";
  job.progress = 100;
  job.currentStep = `Created ${createdProducts.length} products`;
  job.updatedAt = new Date();

  // Audit log
  await audit({
    entityType: "CATALOG_IMPORT",
    entityId: jobId,
    action: "CONFIRM_CREATE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      createdCount: createdProducts.length,
      skus: createdProducts.map(p => p.sku),
    },
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    createdCount: createdProducts.length,
    products: createdProducts.map(p => ({ id: p.id, sku: p.sku, name: p.name })),
    message: `Successfully created ${createdProducts.length} products`,
  });
}, { rateLimit: "api" });