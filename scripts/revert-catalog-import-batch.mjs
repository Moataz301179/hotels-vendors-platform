/**
 * Governed revert of the 2026-11-07 MANUAL / egyptian-market catalog import.
 *
 * Deactivates the imported Product records and unpublishes their DirectoryProfile
 * entries so the batch no longer renders on the public catalog. Pre-existing
 * catalog records (the 2026-10-17 internal batch, open-licensed research set,
 * FIXTURE and SUPPLIER_SYNC products) are untouched.
 *
 * Gate: HV_ALLOW_CATALOG_REVERT=1
 * Audit: appends a hash-chained AuditLog entry (same pattern as the publisher).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// Load the dev DATABASE_URL before PrismaClient initializes.
const envLocal = resolve(process.cwd(), '.env.local');
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const match = line.match(/^DATABASE_URL=(.*)$/);
    if (match && !process.env.DATABASE_URL) process.env.DATABASE_URL = match[1];
  }
}

const prisma = new PrismaClient();
const stable = (value) => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(stable).join(',')}]` : `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;

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

const PUBLIC_SOURCE_TYPES = ['INTERNAL_HOSPITALITY_SPECIFICATION', 'VENDOR_AUTHORIZED_HORECA_CATALOG'];
const publicDirectoryWhere = {
  publicationStatus: 'PUBLISHED',
  deletedAt: null,
  candidate: { is: { reviewStatus: 'APPROVED', deletedAt: null, source: { is: { permissionStatus: 'PERMITTED', deletedAt: null, sourceType: { in: PUBLIC_SOURCE_TYPES } } } } },
};

async function main() {
  if (process.env.HV_ALLOW_CATALOG_REVERT !== '1') throw new Error('HV_ALLOW_CATALOG_REVERT=1_REQUIRED');
  const actorId = process.env.HV_CATALOG_ACTOR_ID ?? 'cmux7e4h80004cr3f9plk75bc';
  const actor = await prisma.user.findFirst({ where: { id: actorId, deletedAt: null }, select: { id: true, tenantId: true, platformRole: true } });
  if (!actor) throw new Error('ACTOR_NOT_FOUND');

  const importRecord = JSON.parse(await readFile(resolve(process.cwd(), 'data/catalog-import-results.json'), 'utf8'));
  const skus = [...new Set(importRecord.results.map((row) => row.sku))];
  if (skus.length !== 94) throw new Error(`UNEXPECTED_BATCH_SIZE:${skus.length}`);

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const products = await tx.product.findMany({ where: { sku: { in: skus }, deletedAt: null }, select: { id: true, status: true } });
    const productIds = products.map((row) => row.id);
    const productsDeactivated = await tx.product.updateMany({ where: { id: { in: productIds }, status: { not: 'INACTIVE' } }, data: { status: 'INACTIVE', updatedAt: now } });

    const profiles = await tx.directoryProfile.findMany({ where: { candidate: { is: { sourceRecordKey: { in: skus } } }, deletedAt: null }, select: { id: true, publicationStatus: true } });
    const profileIds = profiles.map((row) => row.id);
    const profilesUnpublished = await tx.directoryProfile.updateMany({ where: { id: { in: profileIds }, publicationStatus: { not: 'UNPUBLISHED' } }, data: { publicationStatus: 'UNPUBLISHED', updatedAt: now } });

    await appendAudit(tx, {
      entityName: 'DIRECTORY_PROFILE',
      entityId: 'catalog-import-batch-2026-11-07',
      actionType: 'STATUS_CHANGED',
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole ?? 'ADMIN',
      changes: {
        action: 'CATALOG_IMPORT_BATCH_REVERTED',
        reason: 'MANUAL/egyptian-market batch rejected: images wrong, not for auto-publish',
        skus: skus.length,
        productsFound: productIds.length,
        productsDeactivated: productsDeactivated.count,
        profilesFound: profileIds.length,
        profilesUnpublished: profilesUnpublished.count,
        supplierNeutral: true,
      },
    });

    return {
      skus: skus.length,
      productsFound: productIds.length,
      productsDeactivated: productsDeactivated.count,
      profilesFound: profileIds.length,
      profilesUnpublished: profilesUnpublished.count,
    };
  }, { timeout: 30_000 });

  const publicDirectoryEntriesRemaining = await prisma.directoryProfile.count({ where: publicDirectoryWhere });
  const activeManualProductsRemaining = await prisma.product.count({ where: { status: 'ACTIVE', source: 'MANUAL', deletedAt: null } });
  const artifact = {
    revertedAt: new Date().toISOString(),
    ...result,
    publicDirectoryEntriesRemaining,
    activeManualProductsRemaining,
  };
  await writeFile(resolve(process.cwd(), 'data/catalog-revert-results.json'), JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
