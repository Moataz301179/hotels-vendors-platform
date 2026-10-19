import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { directorySearchText, safeDirectoryImages } from '@/lib/directory/catalog-normalization';
import { hasOpenLicensedEvidence, openLicensedCatalogue } from '@/lib/directory/open-licensed-catalog';

const input = z.object({ candidateIds: z.array(z.string().min(1)).min(1).max(100) });
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const hasClearedOpenCatalogueImage = (images: unknown) => {
  const normalized = safeDirectoryImages(images);
  return normalized.length > 0 && normalized.every((image) => {
    try {
      const url = new URL(image);
      return url.protocol === 'https:' && url.hostname === 'images.openfoodfacts.org' && !url.pathname.includes('/invalid/');
    } catch { return false; }
  });
};

async function directoryAdmin() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) };
  if (actor.platformRole !== 'ADMIN') return { actor: null, response: NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 }) };
  return { actor, response: null };
}

/**
 * Publishes an intentionally narrow class of source: a known open-data export
 * with a recorded ODbL/CC-BY-SA evidence object. It cannot be used to publish
 * arbitrary scraped supplier material or commercial terms.
 */
export async function POST(request: Request) {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'OPEN_LICENSED_CANDIDATE_IDS_REQUIRED' }, { status: 400 });
  const candidates = await prisma.directoryCandidate.findMany({
    where: { id: { in: parsed.data.candidateIds }, reviewStatus: 'PENDING_REVIEW', deletedAt: null },
    include: { source: { select: { id: true, sourceUrl: true, sourceType: true, permissionStatus: true } } },
  });
  if (candidates.length !== parsed.data.candidateIds.length) return NextResponse.json({ error: 'PENDING_OPEN_LICENSED_CANDIDATES_REQUIRED' }, { status: 409 });
  const invalid = candidates.find(candidate => {
    const catalogue = openLicensedCatalogue(candidate.source.sourceUrl);
    return !catalogue || candidate.source.sourceType !== catalogue.sourceType || candidate.source.permissionStatus !== 'PERMITTED' || candidate.duplicateOfId || !hasOpenLicensedEvidence(candidate.attributes) || !hasClearedOpenCatalogueImage(candidate.images);
  });
  if (invalid) return NextResponse.json({ error: 'OPEN_LICENSED_SOURCE_EVIDENCE_REQUIRED' }, { status: 409 });

  // A governed batch can contain 100 profiles. Keep the whole review,
  // publication, and audit record atomic, but allow enough time for a remote
  // production database instead of Prisma's five-second interactive default.
  const result = await prisma.$transaction(async (tx) => {
    const profiles: string[] = [];
    for (const candidate of candidates) {
      const catalogue = openLicensedCatalogue(candidate.source.sourceUrl)!;
      const reviewed = await tx.directoryCandidate.update({ where: { id: candidate.id }, data: { reviewStatus: 'APPROVED', reviewNote: 'Automated publication from a verified open-licensed catalogue batch.', reviewedAt: new Date(), reviewedById: actor.id } });
      const profile = await tx.directoryProfile.create({
        data: {
          candidateId: reviewed.id, itemType: candidate.itemType, name: candidate.name, nameAr: candidate.nameAr,
          category: candidate.category, subcategory: candidate.subcategory,
          description: candidate.description ?? 'Open-licensed product reference. Confirm commercial terms through a controlled RFQ.',
          attributes: toJson({ catalogueAttribution: { label: catalogue.attribution, url: catalogue.attributionUrl } }),
          unitOfMeasure: candidate.unitOfMeasure, purchaseUnit: candidate.purchaseUnit,
          images: toJson(safeDirectoryImages(candidate.images)), searchTerms: toJson(candidate.searchTerms),
          searchText: directorySearchText({ name: candidate.name, nameAr: candidate.nameAr ?? undefined, category: candidate.category, subcategory: candidate.subcategory ?? undefined, description: candidate.description ?? '', searchTerms: Array.isArray(candidate.searchTerms) ? candidate.searchTerms.filter((term): term is string => typeof term === 'string') : [] }),
          publicationStatus: 'PUBLISHED', publishedById: actor.id,
        }, select: { id: true },
      });
      profiles.push(profile.id);
    }
    await appendAuditEntry({ entityName: 'DIRECTORY_PROFILE', entityId: candidates[0].source.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { action: 'OPEN_LICENSED_BATCH_PUBLISHED', records: profiles.length, sourceUrl: candidates[0].source.sourceUrl } }, tx);
    return profiles;
  }, { timeout: 30_000 });
  return NextResponse.json({ profiles: result, published: result.length });
}
