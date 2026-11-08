import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { discoverSupplierCatalogWithScrapeGraph } from "@/lib/sourcing/scrapegraph-discovery";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { directoryFingerprint, directorySearchText, normalizeDirectoryText } from "@/lib/directory/catalog-normalization";
import { runQualityFilterAgent, QUALITY_FILTER_AGENT_VERSION } from "@/lib/catalog/receiving/quality-filter-agent";
import { runHospitalityTaxonomyAgent, HOSPITALITY_TAXONOMY_AGENT_VERSION } from "@/lib/catalog/receiving/hospitality-taxonomy-agent";
import { fetchAndAssessProductImage, PRODUCT_IMAGE_OUTPUT } from "@/lib/catalog/receiving/product-image-enhancer";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";

export type ReceivingActor = { id: string; tenantId: string; platformRole: string };
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

const CATEGORY_LABELS: Record<string, string> = {
  FOOD_BEVERAGE: "Food & Beverage",
  HOUSEKEEPING_LAUNDRY: "Housekeeping & Laundry",
  GUEST_ROOMS_AMENITIES: "Guest Rooms & Amenities",
  ENGINEERING_MRO: "Engineering & Maintenance",
  FFE: "Furniture, Fixtures & Equipment",
  SAFETY_SECURITY: "Safety & Security",
  ICT_AV: "Hotel Technology & AV",
  UNIFORMS: "Uniforms & Workwear",
};

function subcategoryLabel(code: string): string {
  return code.toLocaleLowerCase("en").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function safePublicSpecifications(value: Record<string, string | number>): Record<string, string | number> {
  const allowed = new Set(["material", "dimensions", "capacity", "composition", "colour", "color", "weight", "technicalSpecification"]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowed.has(key)));
}

function safeNeutralDescription(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:supplier|vendor|source|price|stock|availability|offer|quotation|quote|manufacturer|contact|phone|email)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function isSafePublicSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch { return false; }
}

function stableSourceRecordKey(record: RawCatalogObservation): string {
  return clean(record.externalId) || clean(record.sku) || clean(record.productUrl) || normalizeDirectoryText(record.name);
}

export async function createReceivingBatch(
  prisma: PrismaClient,
  actor: ReceivingActor,
  input: {
    sourceName: string;
    sourceUrl: string;
    sourceType: string;
    sourceObservedAt?: string;
    supplierName?: string;
    supplierWebsite?: string;
    records: RawCatalogObservation[];
  },
) {
  if (!isSafePublicSourceUrl(input.sourceUrl)) throw new Error("HTTPS_PUBLIC_SOURCE_URL_REQUIRED");
  if (!input.records.length || input.records.length > 500) throw new Error("RECEIVING_BATCH_MUST_CONTAIN_1_TO_500_RECORDS");
  const observedAt = input.sourceObservedAt ? new Date(input.sourceObservedAt) : new Date();
  if (Number.isNaN(observedAt.getTime()) || observedAt.getTime() > Date.now() + 5 * 60_000) throw new Error("INVALID_SOURCE_OBSERVED_AT");

  const normalized = input.records.map((record) => ({
    ...record,
    sourceUrl: input.sourceUrl,
    sourceName: input.sourceName,
    sourceType: input.sourceType,
    supplierName: record.supplierName || input.supplierName || null,
    supplierWebsite: record.supplierWebsite || input.supplierWebsite || null,
    currency: record.currency || "EGP",
  }));
  const payloadChecksum = sha256(JSON.stringify(normalized));
  const existing = await prisma.catalogReceivingBatch.findUnique({
    where: { tenantId_payloadChecksum: { tenantId: actor.tenantId, payloadChecksum } },
    select: { id: true, status: true, recordCount: true },
  });
  if (existing) return { ...existing, idempotent: true };

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.catalogReceivingBatch.create({
      data: {
        tenantId: actor.tenantId,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: input.sourceType,
        sourceObservedAt: observedAt,
        payloadChecksum,
        receivedById: actor.id,
        recordCount: normalized.length,
        status: "RECEIVED",
      },
      select: { id: true, status: true, recordCount: true },
    });
    await tx.catalogReceivingRecord.createMany({
      data: normalized.map((record) => {
        const recordKey = stableSourceRecordKey(record);
        const dedupeKey = sha256([
          clean(record.supplierWebsite) || clean(record.supplierName) || new URL(input.sourceUrl).hostname,
          recordKey,
        ].map((value) => value.toLocaleLowerCase("en")).join("\u001f"));
        return {
          batchId: created.id,
          sourceRecordKey: recordKey.slice(0, 300),
          dedupeKey,
          productUrl: clean(record.productUrl) || null,
          rawSupplierName: clean(record.supplierName) || null,
          rawSupplierWebsite: clean(record.supplierWebsite) || null,
          rawProductName: record.name.trim(),
          rawProductDescription: clean(record.description) || null,
          rawCategory: clean(record.category) || null,
          rawSku: clean(record.sku) || null,
          rawBrand: clean(record.brand) || null,
          rawPackSize: clean(record.packSize) || null,
          rawUnitOfMeasure: clean(record.unitOfMeasure) || null,
          rawPurchaseUnit: clean(record.purchaseUnit) || null,
          observedPrice: record.unitPrice ?? null,
          observedCurrency: record.currency || "EGP",
          rawStockText: clean(record.stockText) || null,
          imageUrls: (record.images ?? []).filter((url) => /^https:\/\//i.test(url)).slice(0, 8),
          rawPayload: toJson(record),
        };
      }),
    });
    await appendAuditEntry({
      entityName: "EVIDENCE",
      entityId: created.id,
      actionType: "CREATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: {
        event: "CATALOG_RECEIVING_BATCH_CREATED",
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: input.sourceType,
        payloadChecksum,
        recordCount: normalized.length,
        sourcePermissionStatus: "PERMISSION_UNKNOWN",
      },
    }, tx);
    return created;
  });
  return { ...batch, idempotent: false };
}

export async function discoverAndReceiveCatalog(
  prisma: PrismaClient,
  actor: ReceivingActor,
  input: { sourceUrl: string; supplierName?: string; sourceName?: string; sourceType?: string },
) {
  if (!isSafePublicSourceUrl(input.sourceUrl)) throw new Error("HTTPS_PUBLIC_SOURCE_URL_REQUIRED");
  const discovery = await discoverSupplierCatalogWithScrapeGraph({
    sourceUrl: input.sourceUrl,
    supplierName: input.supplierName,
  });
  if (!discovery.products.length) throw new Error("NO_INDIVIDUAL_PRODUCT_RECORDS_FOUND");
  const records: RawCatalogObservation[] = discovery.products.map((product) => ({
    sourceUrl: discovery.canonicalUrl,
    productUrl: product.productUrl ?? null,
    sourceName: input.sourceName || discovery.supplierName,
    sourceType: input.sourceType || "PUBLIC_CATALOG_OBSERVATION",
    supplierName: discovery.supplierName,
    supplierWebsite: new URL(discovery.canonicalUrl).origin,
    externalId: product.externalId ?? null,
    sku: product.sku ?? null,
    name: product.name,
    description: product.description ?? null,
    category: product.category ?? null,
    brand: product.brand ?? null,
    packSize: product.packSize ?? null,
    unitOfMeasure: product.unitOfMeasure ?? null,
    purchaseUnit: product.purchaseUnit ?? null,
    attributes: product.attributes ?? undefined,
    unitPrice: product.unitPrice ?? null,
    currency: product.currency || "EGP",
    stockText: product.stockQuantity == null ? null : String(product.stockQuantity),
    images: product.images ?? [],
  }));
  const batch = await createReceivingBatch(prisma, actor, {
    sourceName: input.sourceName || discovery.supplierName,
    sourceUrl: discovery.canonicalUrl,
    sourceType: input.sourceType || "PUBLIC_CATALOG_OBSERVATION",
    sourceObservedAt: discovery.observedAt,
    supplierName: discovery.supplierName,
    supplierWebsite: new URL(discovery.canonicalUrl).origin,
    records,
  });
  return {
    ...batch,
    discoveredCount: discovery.products.length,
    schemaVersion: discovery.schemaVersion,
    responseHash: discovery.responseHash,
  };
}

export async function processReceivingBatch(prisma: PrismaClient, actor: ReceivingActor, batchId: string) {
  const batch = await prisma.catalogReceivingBatch.findFirst({
    where: { id: batchId, tenantId: actor.tenantId, deletedAt: null },
    include: { records: { where: { deletedAt: null }, orderBy: { receivedAt: "asc" } } },
  });
  if (!batch) throw new Error("RECEIVING_BATCH_NOT_FOUND");
  if (batch.status === "EXPORTED") throw new Error("RECEIVING_BATCH_ALREADY_EXPORTED");
  const pending = batch.records.filter((record) => record.qualityStatus === "PENDING" || record.taxonomyStatus === "PENDING");
  if (!pending.length) {
    return {
      batchId,
      processed: 0,
      accepted: batch.acceptedCount,
      rejected: batch.rejectedCount,
      status: batch.status,
    };
  }

  const previousKeys = await prisma.catalogReceivingRecord.findMany({
    where: {
      batchId: { not: batchId },
      dedupeKey: { in: pending.map((row) => row.dedupeKey) },
      deletedAt: null,
      qualityStatus: "ACCEPTED",
      batch: { tenantId: actor.tenantId },
    },
    select: { dedupeKey: true },
    take: 5000,
  });
  // Duplicate checks span earlier batches in this tenant as well as the
  // current upload, while the original raw row remains available for audit.
  const seen = new Set<string>(previousKeys.map((row) => row.dedupeKey));
  const qualityOutcomes: Array<Record<string, unknown>> = [];
  const taxonomyOutcomes: Array<Record<string, unknown>> = [];
  for (const row of pending) {
    const raw = row.rawPayload as Record<string, unknown>;
    const observation: RawCatalogObservation = {
      sourceUrl: batch.sourceUrl,
      productUrl: row.productUrl,
      sourceName: batch.sourceName,
      sourceType: batch.sourceType,
      supplierName: row.rawSupplierName,
      supplierWebsite: row.rawSupplierWebsite,
      externalId: typeof raw.externalId === "string" ? raw.externalId : row.sourceRecordKey,
      sku: row.rawSku,
      name: row.rawProductName,
      description: row.rawProductDescription,
      category: row.rawCategory,
      brand: row.rawBrand,
      packSize: row.rawPackSize,
      unitOfMeasure: row.rawUnitOfMeasure,
      purchaseUnit: row.rawPurchaseUnit,
      unitPrice: row.observedPrice == null ? null : Number(row.observedPrice),
      currency: row.observedCurrency,
      stockText: row.rawStockText,
      images: row.imageUrls,
      attributes: raw.attributes && typeof raw.attributes === "object"
        ? raw.attributes as Record<string, string | number | boolean>
        : undefined,
    };
    const quality = runQualityFilterAgent(observation, { duplicateInBatch: seen.has(row.dedupeKey) });
    seen.add(row.dedupeKey);

    let taxonomy = null;
    if (quality.status === "ACCEPTED") taxonomy = runHospitalityTaxonomyAgent(observation);

    const imageResults = [];
    const approvedImageUrls: string[] = [];
    const sourceCandidates = [batch.sourceUrl, row.rawSupplierWebsite || ""];
    for (const imageUrl of row.imageUrls.slice(0, 8)) {
      const assessed = await fetchAndAssessProductImage(imageUrl, sourceCandidates);
      imageResults.push(assessed.assessment);
      if (assessed.assessment.status === "ACCEPTED") approvedImageUrls.push(imageUrl);
    }

    const taxonomyStatus = taxonomy?.status === "MAPPED" ? "MAPPED" : "REVIEW_REQUIRED";
    const updated = await prisma.catalogReceivingRecord.update({
      where: { id: row.id },
      data: {
        qualityStatus: quality.status,
        taxonomyStatus,
        qualityOutput: toJson({
          ...quality,
          engineVersion: QUALITY_FILTER_AGENT_VERSION,
          productFieldsAreEnrichmentNotAcceptanceGates: true,
        }),
        taxonomyOutput: taxonomy
          ? toJson({ ...taxonomy, engineVersion: HOSPITALITY_TAXONOMY_AGENT_VERSION })
          : undefined,
        normalizedName: taxonomy?.normalizedName ?? null,
        normalizedDescription: taxonomy?.normalizedDescription ?? null,
        mappedCategoryCode: taxonomy?.categoryCode ?? null,
        mappedSubcategoryCode: taxonomy?.subcategoryCode ?? null,
        normalizedUnitOfMeasure: taxonomy?.unitOfMeasure ?? null,
        normalizedPurchaseUnit: taxonomy?.purchaseUnit ?? null,
        normalizedSpecifications: taxonomy ? toJson(taxonomy.specifications) : undefined,
        approvedImageUrls,
        imageQualityOutput: toJson({
          enhancer: PRODUCT_IMAGE_OUTPUT.enhancer,
          output: PRODUCT_IMAGE_OUTPUT,
          totalObserved: imageResults.length,
          approvedCount: approvedImageUrls.length,
          assessments: imageResults,
        }),
        processedAt: new Date(),
      },
      select: { id: true, qualityStatus: true, taxonomyStatus: true },
    });
    qualityOutcomes.push({
      recordId: updated.id,
      status: updated.qualityStatus,
      reasons: quality.reasons,
      flags: quality.flags,
    });
    taxonomyOutcomes.push({
      recordId: updated.id,
      status: taxonomy?.status ?? "SKIPPED",
      categoryCode: taxonomy?.categoryCode ?? null,
      subcategoryCode: taxonomy?.subcategoryCode ?? null,
      reasons: taxonomy?.reasons ?? [],
    });
  }

  const totalAccepted = await prisma.catalogReceivingRecord.count({
    where: { batchId, deletedAt: null, qualityStatus: "ACCEPTED", taxonomyStatus: "MAPPED" },
  });
  const totalRejected = await prisma.catalogReceivingRecord.count({
    where: { batchId, deletedAt: null, qualityStatus: { in: ["REJECTED", "DUPLICATE"] } },
  });
  const totalReview = await prisma.catalogReceivingRecord.count({
    where: {
      batchId,
      deletedAt: null,
      OR: [
        { qualityStatus: "REVIEW_REQUIRED" },
        { taxonomyStatus: "REVIEW_REQUIRED" },
      ],
    },
  });
  const status = totalReview > 0 ? "PARTIAL" : "READY_FOR_EXPORT";

  await prisma.$transaction(async (tx) => {
    await tx.catalogAgentRun.createMany({
      data: [
        {
          batchId,
          stage: "QUALITY_FILTER",
          engineVersion: QUALITY_FILTER_AGENT_VERSION,
          inputCount: pending.length,
          acceptedCount: qualityOutcomes.filter((item) => item.status === "ACCEPTED").length,
          rejectedCount: qualityOutcomes.filter((item) => item.status === "REJECTED" || item.status === "DUPLICATE").length,
          reviewCount: qualityOutcomes.filter((item) => item.status === "REVIEW_REQUIRED").length,
          output: toJson({ outcomes: qualityOutcomes }),
          requestedById: actor.id,
        },
        {
          batchId,
          stage: "HOSPITALITY_TAXONOMY",
          engineVersion: HOSPITALITY_TAXONOMY_AGENT_VERSION,
          inputCount: taxonomyOutcomes.filter((item) => item.status !== "SKIPPED").length,
          acceptedCount: taxonomyOutcomes.filter((item) => item.status === "MAPPED").length,
          rejectedCount: 0,
          reviewCount: taxonomyOutcomes.filter((item) => item.status === "REVIEW_REQUIRED").length,
          output: toJson({ outcomes: taxonomyOutcomes }),
          requestedById: actor.id,
        },
      ],
    });
    await tx.catalogReceivingBatch.update({
      where: { id: batchId },
      data: { status, acceptedCount: totalAccepted, rejectedCount: totalRejected },
    });
    await appendAuditEntry({
      entityName: "EVIDENCE",
      entityId: batchId,
      actionType: "UPDATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: {
        event: "CATALOG_RECEIVING_AGENTS_COMPLETED",
        processed: pending.length,
        accepted: totalAccepted,
        rejected: totalRejected,
        reviewRequired: totalReview,
        qualityAgent: QUALITY_FILTER_AGENT_VERSION,
        taxonomyAgent: HOSPITALITY_TAXONOMY_AGENT_VERSION,
        productImageEnhancer: PRODUCT_IMAGE_OUTPUT.enhancer,
      },
    }, tx);
  });
  return {
    batchId,
    processed: pending.length,
    accepted: totalAccepted,
    rejected: totalRejected,
    reviewRequired: totalReview,
    status,
  };
}

export async function exportReceivingBatchToDirectory(prisma: PrismaClient, actor: ReceivingActor, batchId: string) {
  const batch = await prisma.catalogReceivingBatch.findFirst({
    where: { id: batchId, tenantId: actor.tenantId, deletedAt: null },
    include: {
      records: {
        where: {
          deletedAt: null,
          qualityStatus: "ACCEPTED",
          taxonomyStatus: "MAPPED",
          directoryCandidateId: null,
        },
        orderBy: { receivedAt: "asc" },
      },
    },
  });
  if (!batch) throw new Error("RECEIVING_BATCH_NOT_FOUND");
  if (!["READY_FOR_EXPORT", "PARTIAL", "EXPORTED"].includes(batch.status)) {
    throw new Error("RECEIVING_BATCH_MUST_BE_PROCESSED_BEFORE_EXPORT");
  }
  if (!batch.records.length) {
    return {
      batchId,
      exported: 0,
      pendingSourcePermission: batch.sourcePermissionStatus !== "PERMITTED",
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const source = await tx.directorySource.upsert({
      where: { sourceUrl: batch.sourceUrl },
      update: {
        // Preserve an already-cleared source type. Re-import must not revoke
        // a prior permission decision or downgrade a vendor-authorized feed.
        observedAt: batch.sourceObservedAt,
        lastAttemptAt: new Date(),
        lastSuccessAt: new Date(),
        refreshStatus: "INGESTED",
      },
      create: {
        sourceUrl: batch.sourceUrl,
        sourceType: "PUBLIC_CATALOG_OBSERVATION",
        permissionStatus: "PERMISSION_UNKNOWN",
        permissionNote: "Receiving Dock observation. Product listing reuse and product image reuse require source review before publication.",
        observedAt: batch.sourceObservedAt,
        lastAttemptAt: new Date(),
        lastSuccessAt: new Date(),
        refreshStatus: "INGESTED",
      },
      select: { id: true, permissionStatus: true, sourceType: true },
    });

    let exported = 0;
    let alreadyPresent = 0;
    for (const record of batch.records) {
      const category = CATEGORY_LABELS[record.mappedCategoryCode ?? ""] ?? "Hospitality Procurement";
      const subcategory = record.mappedSubcategoryCode ? subcategoryLabel(record.mappedSubcategoryCode) : undefined;
      const normalizedName = normalizeDirectoryText(record.normalizedName ?? record.rawProductName);
      const sourceRecordKey = record.sourceRecordKey || record.productUrl || record.id;
      const fingerprint = directoryFingerprint({
        sourceUrl: batch.sourceUrl,
        sourceRecordKey,
        itemType: "PRODUCT",
        name: record.normalizedName ?? record.rawProductName,
        category,
      });
      const existing = await tx.directoryCandidate.findUnique({
        where: { sourceFingerprint: fingerprint },
        select: { id: true, reviewStatus: true, deletedAt: true },
      });
      if (existing && !existing.deletedAt) {
        await tx.catalogReceivingRecord.update({
          where: { id: record.id },
          data: { directoryCandidateId: existing.id, exportedAt: new Date() },
        });
        alreadyPresent++;
        continue;
      }

      const duplicate = await tx.directoryCandidate.findFirst({
        where: {
          normalizedName,
          category,
          itemType: "PRODUCT",
          deletedAt: null,
          reviewStatus: { in: ["PENDING_REVIEW", "APPROVED"] },
        },
        select: { id: true },
      });
      const imagePaths = record.approvedImageUrls.map((_, index) =>
        "/api/v2/catalog/receiving/images/" + record.id + "/" + index
      );
      const cleanDescription = record.normalizedDescription
        ? safeNeutralDescription(record.normalizedDescription)
        : null;
      const candidate = await tx.directoryCandidate.create({
        data: {
          sourceId: source.id,
          sourceRecordKey,
          sourceFingerprint: fingerprint,
          normalizedName,
          searchText: directorySearchText({
            name: record.normalizedName ?? record.rawProductName,
            category,
            subcategory,
            description: cleanDescription || undefined,
            searchTerms: [record.mappedCategoryCode ?? "", record.mappedSubcategoryCode ?? ""].filter(Boolean),
          }),
          itemType: "PRODUCT",
          name: record.normalizedName ?? record.rawProductName,
          category,
          subcategory,
          description: cleanDescription,
          attributes: toJson(safePublicSpecifications((record.normalizedSpecifications ?? {}) as Record<string, string | number>)),
          unitOfMeasure: record.normalizedUnitOfMeasure,
          purchaseUnit: record.normalizedPurchaseUnit,
          images: toJson(imagePaths),
          searchTerms: toJson([]),
          sourceSnapshot: toJson({
            receivingBatchId: batch.id,
            receivingRecordId: record.id,
            supplierIdentityInternal: record.rawSupplierName,
            supplierWebsiteInternal: record.rawSupplierWebsite,
            sourceUrlInternal: batch.sourceUrl,
            productUrlInternal: record.productUrl,
            observedPriceInternal: record.observedPrice == null ? null : String(record.observedPrice),
            observedCurrencyInternal: record.observedCurrency,
            rawStockTextInternal: record.rawStockText,
            rawSkuInternal: record.rawSku,
            rawBrandInternal: record.rawBrand,
            approvedImageCount: record.approvedImageUrls.length,
            imageQualityOutput: record.imageQualityOutput,
            categoryCode: record.mappedCategoryCode,
            subcategoryCode: record.mappedSubcategoryCode,
          }),
          duplicateOfId: duplicate?.id ?? null,
          reviewStatus: "PENDING_REVIEW",
          reviewNote: "Two-stage Receiving Dock export. Missing price, MOQ, EGS/GS1, specifications, pack, UOM or image does not block this product record. Only approved image files are linked. Review source permission and product image rights before publication.",
        },
        select: { id: true },
      });
      await tx.catalogReceivingRecord.update({
        where: { id: record.id },
        data: { directoryCandidateId: candidate.id, exportedAt: new Date() },
      });
      exported++;
    }

    const remaining = await tx.catalogReceivingRecord.count({
      where: {
        batchId,
        deletedAt: null,
        qualityStatus: "ACCEPTED",
        taxonomyStatus: "MAPPED",
        directoryCandidateId: null,
      },
    });
    await tx.catalogReceivingBatch.update({
      where: { id: batch.id },
      data: {
        status: remaining === 0 ? "EXPORTED" : "PARTIAL",
        exportedCount: { increment: exported + alreadyPresent },
      },
    });
    await appendAuditEntry({
      entityName: "EVIDENCE",
      entityId: batch.id,
      actionType: "UPDATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: {
        event: "CATALOG_RECEIVING_BATCH_EXPORTED_TO_PRIVATE_DIRECTORY_REVIEW",
        exported,
        alreadyPresent,
        sourcePermissionStatus: source.permissionStatus,
        sourceType: source.sourceType,
        buyerSupplierIdentityExposed: false,
        buyerObservedPriceExposed: false,
        transactionEnabled: false,
      },
    }, tx);
    return {
      exported,
      alreadyPresent,
      pendingSourcePermission: source.permissionStatus !== "PERMITTED",
    };
  }, { timeout: 60_000 });
  return { batchId, ...result };
}
