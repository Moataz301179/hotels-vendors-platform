import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { createReceivingBatch, discoverAndReceiveCatalog } from "@/lib/catalog/receiving/service";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";

const recordSchema = z.object({
  productUrl: z.string().url().optional().nullable(),
  externalId: z.string().max(300).optional().nullable(),
  sku: z.string().max(300).optional().nullable(),
  name: z.string().trim().min(2).max(500),
  description: z.string().max(8000).optional().nullable(),
  category: z.string().max(300).optional().nullable(),
  brand: z.string().max(300).optional().nullable(),
  packSize: z.string().max(200).optional().nullable(),
  unitOfMeasure: z.string().max(80).optional().nullable(),
  purchaseUnit: z.string().max(200).optional().nullable(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  currency: z.string().max(12).optional().nullable(),
  stockText: z.string().max(200).optional().nullable(),
  images: z.array(z.string().url()).max(8).optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
const requestSchema = z.object({
  sourceUrl: z.string().url().max(2000),
  sourceName: z.string().trim().min(2).max(200).optional(),
  supplierName: z.string().trim().min(2).max(200).optional(),
  supplierWebsite: z.string().url().optional(),
  sourceType: z.string().trim().min(2).max(80).default("MARKET_CATALOG"),
  sourceObservedAt: z.string().datetime().optional(),
  records: z.array(recordSchema).min(1).max(500).optional(),
});

async function adminActor() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  if (actor.platformRole !== "ADMIN") return { actor: null, response: NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }) };
  return { actor, response: null };
}

/** Admin-only receiving dock. Supplier, price and source evidence never enter buyer APIs. */
export async function GET(request: Request) {
  const { actor, response } = await adminActor();
  if (!actor) return response!;
  const batchId = new URL(request.url).searchParams.get("batchId");
  const batches = await prisma.catalogReceivingBatch.findMany({
    where: {
      tenantId: actor.tenantId,
      deletedAt: null,
      ...(batchId ? { id: batchId } : {}),
    },
    select: {
      id: true,
      sourceName: true,
      sourceUrl: true,
      sourceType: true,
      sourcePermissionStatus: true,
      sourceObservedAt: true,
      status: true,
      recordCount: true,
      acceptedCount: true,
      rejectedCount: true,
      exportedCount: true,
      receivedAt: true,
      agentRuns: {
        select: {
          id: true,
          stage: true,
          engineVersion: true,
          inputCount: true,
          acceptedCount: true,
          rejectedCount: true,
          reviewCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
  const records = batchId ? await prisma.catalogReceivingRecord.findMany({
    where: { batchId, batch: { tenantId: actor.tenantId }, deletedAt: null },
    select: {
      id: true,
      rawSupplierName: true,
      rawSupplierWebsite: true,
      rawProductName: true,
      rawProductDescription: true,
      rawCategory: true,
      rawSku: true,
      rawBrand: true,
      rawPackSize: true,
      rawUnitOfMeasure: true,
      rawPurchaseUnit: true,
      observedPrice: true,
      observedCurrency: true,
      productUrl: true,
      imageUrls: true,
      approvedImageUrls: true,
      imageQualityOutput: true,
      qualityStatus: true,
      taxonomyStatus: true,
      qualityOutput: true,
      taxonomyOutput: true,
      normalizedName: true,
      mappedCategoryCode: true,
      mappedSubcategoryCode: true,
      normalizedUnitOfMeasure: true,
      directoryCandidateId: true,
      exportedAt: true,
      receivedAt: true,
    },
    orderBy: { receivedAt: "asc" },
    take: 500,
  }) : [];
  return NextResponse.json({ batches, records });
}

export async function POST(request: Request) {
  const { actor, response } = await adminActor();
  if (!actor) return response!;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALID_SOURCE_URL_AND_PRODUCT_RECORDS_REQUIRED" }, { status: 400 });

  try {
    if (parsed.data.records) {
      const records = parsed.data.records.map((row) => ({
        ...row,
        sourceUrl: parsed.data.sourceUrl,
        sourceName: parsed.data.sourceName || parsed.data.supplierName || new URL(parsed.data.sourceUrl).hostname,
        sourceType: parsed.data.sourceType,
        supplierName: parsed.data.supplierName,
        supplierWebsite: parsed.data.supplierWebsite,
      })) as RawCatalogObservation[];
      const batch = await createReceivingBatch(prisma, actor, {
        sourceName: parsed.data.sourceName || parsed.data.supplierName || new URL(parsed.data.sourceUrl).hostname,
        sourceUrl: parsed.data.sourceUrl,
        sourceType: parsed.data.sourceType,
        sourceObservedAt: parsed.data.sourceObservedAt,
        supplierName: parsed.data.supplierName,
        supplierWebsite: parsed.data.supplierWebsite,
        records,
      });
      return NextResponse.json({ batch, intakeMode: "STRUCTURED_RECORDS" }, { status: 201 });
    }

    const batch = await discoverAndReceiveCatalog(prisma, actor, {
      sourceUrl: parsed.data.sourceUrl,
      supplierName: parsed.data.supplierName,
      sourceName: parsed.data.sourceName,
      sourceType: parsed.data.sourceType,
    });
    return NextResponse.json({ batch, intakeMode: "PUBLIC_CATALOG_DISCOVERY" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RECEIVING_DOCK_FAILED";
    const status = message === "RECEIVING_BATCH_MUST_CONTAIN_1_TO_500_RECORDS" ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
