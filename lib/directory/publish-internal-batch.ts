import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { directoryFingerprint, directorySearchText, normalizeDirectoryText } from "@/lib/directory/catalog-normalization";
import { hasSafePublicDirectoryFields, publicDirectoryFields, publicDirectorySpecifications, publicDirectoryText } from "@/lib/directory/public-directory-profile";

export type InternalDirectoryRecord = {
  sourceRecordKey: string;
  itemType: "PRODUCT" | "SERVICE";
  name: string;
  nameAr?: string;
  category: string;
  subcategory?: string;
  description: string;
  attributes: Record<string, unknown>;
  unitOfMeasure: string;
  purchaseUnit: string;
  searchTerms: string[];
};

export type InternalDirectoryBatch = {
  version: string;
  source: { sourceUrl: string; sourceType: string; permissionStatus: "PERMITTED"; permissionNote: string };
  records: InternalDirectoryRecord[];
};

const prohibitedCommercialTerms = /\b(supplier|vendor|price|stock|availability|available|offer|quotation|quote|delivery|eta|lead time)\b/i;
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export function publicInternalRecord(record: InternalDirectoryRecord) {
  const fields = publicDirectoryFields(record);
  const description = publicDirectoryText(record.description);
  if (!fields || !description || !hasSafePublicDirectoryFields(record)) throw new Error(`UNSAFE_INTERNAL_PUBLIC_RECORD:${record.sourceRecordKey}`);
  return { ...fields, description, attributes: publicDirectorySpecifications(record.attributes) };
}

export function validateInternalDirectoryBatch(batch: InternalDirectoryBatch) {
  if (!batch.source.sourceUrl.startsWith("internal://hotelsvendors/")) throw new Error("INTERNAL_SOURCE_URL_REQUIRED");
  if (batch.source.sourceType !== "INTERNAL_HOSPITALITY_SPECIFICATION") throw new Error("INTERNAL_SOURCE_TYPE_REQUIRED");
  if (batch.source.permissionStatus !== "PERMITTED") throw new Error("INTERNAL_SOURCE_PERMISSION_REQUIRED");
  if (batch.records.length < 10 || batch.records.length > 20) throw new Error("BATCH_SIZE_MUST_BE_10_TO_20");
  const keys = new Set<string>();
  for (const record of batch.records) {
    if (keys.has(record.sourceRecordKey)) throw new Error(`DUPLICATE_RECORD_KEY:${record.sourceRecordKey}`);
    keys.add(record.sourceRecordKey);
    if (prohibitedCommercialTerms.test(JSON.stringify(record))) throw new Error(`COMMERCIAL_TERM_FORBIDDEN:${record.sourceRecordKey}`);
    publicInternalRecord(record);
  }
}

export async function publishInternalDirectoryBatch(batch: InternalDirectoryBatch, actor: { id: string; tenantId: string; platformRole: "ADMIN" }) {
  validateInternalDirectoryBatch(batch);
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const source = await tx.directorySource.upsert({
      where: { sourceUrl: batch.source.sourceUrl },
      update: { sourceType: batch.source.sourceType, permissionStatus: "PERMITTED", permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: "INGESTED", deletedAt: null },
      create: { sourceUrl: batch.source.sourceUrl, sourceType: batch.source.sourceType, permissionStatus: "PERMITTED", permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: "INGESTED" },
      select: { id: true },
    });
    let profilesCreated = 0;
    let profilesUpdated = 0;
    for (const record of batch.records) {
      const published = publicInternalRecord(record);
      const sourceFingerprint = directoryFingerprint({ sourceUrl: batch.source.sourceUrl, sourceRecordKey: record.sourceRecordKey, itemType: record.itemType, name: record.name, category: record.category });
      const searchText = directorySearchText(record);
      const candidate = await tx.directoryCandidate.upsert({
        where: { sourceFingerprint },
        update: { sourceId: source.id, normalizedName: normalizeDirectoryText(record.name), searchText, itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), sourceSnapshot: toJson({ version: batch.version, classification: "INTERNALLY_AUTHORED_GENERIC_SPECIFICATION", record }), duplicateOfId: null, reviewStatus: "APPROVED", reviewNote: "Internal generic specification reviewed for supplier-neutral directory publication.", reviewedAt: now, reviewedById: actor.id, deletedAt: null },
        create: { sourceId: source.id, sourceRecordKey: record.sourceRecordKey, sourceFingerprint, normalizedName: normalizeDirectoryText(record.name), searchText, itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), sourceSnapshot: toJson({ version: batch.version, classification: "INTERNALLY_AUTHORED_GENERIC_SPECIFICATION", record }), reviewStatus: "APPROVED", reviewNote: "Internal generic specification reviewed for supplier-neutral directory publication.", reviewedAt: now, reviewedById: actor.id },
        select: { id: true },
      });
      const existing = await tx.directoryProfile.findUnique({ where: { candidateId: candidate.id }, select: { id: true } });
      await tx.directoryProfile.upsert({
        where: { candidateId: candidate.id },
        update: { itemType: record.itemType, ...published, images: toJson([]), searchTerms: toJson([]), searchText: directorySearchText({ ...published, searchTerms: [] }), publicationStatus: "PUBLISHED", publishedById: actor.id, deletedAt: null },
        create: { candidateId: candidate.id, itemType: record.itemType, ...published, images: toJson([]), searchTerms: toJson([]), searchText: directorySearchText({ ...published, searchTerms: [] }), publicationStatus: "PUBLISHED", publishedById: actor.id },
      });
      if (existing) profilesUpdated += 1;
      else profilesCreated += 1;
    }
    await appendAuditEntry({ entityName: "DIRECTORY_SOURCE", entityId: source.id, actionType: "STATUS_CHANGED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { action: "INTERNAL_DIRECTORY_BATCH_PUBLISHED", sourceUrl: batch.source.sourceUrl, version: batch.version, records: batch.records.length, profilesCreated, profilesUpdated, supplierNeutral: true } }, tx);
    return { sourceId: source.id, records: batch.records.length, profilesCreated, profilesUpdated };
  }, { timeout: 30_000 });
}
