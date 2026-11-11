import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { runHospitalityTaxonomyAgent } from "@/lib/catalog/receiving/hospitality-taxonomy-agent";
import { runQualityFilterAgent } from "@/lib/catalog/receiving/quality-filter-agent";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";
import { directoryFingerprint, directorySearchText, normalizeDirectoryText } from "@/lib/directory/catalog-normalization";
import { hasSafePublicDirectoryFields, publicDirectoryFields, publicDirectorySpecifications, publicDirectoryText } from "@/lib/directory/public-directory-profile";
import { maskedPublicProductName, observedPackSize, retainsSupplierIdentity } from "@/lib/sourcing/mask-supplier-product";

export const MASKED_OBSERVED_SUPPLIER_PRODUCT = "MASKED_OBSERVED_SUPPLIER_PRODUCT";

const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function readableLabel(code: string | null): string | null {
  if (!code) return null;
  return code.toLocaleLowerCase("en").replace(/_/g, " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function buyerDescription(value: string): string | null {
  const text = value
    .replace(/Supplier, price, stock and offer terms are stored separately from this buyer-facing reference\./gi, "The selling company and the price stay off this list.")
    .replace(/\b(?:supplier|vendor|source|price|stock)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return publicDirectoryText(text);
}

export function publicMaskedProduct(observation: RawCatalogObservation) {
  const supplierName = observation.supplierName ?? "";
  const quality = runQualityFilterAgent(observation);
  const taxonomy = runHospitalityTaxonomyAgent(observation);
  const identity = [supplierName, observation.brand].filter((value): value is string => Boolean(value)).join(" ");
  const name = maskedPublicProductName(taxonomy.normalizedName, identity);
  const described = buyerDescription(taxonomy.normalizedDescription);
  const description = described && !retainsSupplierIdentity(described, identity)
    ? described
    : publicDirectoryText("Food product for a hotel request. The selling company and the price stay off this list.");
  const pack = observedPackSize(observation.name) ?? observation.packSize ?? null;
  const fields = name && description ? publicDirectoryFields({
    name,
    nameAr: null,
    category: taxonomy.categoryCode,
    subcategory: readableLabel(taxonomy.subcategoryCode),
    unitOfMeasure: taxonomy.unitOfMeasure,
    purchaseUnit: pack ?? taxonomy.purchaseUnit,
  }) : null;
  const safe = Boolean(
    quality.status === "ACCEPTED"
    && taxonomy.status === "MAPPED"
    && fields
    && description
    && hasSafePublicDirectoryFields({ ...fields, nameAr: null })
    && !retainsSupplierIdentity([fields.name, fields.subcategory, fields.purchaseUnit, description].filter(Boolean).join(" "), identity),
  );
  return { quality, taxonomy, name, description, pack, fields, safe };
}

async function withdrawPublishedProduct(tx: Prisma.TransactionClient, sourceId: string, sourceRecordKey: string, now: Date, keepId?: string) {
  const stale = await tx.directoryCandidate.findMany({
    where: { sourceId, sourceRecordKey, deletedAt: null, ...(keepId ? { id: { not: keepId } } : {}) },
    select: { id: true },
  });
  if (!stale.length) return;
  const ids = stale.map((row) => row.id);
  await tx.directoryProfile.updateMany({ where: { candidateId: { in: ids } }, data: { deletedAt: now, publicationStatus: "WITHDRAWN" } });
  await tx.directoryCandidate.updateMany({ where: { id: { in: ids } }, data: { deletedAt: now, reviewStatus: "REJECTED", reviewNote: "Withdrawn because a later observation replaced this public row." } });
}

export async function publishMaskedCatalogObservations(input: {
  sourceUrl: string;
  sourceName: string;
  observations: RawCatalogObservation[];
  actor: { id: string; tenantId: string; platformRole: "ADMIN" };
}) {
  const reviewed = input.observations.map((observation) => ({ observation, publicProduct: publicMaskedProduct(observation) }));
  const checksum = createHash("sha256").update(input.observations.map((item) => `${item.productUrl ?? ""}|${item.name}`).sort().join("\n")).digest("hex");
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const batch = await tx.catalogReceivingBatch.upsert({
      where: { tenantId_payloadChecksum: { tenantId: input.actor.tenantId, payloadChecksum: checksum } },
      update: { sourceName: input.sourceName, sourceUrl: input.sourceUrl, status: "EXPORTED", recordCount: input.observations.length, sourceObservedAt: now },
      create: {
        tenantId: input.actor.tenantId,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: "PUBLIC_PRODUCT_CATALOG",
        sourcePermissionStatus: "PERMITTED",
        sourcePermissionNote: "Public product pages were read for the hotel list. The selling company, price, and page address stay on this receiving record.",
        sourceObservedAt: now,
        payloadChecksum: checksum,
        status: "EXPORTED",
        receivedById: input.actor.id,
        recordCount: input.observations.length,
      },
    });
    await tx.catalogReceivingRecord.deleteMany({ where: { batchId: batch.id } });
    const source = await tx.directorySource.upsert({
      where: { sourceUrl: input.sourceUrl },
      update: { sourceType: MASKED_OBSERVED_SUPPLIER_PRODUCT, permissionStatus: "PERMITTED", permissionNote: "Buyer rows show the product only. Company, price, and page address stay on the receiving record.", observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: "INGESTED", deletedAt: null },
      create: { sourceUrl: input.sourceUrl, sourceType: MASKED_OBSERVED_SUPPLIER_PRODUCT, permissionStatus: "PERMITTED", permissionNote: "Buyer rows show the product only. Company, price, and page address stay on the receiving record.", observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: "INGESTED" },
    });
    let published = 0;
    let held = 0;
    for (const item of reviewed) {
      const { observation, publicProduct } = item;
      const record = await tx.catalogReceivingRecord.create({
        data: {
          batchId: batch.id,
          sourceRecordKey: observation.externalId,
          dedupeKey: publicProduct.quality.dedupeKey,
          productUrl: observation.productUrl,
          rawSupplierName: observation.supplierName,
          rawSupplierWebsite: observation.supplierWebsite,
          rawProductName: observation.name,
          rawProductDescription: observation.description,
          rawCategory: observation.category,
          rawSku: observation.sku,
          rawBrand: observation.brand,
          rawPackSize: publicProduct.pack,
          rawUnitOfMeasure: observation.unitOfMeasure,
          observedPrice: observation.unitPrice ?? null,
          observedCurrency: observation.currency ?? "EGP",
          imageUrls: observation.images ?? [],
          rawPayload: toJson({ productUrl: observation.productUrl }),
          qualityStatus: publicProduct.quality.status,
          taxonomyStatus: publicProduct.taxonomy.status === "MAPPED" ? "MAPPED" : "REVIEW_REQUIRED",
          qualityOutput: toJson(publicProduct.quality),
          taxonomyOutput: toJson(publicProduct.taxonomy),
          normalizedName: publicProduct.name,
          normalizedDescription: publicProduct.description,
          mappedCategoryCode: publicProduct.taxonomy.categoryCode,
          mappedSubcategoryCode: publicProduct.taxonomy.subcategoryCode,
          normalizedUnitOfMeasure: publicProduct.taxonomy.unitOfMeasure,
          normalizedPurchaseUnit: publicProduct.pack,
          processedAt: now,
        },
      });
      const sourceRecordKey = observation.externalId ?? observation.productUrl ?? null;
      if (!publicProduct.safe || !publicProduct.fields || !publicProduct.name || !publicProduct.description) {
        held += 1;
        if (sourceRecordKey) await withdrawPublishedProduct(tx, source.id, sourceRecordKey, now);
        continue;
      }
      const fields = publicProduct.fields;
      const attributes = publicDirectorySpecifications({ ...(publicProduct.pack ? { capacity: publicProduct.pack } : {}) });
      const fingerprint = directoryFingerprint({ sourceUrl: input.sourceUrl, sourceRecordKey, itemType: "PRODUCT", name: publicProduct.name, category: fields.category });
      const existing = sourceRecordKey ? await tx.directoryCandidate.findFirst({ where: { sourceId: source.id, sourceRecordKey, deletedAt: null }, select: { id: true } }) : null;
      if (sourceRecordKey) await withdrawPublishedProduct(tx, source.id, sourceRecordKey, now, existing?.id);
      const candidate = existing
        ? await tx.directoryCandidate.update({
          where: { id: existing.id },
          data: { sourceId: source.id, sourceRecordKey, sourceFingerprint: fingerprint, normalizedName: normalizeDirectoryText(publicProduct.name), searchText: directorySearchText({ ...fields, description: publicProduct.description, searchTerms: [] }), itemType: "PRODUCT", name: publicProduct.name, category: fields.category, subcategory: fields.subcategory, description: publicProduct.description, attributes: toJson(attributes), unitOfMeasure: fields.unitOfMeasure, purchaseUnit: fields.purchaseUnit, images: toJson([]), searchTerms: toJson([]), sourceSnapshot: toJson({ classification: "MASKED_PUBLIC_PRODUCT", receivingRecordId: record.id }), reviewStatus: "APPROVED", reviewNote: "Published as a masked product for the hotel request list.", reviewedAt: now, reviewedById: input.actor.id, deletedAt: null },
        })
        : await tx.directoryCandidate.upsert({
        where: { sourceFingerprint: fingerprint },
        update: { sourceId: source.id, normalizedName: normalizeDirectoryText(publicProduct.name), searchText: directorySearchText({ ...fields, description: publicProduct.description, searchTerms: [] }), itemType: "PRODUCT", name: publicProduct.name, category: fields.category, subcategory: fields.subcategory, description: publicProduct.description, attributes: toJson(attributes), unitOfMeasure: fields.unitOfMeasure, purchaseUnit: fields.purchaseUnit, images: toJson([]), searchTerms: toJson([]), sourceSnapshot: toJson({ classification: "MASKED_PUBLIC_PRODUCT", receivingRecordId: record.id }), reviewStatus: "APPROVED", reviewNote: "Published as a masked product for the hotel request list.", reviewedAt: now, reviewedById: input.actor.id, deletedAt: null },
        create: { sourceId: source.id, sourceRecordKey, sourceFingerprint: fingerprint, normalizedName: normalizeDirectoryText(publicProduct.name), searchText: directorySearchText({ ...fields, description: publicProduct.description, searchTerms: [] }), itemType: "PRODUCT", name: publicProduct.name, category: fields.category, subcategory: fields.subcategory, description: publicProduct.description, attributes: toJson(attributes), unitOfMeasure: fields.unitOfMeasure, purchaseUnit: fields.purchaseUnit, images: toJson([]), searchTerms: toJson([]), sourceSnapshot: toJson({ classification: "MASKED_PUBLIC_PRODUCT", receivingRecordId: record.id }), reviewStatus: "APPROVED", reviewNote: "Published as a masked product for the hotel request list.", reviewedAt: now, reviewedById: input.actor.id },
      });
      await tx.directoryProfile.upsert({
        where: { candidateId: candidate.id },
        update: { itemType: "PRODUCT", ...fields, description: publicProduct.description, attributes: toJson(attributes), images: toJson([]), searchTerms: toJson([]), searchText: directorySearchText({ ...fields, description: publicProduct.description, searchTerms: [] }), publicationStatus: "PUBLISHED", publishedById: input.actor.id, deletedAt: null },
        create: { candidateId: candidate.id, itemType: "PRODUCT", ...fields, description: publicProduct.description, attributes: toJson(attributes), images: toJson([]), searchTerms: toJson([]), searchText: directorySearchText({ ...fields, description: publicProduct.description, searchTerms: [] }), publicationStatus: "PUBLISHED", publishedById: input.actor.id },
      });
      await tx.catalogReceivingRecord.update({ where: { id: record.id }, data: { directoryCandidateId: candidate.id, exportedAt: now } });
      published += 1;
    }
    await appendAuditEntry({ entityName: "DIRECTORY_SOURCE", entityId: source.id, actionType: "STATUS_CHANGED", tenantId: input.actor.tenantId, actorId: input.actor.id, actorRole: input.actor.platformRole, changes: { action: "MASKED_SUPPLIER_PRODUCTS_PUBLISHED", sourceUrl: input.sourceUrl, records: input.observations.length, published, held, supplierIdentityOnPublicRow: false, priceOnPublicRow: false } }, tx);
    return { batchId: batch.id, sourceId: source.id, records: input.observations.length, published, held };
  }, { timeout: 120_000 });
}
