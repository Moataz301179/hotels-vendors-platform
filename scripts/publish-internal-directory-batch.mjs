/**
 * Release-safe publisher for the internally authored, supplier-neutral directory batch.
 * Kept dependency-light because production releases contain the Prisma runtime but not TS source aliases.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stable = (value) => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(stable).join(',')}]` : `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
const normalized = (value) => value.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
const fingerprint = (record, sourceUrl) => createHash('sha256').update(JSON.stringify({ sourceUrl, sourceRecordKey: record.sourceRecordKey, itemType: record.itemType, name: record.name, category: record.category })).digest('hex');
const searchText = (record) => [record.name, record.nameAr, record.category, record.subcategory, record.description, ...record.searchTerms].filter(Boolean).join(' ').toLocaleLowerCase('en-US');
const restrictedPublicText = /https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]{0,62}(?:\.[a-z]{2,63})+\b|(?:tel|mailto):|@|(?:\+?\d[\d\s().-]{7,}\d)|\b(?:vendor|supplier|source|contact|attribution|website|price|stock|availability|available|offer|quotation|quote|delivery|eta|lead time)\b|(?:مورد|المورد|موردين)/i;
const publicText = (value) => typeof value === 'string' && value.trim() && value.trim().length <= 500 && !restrictedPublicText.test(value.trim()) ? value.trim() : null;
const publicSpecificationKeys = ['material', 'dimensions', 'capacity', 'composition', 'colour', 'color', 'weight', 'technicalSpecification'];
const publicRecord = (record) => {
  const fields = { name: publicText(record.name), nameAr: record.nameAr == null ? null : publicText(record.nameAr), category: publicText(record.category), subcategory: record.subcategory == null ? null : publicText(record.subcategory), unitOfMeasure: record.unitOfMeasure == null ? null : publicText(record.unitOfMeasure), purchaseUnit: record.purchaseUnit == null ? null : publicText(record.purchaseUnit) };
  const description = publicText(record.description);
  if (!fields.name || !fields.category || !description || Object.entries(fields).some(([key, value]) => key !== 'name' && key !== 'category' && record[key] != null && !value)) throw new Error(`UNSAFE_INTERNAL_PUBLIC_RECORD:${record.sourceRecordKey}`);
  const attributes = Object.fromEntries(publicSpecificationKeys.flatMap((key) => {
    const value = publicText(record.attributes?.[key]);
    return value ? [[key, value]] : [];
  }));
  return { ...fields, description, attributes };
};

async function appendAudit(tx, params) {
  await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(4815162342)');
  const previous = await tx.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { hash: true, createdAt: true } });
  const id = randomUUID();
  const createdAt = new Date(Math.max(Date.now(), (previous?.createdAt?.getTime() ?? 0) + 1));
  const previousHash = previous?.hash || 'genesis';
  const changes = params.changes ?? null;
  const hash = createHash('sha256').update(JSON.stringify({ id, entityName: params.entityName, entityId: params.entityId, actionType: params.actionType, actorId: params.actorId, actorRole: params.actorRole, changes: changes === null ? null : stable(changes), ipAddress: null, userAgent: null, createdAt: createdAt.toISOString(), previousHash })).digest('hex');
  await tx.auditLog.create({ data: { id, entityName: params.entityName, entityId: params.entityId, actionType: params.actionType, tenantId: params.tenantId, actorId: params.actorId, actorRole: params.actorRole, changes, previousHash, hash, createdAt } });
}

async function main() {
  if (process.env.HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION !== '1') throw new Error('HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1_REQUIRED');
  const actorId = process.env.HV_DIRECTORY_ACTOR_ID;
  const tenantId = process.env.HV_DIRECTORY_TENANT_ID;
  if (!actorId || !tenantId) throw new Error('HV_DIRECTORY_ACTOR_ID_AND_HV_DIRECTORY_TENANT_ID_REQUIRED');
  const batch = JSON.parse(await readFile(resolve(process.cwd(), 'data/directory/hospitality-core-specifications.v1.json'), 'utf8'));
  if (!batch.source?.sourceUrl?.startsWith('internal://hotelsvendors/') || batch.records?.length < 10 || batch.records?.length > 20) throw new Error('INVALID_INTERNAL_DIRECTORY_BATCH');
  const prohibited = /\b(supplier|vendor|price|stock|availability|available|offer|quotation|quote|delivery|eta|lead time)\b/i;
  if (batch.records.some((record) => prohibited.test(JSON.stringify(record)))) throw new Error('COMMERCIAL_TERM_FORBIDDEN');
  batch.records.forEach(publicRecord);
  const actor = await prisma.user.findFirst({ where: { id: actorId, tenantId, platformRole: 'ADMIN', deletedAt: null }, select: { id: true, tenantId: true } });
  if (!actor) throw new Error('ACTIVE_PLATFORM_ADMIN_FOR_TENANT_REQUIRED');
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const source = await tx.directorySource.upsert({ where: { sourceUrl: batch.source.sourceUrl }, update: { sourceType: batch.source.sourceType, permissionStatus: 'PERMITTED', permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: 'INGESTED', deletedAt: null }, create: { sourceUrl: batch.source.sourceUrl, sourceType: batch.source.sourceType, permissionStatus: 'PERMITTED', permissionNote: batch.source.permissionNote, observedAt: now, lastAttemptAt: now, lastSuccessAt: now, refreshStatus: 'INGESTED' } });
    let created = 0;
    for (const record of batch.records) {
      const published = publicRecord(record);
      const candidate = await tx.directoryCandidate.upsert({ where: { sourceFingerprint: fingerprint(record, batch.source.sourceUrl) }, update: { sourceId: source.id, normalizedName: normalized(record.name), searchText: searchText(record), itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: record.attributes, unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: [], searchTerms: record.searchTerms, sourceSnapshot: { version: batch.version, classification: 'INTERNALLY_AUTHORED_GENERIC_SPECIFICATION', record }, duplicateOfId: null, reviewStatus: 'APPROVED', reviewNote: 'Internal generic specification reviewed for supplier-neutral directory publication.', reviewedAt: now, reviewedById: actor.id, deletedAt: null }, create: { sourceId: source.id, sourceRecordKey: record.sourceRecordKey, sourceFingerprint: fingerprint(record, batch.source.sourceUrl), normalizedName: normalized(record.name), searchText: searchText(record), itemType: record.itemType, name: record.name, nameAr: record.nameAr, category: record.category, subcategory: record.subcategory, description: record.description, attributes: record.attributes, unitOfMeasure: record.unitOfMeasure, purchaseUnit: record.purchaseUnit, images: [], searchTerms: record.searchTerms, sourceSnapshot: { version: batch.version, classification: 'INTERNALLY_AUTHORED_GENERIC_SPECIFICATION', record }, reviewStatus: 'APPROVED', reviewNote: 'Internal generic specification reviewed for supplier-neutral directory publication.', reviewedAt: now, reviewedById: actor.id } });
      const profile = await tx.directoryProfile.upsert({ where: { candidateId: candidate.id }, update: { itemType: record.itemType, ...published, images: [], searchTerms: [], searchText: searchText({ ...published, searchTerms: [] }), publicationStatus: 'PUBLISHED', publishedById: actor.id, deletedAt: null }, create: { candidateId: candidate.id, itemType: record.itemType, ...published, images: [], searchTerms: [], searchText: searchText({ ...published, searchTerms: [] }), publicationStatus: 'PUBLISHED', publishedById: actor.id } });
      if (profile.createdAt.getTime() === profile.updatedAt.getTime()) created++;
    }
    await appendAudit(tx, { entityName: 'DIRECTORY_SOURCE', entityId: source.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: 'ADMIN', changes: { action: 'INTERNAL_DIRECTORY_BATCH_PUBLISHED', version: batch.version, records: batch.records.length, profilesCreated: created, supplierNeutral: true } });
    return { records: batch.records.length, profilesCreated: created };
  }, { timeout: 30_000 });
  console.log(JSON.stringify({ ok: true, ...result }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
