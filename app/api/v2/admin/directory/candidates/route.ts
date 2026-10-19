import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { directoryFingerprint, directorySearchText, normalizeDirectoryText, safeDirectoryImages } from '@/lib/directory/catalog-normalization';

const itemType = z.enum(['PRODUCT', 'SERVICE']);
const record = z.object({
  sourceRecordKey: z.string().trim().min(1).max(300).optional(),
  itemType,
  name: z.string().trim().min(2).max(300),
  nameAr: z.string().trim().min(2).max(300).optional(),
  category: z.string().trim().min(2).max(160),
  subcategory: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(6000).optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  unitOfMeasure: z.string().trim().max(80).optional(),
  purchaseUnit: z.string().trim().max(160).optional(),
  images: z.array(z.string().url()).max(8).default([]),
  searchTerms: z.array(z.string().trim().min(1).max(160)).max(40).default([]),
});
const ingestSchema = z.object({
  source: z.object({
    url: z.string().url().max(2000),
    type: z.string().trim().min(2).max(80).default('STRUCTURED_IMPORT'),
    permissionStatus: z.enum(['PERMISSION_UNKNOWN', 'PERMITTED', 'RESTRICTED']).default('PERMISSION_UNKNOWN'),
    observedAt: z.string().datetime().optional(),
  }),
  records: z.array(record).min(1).max(100),
});
const reviewSchema = z.object({
  candidateId: z.string().min(1),
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().trim().min(10).max(1000),
  publicDescription: z.string().trim().min(10).max(2000).optional(),
  publicAttributes: z.record(z.string(), z.unknown()).default({}),
  publicImages: z.array(z.string().url()).max(8).default([]),
  publicSearchTerms: z.array(z.string().trim().min(1).max(160)).max(40).default([]),
});

/** Prisma JSON inputs reject `unknown`; the payload has already passed zod validation. */
function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function publishedCommercialTerms(attributes: unknown, publicAttributes: Record<string, unknown>) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return publicAttributes;
  const observed = (attributes as Record<string, unknown>).observedCommercialData;
  if (!observed || typeof observed !== 'object' || Array.isArray(observed)) return publicAttributes;
  const value = observed as Record<string, unknown>;
  const price = value.unitPrice;
  const currency = value.currency;
  const observedAt = value.observedAt;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || typeof currency !== 'string' || typeof observedAt !== 'string') return publicAttributes;
  const moq = value.moq;
  return {
    ...publicAttributes,
    marketReference: {
      price,
      currency: currency.toUpperCase(),
      observedAt,
      label: 'Published MOQ price',
      ...(typeof moq === 'number' && Number.isInteger(moq) && moq > 0 ? { moq } : {}),
    },
  };
}

async function directoryAdmin() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) };
  if (actor.platformRole !== 'ADMIN') return { actor: null, response: NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 }) };
  return { actor, response: null };
}

export async function GET() {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const candidates = await prisma.directoryCandidate.findMany({
    where: { reviewStatus: 'PENDING_REVIEW', deletedAt: null },
    include: { source: { select: { sourceUrl: true, sourceType: true, permissionStatus: true, observedAt: true } } },
    orderBy: { createdAt: 'asc' }, take: 100,
  });
  return NextResponse.json({ candidates });
}

/** Structured JSON ingestion adapter. It only parks normalized candidates for review. */
export async function POST(request: Request) {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const parsed = ingestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'VALID_DIRECTORY_SOURCE_AND_RECORDS_REQUIRED' }, { status: 400 });
  const observedAt = parsed.data.source.observedAt ? new Date(parsed.data.source.observedAt) : new Date();
  const source = await prisma.directorySource.upsert({
    where: { sourceUrl: parsed.data.source.url },
    // Re-ingestion cannot silently downgrade a prior permission decision.
    update: { sourceType: parsed.data.source.type, observedAt, lastAttemptAt: new Date(), lastSuccessAt: new Date(), refreshStatus: 'INGESTED' },
    create: { sourceUrl: parsed.data.source.url, sourceType: parsed.data.source.type, permissionStatus: parsed.data.source.permissionStatus, observedAt, lastAttemptAt: new Date(), lastSuccessAt: new Date(), refreshStatus: 'INGESTED' },
    select: { id: true },
  });
  const outcomes = [] as Array<{ id: string; duplicateOfId: string | null; status: string }>;
  for (const item of parsed.data.records) {
    const normalizedName = normalizeDirectoryText(item.name);
    const searchText = directorySearchText(item);
    const duplicate = await prisma.directoryCandidate.findFirst({
      where: { normalizedName, category: item.category, itemType: item.itemType, deletedAt: null, reviewStatus: { in: ['PENDING_REVIEW', 'APPROVED'] } },
      select: { id: true },
    });
    const sourceFingerprint = directoryFingerprint({ sourceUrl: parsed.data.source.url, sourceRecordKey: item.sourceRecordKey, itemType: item.itemType, name: item.name, category: item.category });
    const candidate = await prisma.directoryCandidate.upsert({
      where: { sourceFingerprint },
      update: { name: item.name, nameAr: item.nameAr, normalizedName, searchText, category: item.category, subcategory: item.subcategory, description: item.description, attributes: toJson(item.attributes), unitOfMeasure: item.unitOfMeasure, purchaseUnit: item.purchaseUnit, images: toJson(safeDirectoryImages(item.images)), searchTerms: toJson(item.searchTerms), sourceSnapshot: toJson(item), duplicateOfId: duplicate?.id ?? null, reviewStatus: 'PENDING_REVIEW', reviewNote: null, reviewedAt: null, reviewedById: null },
      create: { sourceId: source.id, sourceRecordKey: item.sourceRecordKey, sourceFingerprint, normalizedName, searchText, itemType: item.itemType, name: item.name, nameAr: item.nameAr, category: item.category, subcategory: item.subcategory, description: item.description, attributes: toJson(item.attributes), unitOfMeasure: item.unitOfMeasure, purchaseUnit: item.purchaseUnit, images: toJson(safeDirectoryImages(item.images)), searchTerms: toJson(item.searchTerms), sourceSnapshot: toJson(item), duplicateOfId: duplicate?.id ?? null, reviewStatus: 'PENDING_REVIEW' },
      select: { id: true, duplicateOfId: true, reviewStatus: true },
    });
    outcomes.push({ id: candidate.id, duplicateOfId: candidate.duplicateOfId, status: candidate.reviewStatus });
  }
  await appendAuditEntry({ entityName: 'DIRECTORY_SOURCE', entityId: source.id, actionType: 'CREATED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { sourceUrl: parsed.data.source.url, records: outcomes.length, status: 'PENDING_REVIEW' } });
  return NextResponse.json({ sourceId: source.id, candidates: outcomes, published: 0 }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'CANDIDATE_DECISION_AND_REVIEW_NOTE_REQUIRED' }, { status: 400 });
  const candidate = await prisma.directoryCandidate.findUnique({
    where: { id: parsed.data.candidateId },
    include: { source: { select: { id: true, sourceUrl: true, permissionStatus: true } } },
  });
  if (!candidate || candidate.deletedAt || candidate.reviewStatus !== 'PENDING_REVIEW') return NextResponse.json({ error: 'PENDING_DIRECTORY_CANDIDATE_NOT_FOUND' }, { status: 404 });
  if (parsed.data.decision === 'APPROVE' && candidate.source.permissionStatus !== 'PERMITTED') return NextResponse.json({ error: 'SOURCE_PERMISSION_REQUIRED_FOR_PUBLICATION' }, { status: 409 });
  if (parsed.data.decision === 'APPROVE' && !parsed.data.publicDescription) return NextResponse.json({ error: 'PUBLIC_DESCRIPTION_REQUIRED_FOR_PUBLICATION' }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const reviewed = await tx.directoryCandidate.update({ where: { id: candidate.id }, data: { reviewStatus: parsed.data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewNote: parsed.data.reviewNote, reviewedAt: new Date(), reviewedById: actor.id } });
    const profile = parsed.data.decision === 'APPROVE' ? await tx.directoryProfile.create({
      data: { candidateId: candidate.id, itemType: candidate.itemType, name: candidate.name, nameAr: candidate.nameAr, category: candidate.category, subcategory: candidate.subcategory, description: parsed.data.publicDescription, attributes: toJson(publishedCommercialTerms(candidate.attributes, parsed.data.publicAttributes)), unitOfMeasure: candidate.unitOfMeasure, purchaseUnit: candidate.purchaseUnit, images: toJson(safeDirectoryImages(parsed.data.publicImages)), searchTerms: toJson(parsed.data.publicSearchTerms), searchText: directorySearchText({ name: candidate.name, nameAr: candidate.nameAr ?? undefined, category: candidate.category, subcategory: candidate.subcategory ?? undefined, description: parsed.data.publicDescription, searchTerms: parsed.data.publicSearchTerms }), publicationStatus: 'PUBLISHED', publishedById: actor.id },
      select: { id: true },
    }) : null;
    await appendAuditEntry({ entityName: parsed.data.decision === 'APPROVE' ? 'DIRECTORY_PROFILE' : 'DIRECTORY_CANDIDATE', entityId: profile?.id ?? candidate.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { candidateId: candidate.id, decision: parsed.data.decision, reviewNote: parsed.data.reviewNote, sourceId: candidate.source.id } }, tx);
    return { candidate: reviewed, profile };
  });
  return NextResponse.json({ candidateId: result.candidate.id, reviewStatus: result.candidate.reviewStatus, profileId: result.profile?.id ?? null });
}
