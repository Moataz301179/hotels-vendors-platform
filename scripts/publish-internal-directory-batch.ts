/**
 * Controlled materialization for internally-authored, supplier-neutral directory profiles.
 *
 * This script never creates a Supplier, Product, price, stock record, offer, ETA, or delivery
 * commitment. It requires an existing platform administrator so all creation is auditable.
 *
 * Usage (dry run): npx tsx scripts/publish-internal-directory-batch.ts
 * Usage (apply): HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1 HV_DIRECTORY_ACTOR_ID=... \
 *   HV_DIRECTORY_TENANT_ID=... npx tsx scripts/publish-internal-directory-batch.ts --apply
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { directoryFingerprint, directorySearchText, normalizeDirectoryText } from '@/lib/directory/catalog-normalization';

type RecordSpec = {
  sourceRecordKey: string;
  itemType: 'PRODUCT' | 'SERVICE';
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
type Batch = {
  version: string;
  source: { sourceUrl: string; sourceType: string; permissionStatus: 'PERMITTED'; permissionNote: string };
  records: RecordSpec[];
};

const prohibitedCommercialTerms = /\b(supplier|vendor|price|stock|availability|available|offer|quotation|quote|delivery|eta|lead time)\b/i;
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function validate(batch: Batch) {
  if (!batch.source.sourceUrl.startsWith('internal://hotelsvendors/')) throw new Error('INTERNAL_SOURCE_URL_REQUIRED');
  if (batch.source.permissionStatus !== 'PERMITTED') throw new Error('INTERNAL_SOURCE_PERMISSION_REQUIRED');
  if (batch.records.length < 10 || batch.records.length > 20) throw new Error('BATCH_SIZE_MUST_BE_10_TO_20');
  const keys = new Set<string>();
  for (const record of batch.records) {
    if (keys.has(record.sourceRecordKey)) throw new Error(`DUPLICATE_RECORD_KEY:${record.sourceRecordKey}`);
    keys.add(record.sourceRecordKey);
    const serialized = JSON.stringify(record);
    if (prohibitedCommercialTerms.test(serialized)) throw new Error(`COMMERCIAL_TERM_FORBIDDEN:${record.sourceRecordKey}`);
  }
}

async function main() {
  const batch = JSON.parse(await readFile(resolve(process.cwd(), 'data/directory/hospitality-core-specifications.v1.json'), 'utf8')) as Batch;
  validate(batch);
  const apply = process.argv.includes('--apply');
  if (!apply) {
    console.log(JSON.stringify({ ok: true, mode: 'dry-run', version: batch.version, source: batch.source.sourceUrl, records: batch.records.length }));
    return;
  }
  if (process.env.HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION !== '1') throw new Error('HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1_REQUIRED');
  const actorId = process.env.HV_DIRECTORY_ACTOR_ID;
  const tenantId = process.env.HV_DIRECTORY_TENANT_ID;
  if (!actorId || !tenantId) throw new Error('HV_DIRECTORY_ACTOR_ID_AND_HV_DIRECTORY_TENANT_ID_REQUIRED');
  const actor = await prisma.user.findFirst({ where: { id: actorId, tenantId, platformRole: 'ADMIN', deletedAt: null }, select: { id: true, tenantId: true, platformRole: true } });
  if (!actor) throw new Error('ACTIVE_PLATFORM_ADMIN_FOR_TENANT_REQUIRED');

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const source = await tx.directorySource.upsert({
      where: { sourceUrl: batch.source.sourceUrl },
      update: { sourceType: batch.source.sourceType, permissionStatus: 'PERMITTED', permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: 'INGESTED', deletedAt: null },
      create: { sourceUrl: batch.source.sourceUrl, sourceType: batch.source.sourceType, permissionStatus: 'PERMITTED', permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: 'INGESTED' },
      select: { id: true },
    });
    let profilesCreated = 0;
    let profilesUpdated = 0;
    for (const record of batch.records) {
      const sourceFingerprint = directoryFingerprint({ sourceUrl: batch.source.sourceUrl, sourceRecordKey: record.sourceRecordKey, itemType: record.itemType, name: record.name, category: record.category });
      const searchText = directorySearchText(record);
      const candidate = await tx.directoryCandidate.upsert({
        where: { sourceFingerprint },
        update: { sourceId: source.id, normalizedName: normalizeDirectoryText(record.name), searchText, itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), sourceSnapshot: toJson({ version: batch.version, classification: 'INTERNALLY_AUTHORED_GENERIC_SPECIFICATION', record }), duplicateOfId: null, reviewStatus: 'APPROVED', reviewNote: 'Internal generic specification reviewed for supplier-neutral directory publication.', reviewedAt: now, reviewedById: actor.id, deletedAt: null },
        create: { sourceId: source.id, sourceRecordKey: record.sourceRecordKey, sourceFingerprint, normalizedName: normalizeDirectoryText(record.name), searchText, itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), sourceSnapshot: toJson({ version: batch.version, classification: 'INTERNALLY_AUTHORED_GENERIC_SPECIFICATION', record }), reviewStatus: 'APPROVED', reviewNote: 'Internal generic specification reviewed for supplier-neutral directory publication.', reviewedAt: now, reviewedById: actor.id },
        select: { id: true },
      });
      const existing = await tx.directoryProfile.findUnique({ where: { candidateId: candidate.id }, select: { id: true } });
      await tx.directoryProfile.upsert({
        where: { candidateId: candidate.id },
        update: { itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), searchText, publicationStatus: 'PUBLISHED', publishedById: actor.id, deletedAt: null },
        create: { candidateId: candidate.id, itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: toJson(record.attributes), unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: toJson([]), searchTerms: toJson(record.searchTerms), searchText, publicationStatus: 'PUBLISHED', publishedById: actor.id },
      });
      if (existing) profilesUpdated += 1; else profilesCreated += 1;
    }
    await appendAuditEntry({ entityName: 'DIRECTORY_SOURCE', entityId: source.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { action: 'INTERNAL_DIRECTORY_BATCH_PUBLISHED', sourceUrl: batch.source.sourceUrl, version: batch.version, records: batch.records.length, profilesCreated, profilesUpdated, supplierNeutral: true } }, tx);
    return { sourceId: source.id, records: batch.records.length, profilesCreated, profilesUpdated };
  }, { timeout: 30_000 });
  console.log(JSON.stringify({ ok: true, mode: 'apply', ...result }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
