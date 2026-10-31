import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  sourceUpsert: vi.fn(),
  candidateFindFirst: vi.fn(),
  candidateUpsert: vi.fn(),
  candidateFindMany: vi.fn(),
  candidateFindUnique: vi.fn(),
  candidateUpdate: vi.fn(),
  profileCreate: vi.fn(),
  profileFindMany: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  directorySource: { upsert: m.sourceUpsert },
  directoryCandidate: { findFirst: m.candidateFindFirst, upsert: m.candidateUpsert, findMany: m.candidateFindMany, findUnique: m.candidateFindUnique, update: m.candidateUpdate },
  directoryProfile: { create: m.profileCreate, findMany: m.profileFindMany },
  $transaction: m.transaction,
} }));

import { GET as getDirectory } from '@/app/api/v2/directory/route';
import { GET as getQueue, PATCH as reviewCandidate, POST as ingestCandidates } from '@/app/api/v2/admin/directory/candidates/route';
import { POST as publishOpenLicensed } from '@/app/api/v2/admin/directory/open-license-publish/route';

const admin = { id: 'admin-1', tenantId: 'platform', platformRole: 'ADMIN' };
const jsonRequest = (url: string, body: unknown, method = 'POST') => new Request(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('directory catalog foundation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(admin);
    m.sourceUpsert.mockResolvedValue({ id: 'source-1' });
    m.candidateFindFirst.mockResolvedValue(null);
    m.candidateUpsert.mockResolvedValue({ id: 'candidate-1', reviewStatus: 'PENDING_REVIEW' });
    m.candidateFindMany.mockResolvedValue([]);
    m.profileFindMany.mockResolvedValue([]);
    m.audit.mockResolvedValue('audit-1');
    m.transaction.mockImplementation((work) => work({ directoryCandidate: { update: m.candidateUpdate }, directoryProfile: { create: m.profileCreate } }));
  });

  it('keeps candidate ingestion behind an administrator and creates no public profile', async () => {
    m.actor.mockResolvedValue({ ...admin, platformRole: 'HOTEL' });
    const denied = await ingestCandidates(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { source: { url: 'https://catalog.example.test/products' }, records: [{ name: 'Bath towel', itemType: 'PRODUCT', category: 'LINEN_TEXTILES' }] }));
    expect(denied.status).toBe(403);
    expect(m.sourceUpsert).not.toHaveBeenCalled();

    m.actor.mockResolvedValue(admin);
    const accepted = await ingestCandidates(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { source: { url: 'https://catalog.example.test/products' }, records: [{ sourceRecordKey: 'towel-001', name: 'Bath towel', itemType: 'PRODUCT', category: 'LINEN_TEXTILES', unitOfMeasure: 'piece', images: ['https://images.example.test/towel.jpg'] }] }));
    expect(accepted.status).toBe(201);
    expect(m.candidateUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ reviewStatus: 'PENDING_REVIEW', sourceId: 'source-1' }) }));
    expect(m.profileCreate).not.toHaveBeenCalled();
  });

  it('marks a likely matching candidate for review instead of merging it automatically', async () => {
    m.candidateFindFirst.mockResolvedValue({ id: 'existing-candidate' });
    const response = await ingestCandidates(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { source: { url: 'https://catalog.example.test/products' }, records: [{ sourceRecordKey: 'towel-002', name: 'Bath towel', itemType: 'PRODUCT', category: 'LINEN_TEXTILES' }] }));
    expect(response.status).toBe(201);
    expect(m.candidateUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ duplicateOfId: 'existing-candidate', reviewStatus: 'PENDING_REVIEW' }) }));
  });

  it('does not flag a re-queued source record as a duplicate of itself', async () => {
    m.candidateFindUnique.mockResolvedValue({ id: 'candidate-1' });
    const response = await ingestCandidates(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      source: { url: 'https://catalog.example.test/products' },
      records: [{ sourceRecordKey: 'towel-001', name: 'Bath towel', itemType: 'PRODUCT', category: 'LINEN_TEXTILES' }],
    }));
    expect(response.status).toBe(201);
    expect(m.candidateFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: { not: 'candidate-1' } }) }));
    expect(m.candidateUpsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ duplicateOfId: null }) }));
  });

  it('publishes a reviewed profile without returning source or supplier data to discovery users', async () => {
    const pending = { id: 'candidate-1', sourceId: 'source-1', itemType: 'PRODUCT', name: 'Acme Hospitality Towels', nameAr: null, category: 'LINEN_TEXTILES', subcategory: null, description: 'Private source catalogue record', attributes: { material: 'cotton', technicalSpecification: 'Made by Acme' }, unitOfMeasure: 'piece', purchaseUnit: null, images: ['https://images.example.test/towel.jpg'], searchTerms: ['acme'], reviewStatus: 'PENDING_REVIEW', source: { id: 'source-1', sourceUrl: 'https://catalog.example.test/products', permissionStatus: 'PERMITTED' } };
    m.candidateFindUnique.mockResolvedValue(pending);
    m.candidateUpdate.mockResolvedValue({ ...pending, reviewStatus: 'APPROVED' });
    m.profileCreate.mockResolvedValue({ id: 'profile-1' });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { candidateId: 'candidate-1', decision: 'APPROVE', reviewNote: 'Evidence and image suitability reviewed by catalog operations.', publicName: 'Hotel bath towel', publicCategory: 'Housekeeping linen', publicUnitOfMeasure: 'individual item', publicDescription: 'White cotton textile for guest-room replenishment.', publicAttributes: { material: 'cotton' }, publicImages: ['https://images.example.test/towel.jpg'], publicSearchTerms: ['bath towel', 'hotel towel'] }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(m.profileCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ candidateId: 'candidate-1', publicationStatus: 'PUBLISHED' }) }));
    expect(m.profileCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Hotel bath towel', category: 'Housekeeping linen', attributes: { material: 'cotton' }, searchTerms: [] }) }));
    expect(JSON.stringify(m.profileCreate.mock.calls[0][0])).not.toContain('Acme');

    m.profileFindMany.mockResolvedValue([{ id: 'profile-1', itemType: 'PRODUCT', name: 'Bath towel', nameAr: null, category: 'LINEN_TEXTILES', subcategory: null, description: 'Hotel bath towel', attributes: { material: 'cotton' }, unitOfMeasure: 'piece', purchaseUnit: null, images: ['https://images.example.test/towel.jpg'], searchTerms: ['towel'], updatedAt: new Date('2026-10-17T00:00:00.000Z'), candidate: { source: { sourceUrl: 'https://catalog.example.test/products' } } }]);
    const publicResponse = await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?q=towel'));
    expect(publicResponse.status).toBe(200);
    const body = await publicResponse.json() as { profiles: Array<Record<string, unknown>> };
    expect(body.profiles).toEqual([expect.objectContaining({ id: 'profile-1', name: 'Bath towel', rfqRequired: true })]);
    expect(JSON.stringify(body)).not.toContain('catalog.example.test');
    expect(JSON.stringify(body)).not.toMatch(/supplier/i);
  });

  it('resolves a selected published reference by opaque identifier without expanding the public payload', async () => {
    m.profileFindMany.mockResolvedValue([{ id: 'profile-1', itemType: 'PRODUCT', name: 'Hotel banquet napkin', nameAr: null, category: 'FOOD_BEVERAGE', subcategory: 'Table service', description: 'Bulk hospitality reference.', attributes: {}, unitOfMeasure: 'piece', purchaseUnit: 'carton', images: [], searchTerms: ['napkin'], updatedAt: new Date('2026-10-17T00:00:00.000Z') }]);
    const response = await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?id=profile-1'));
    expect(response.status).toBe(200);
    expect(m.profileFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'profile-1', publicationStatus: 'PUBLISHED', deletedAt: null, candidate: expect.objectContaining({ is: expect.objectContaining({ reviewStatus: 'APPROVED' }) }) }) }));
    const body = await response.json() as { profiles: Array<Record<string, unknown>> };
    expect(body.profiles).toEqual([expect.objectContaining({ id: 'profile-1', name: 'Hotel banquet napkin', purchaseUnit: 'carton', rfqRequired: true })]);
    expect(JSON.stringify(body)).not.toMatch(/supplier|sourceUrl|candidate/i);
  });

  it('omits source-bearing metadata and third-party media from the public directory DTO', async () => {
    m.profileFindMany.mockResolvedValue([{
      id: 'profile-1', itemType: 'PRODUCT', name: 'Hotel banquet napkin', nameAr: null,
      category: 'FOOD_BEVERAGE', subcategory: 'Table service', description: 'Contact vendor@example.test for this reference.',
      attributes: { material: 'cotton', technicalSpecification: 'Call a vendor on +20 1234 5678', catalogueAttribution: { url: 'https://catalog.example.test/source' }, vendorContact: 'vendor@example.test' },
      unitOfMeasure: 'Call +20 1234 5678', purchaseUnit: 'vendor carton', images: ['https://media.vendor.example.test/napkin.jpg'], searchTerms: ['vendor-name'], updatedAt: new Date('2026-10-17T00:00:00.000Z'),
    }]);

    const response = await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?id=profile-1'));
    const body = await response.json() as { profiles: Array<Record<string, unknown>> };

    expect(body.profiles[0]).toEqual(expect.objectContaining({ attributes: { material: 'cotton' }, description: null, images: [], unitOfMeasure: null, purchaseUnit: null }));
    expect(body.profiles[0]).not.toHaveProperty('searchTerms');
    expect(JSON.stringify(body)).not.toMatch(/catalog\.example|vendor\.example|vendor-name|vendor@example/);
  });

  it('omits an unsafe optional Arabic label from anonymous discovery', async () => {
    m.profileFindMany.mockResolvedValue([{
      id: 'profile-1', itemType: 'PRODUCT', name: 'Hotel banquet napkin', nameAr: 'مورد المنسوجات',
      category: 'FOOD_BEVERAGE', subcategory: 'Table service', description: 'Bulk hospitality reference.', attributes: {},
      unitOfMeasure: 'piece', purchaseUnit: 'carton', images: [], searchTerms: [], updatedAt: new Date('2026-10-17T00:00:00.000Z'),
    }]);

    const response = await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?id=profile-1'));
    const body = await response.json() as { profiles: Array<Record<string, unknown>> };

    expect(body.profiles[0]).toEqual(expect.objectContaining({ nameAr: null }));
    expect(JSON.stringify(body)).not.toContain('مورد');
  });

  it('rejects a candidate whose optional public label contains source evidence', async () => {
    m.candidateFindUnique.mockResolvedValue({
      id: 'candidate-1', reviewStatus: 'PENDING_REVIEW', deletedAt: null, itemType: 'PRODUCT', name: 'Hotel bath towel',
      nameAr: 'منشفة فندقية', category: 'LINEN_TEXTILES', subcategory: null, unitOfMeasure: 'piece', purchaseUnit: 'supplier carton',
      source: { id: 'source-1', permissionStatus: 'PERMITTED' },
    });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: 'candidate-1', decision: 'APPROVE', reviewNote: 'The candidate has been reviewed for safe anonymous catalogue labels.',
      publicName: 'Hotel bath towel', publicCategory: 'LINEN_TEXTILES', publicPurchaseUnit: 'supplier carton', publicDescription: 'White cotton bath towel suitable for hotel guest-room replenishment.',
    }, 'PATCH'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'PUBLIC_PROFILE_CONTAINS_RESTRICTED_CONTENT' });
  });

  it('rejects reviewer copy that repeats a source-derived Vendor label or bare source domain', async () => {
    const pending = {
      id: 'candidate-copy', reviewStatus: 'PENDING_REVIEW', deletedAt: null, itemType: 'PRODUCT', name: 'Acme Hospitality Towels', nameAr: null,
      category: 'LINEN_TEXTILES', subcategory: null, description: 'Private source observation', attributes: { technicalSpecification: 'Made by Acme' }, unitOfMeasure: 'piece', purchaseUnit: null, searchTerms: ['acme'], sourceSnapshot: { supplierName: 'Acme Hospitality Group' },
      source: { id: 'source-1', permissionStatus: 'PERMITTED' },
    };
    m.candidateFindUnique.mockResolvedValue(pending);
    const copiedName = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'APPROVE', reviewNote: 'The review must reject direct reuse of source catalogue text.',
      publicName: 'Acme Hospitality Towels', publicCategory: 'Housekeeping linen', publicDescription: 'Neutral textile reference for hotel use.',
    }, 'PATCH'));
    expect(copiedName.status).toBe(400);
    expect(await copiedName.json()).toEqual({ error: 'PUBLIC_PROFILE_COPIES_SOURCE_CONTENT' });

    const bareDomain = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'APPROVE', reviewNote: 'The review must reject source-domain references in public description.',
      publicName: 'Hotel textile reference', publicCategory: 'Housekeeping linen', publicDescription: 'See catalog.example.test for supporting details.',
    }, 'PATCH'));
    expect(bareDomain.status).toBe(400);
    expect(await bareDomain.json()).toEqual({ error: 'PUBLIC_DESCRIPTION_CONTAINS_RESTRICTED_CONTENT' });

    const snapshotVendor = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'APPROVE', reviewNote: 'The review must reject identities recorded only in source evidence.',
      publicName: 'Acme hotel textile reference', publicCategory: 'Housekeeping linen', publicDescription: 'Neutral textile reference for hotel use.',
    }, 'PATCH'));
    expect(snapshotVendor.status).toBe(400);
    expect(await snapshotVendor.json()).toEqual({ error: 'PUBLIC_PROFILE_COPIES_SOURCE_CONTENT' });

    m.candidateFindUnique.mockResolvedValue({ ...pending, sourceSnapshot: { vendorName: 'ABC' } });
    const shortSnapshotVendor = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'APPROVE', reviewNote: 'The review must reject short identities from private source evidence.',
      publicName: 'ABC hotel textile reference', publicCategory: 'Housekeeping linen', publicDescription: 'Neutral textile reference for hotel use.',
    }, 'PATCH'));
    expect(shortSnapshotVendor.status).toBe(400);
    expect(await shortSnapshotVendor.json()).toEqual({ error: 'PUBLIC_PROFILE_COPIES_SOURCE_CONTENT' });
  });

  it('accepts blank optional review fields while publishing only required reviewer-authored content', async () => {
    const pending = { id: 'candidate-blank-optional', sourceId: 'source-1', itemType: 'PRODUCT', name: 'Acme hotel towel', nameAr: null, category: 'LINEN_TEXTILES', subcategory: null, description: 'Source observation', attributes: {}, unitOfMeasure: 'piece', purchaseUnit: null, images: [], searchTerms: [], reviewStatus: 'PENDING_REVIEW', deletedAt: null, source: { id: 'source-1', permissionStatus: 'PERMITTED' } };
    m.candidateFindUnique.mockResolvedValue(pending);
    m.candidateUpdate.mockResolvedValue({ ...pending, reviewStatus: 'APPROVED' });
    m.profileCreate.mockResolvedValue({ id: 'profile-blank-optional' });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'APPROVE', reviewNote: 'Reviewer authored the neutral profile without optional labels.',
      publicName: 'Hotel bath towel', publicCategory: 'Housekeeping linen', publicDescription: 'White cotton textile for guest-room replenishment.',
      publicNameAr: '', publicSubcategory: '', publicUnitOfMeasure: '', publicPurchaseUnit: '',
    }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(m.profileCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Hotel bath towel', nameAr: null, subcategory: null, unitOfMeasure: null, purchaseUnit: null }) }));
  });

  it('rejects a private candidate with only a review note and blank public draft fields', async () => {
    const pending = { id: 'candidate-reject', reviewStatus: 'PENDING_REVIEW', deletedAt: null, source: { id: 'source-1', permissionStatus: 'PERMISSION_UNKNOWN' } };
    m.candidateFindUnique.mockResolvedValue(pending);
    m.candidateUpdate.mockResolvedValue({ ...pending, reviewStatus: 'REJECTED' });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: pending.id, decision: 'REJECT', reviewNote: 'The source observation does not meet publication requirements.',
      publicName: '', publicNameAr: '', publicCategory: '', publicSubcategory: '', publicUnitOfMeasure: '', publicPurchaseUnit: '', publicDescription: '',
    }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(m.profileCreate).not.toHaveBeenCalled();
  });

  it('does not make source-bearing terms searchable in the public directory', async () => {
    m.profileFindMany.mockResolvedValue([]);
    await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?q=vendor-name'));
    const query = m.profileFindMany.mock.calls[0][0] as { where: { OR: unknown[] } };
    expect(JSON.stringify(query.where.OR)).not.toContain('searchText');
  });

  it('rejects a public description that contains a source URL', async () => {
    m.candidateFindUnique.mockResolvedValue({
      id: 'candidate-1', reviewStatus: 'PENDING_REVIEW', deletedAt: null, name: 'Hotel bath towel',
      source: { permissionStatus: 'PERMITTED' },
    });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', {
      candidateId: 'candidate-1', decision: 'APPROVE', reviewNote: 'The candidate has been reviewed for a safe public description.',
      publicName: 'Hotel bath towel', publicCategory: 'LINEN_TEXTILES', publicDescription: 'See https://catalog.example.test for this product reference.',
    }, 'PATCH'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'PUBLIC_DESCRIPTION_CONTAINS_RESTRICTED_CONTENT' });
  });

  it('keeps review queue access restricted to administrators', async () => {
    m.actor.mockResolvedValue(null);
    expect((await getQueue()).status).toBe(401);
    m.actor.mockResolvedValue({ ...admin, platformRole: 'SUPPLIER' });
    expect((await getQueue()).status).toBe(403);
  });

  it('does not publish candidate data when source permission is unresolved', async () => {
    m.candidateFindUnique.mockResolvedValue({ id: 'candidate-1', reviewStatus: 'PENDING_REVIEW', deletedAt: null, source: { permissionStatus: 'PERMISSION_UNKNOWN' } });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { candidateId: 'candidate-1', decision: 'APPROVE', reviewNote: 'The source is not yet cleared for public directory use.', publicDescription: 'White cotton bath towel suitable for hotel guest-room replenishment.' }, 'PATCH'));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'SOURCE_PERMISSION_REQUIRED_FOR_PUBLICATION' });
    expect(m.profileCreate).not.toHaveBeenCalled();
  });

  it('does not automatically publish open-data records from source-derived labels', async () => {
    m.candidateFindMany.mockResolvedValue([{
      id: 'open-candidate-1', itemType: 'PRODUCT', name: 'Open catalogue juice', nameAr: null,
      category: 'FOOD_BEVERAGE', subcategory: 'Beverages', description: 'Packaged beverage reference.',
      attributes: { openDataLicense: { dataLicense: 'ODbL-1.0', imageLicense: 'CC-BY-SA-4.0' } },
      unitOfMeasure: 'bottle', purchaseUnit: '1 L', images: ['https://images.openfoodfacts.org/example.jpg'], searchTerms: ['juice'], duplicateOfId: null,
      source: { id: 'open-source-1', sourceUrl: 'https://world.openfoodfacts.org/data', sourceType: 'OPEN_LICENSED_BULK_EXPORT', permissionStatus: 'PERMITTED' },
    }]);
    const response = await publishOpenLicensed(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/open-license-publish', { candidateIds: ['open-candidate-1'] }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'REVIEWER_AUTHORED_PUBLIC_PROFILE_REQUIRED', candidateIds: ['open-candidate-1'] });
    expect(m.profileCreate).not.toHaveBeenCalled();
  });

  it('keeps an open-data candidate with a placeholder image URL in manual review', async () => {
    m.candidateFindMany.mockResolvedValue([{
      id: 'broken-image-candidate', itemType: 'PRODUCT', name: 'Broken image reference', nameAr: null,
      category: 'FOOD_BEVERAGE', subcategory: null, description: null,
      attributes: { openDataLicense: { dataLicense: 'ODbL-1.0', imageLicense: 'CC-BY-SA-4.0' } },
      unitOfMeasure: null, purchaseUnit: null, images: ['https://images.openfoodfacts.org/images/products/invalid/front_en.77.400.jpg'], searchTerms: [], duplicateOfId: null,
      source: { id: 'open-source-1', sourceUrl: 'https://world.openfoodfacts.org/data', sourceType: 'OPEN_LICENSED_BULK_EXPORT', permissionStatus: 'PERMITTED' },
    }]);
    const response = await publishOpenLicensed(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/open-license-publish', { candidateIds: ['broken-image-candidate'] }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'REVIEWER_AUTHORED_PUBLIC_PROFILE_REQUIRED', candidateIds: ['broken-image-candidate'] });
    expect(m.profileCreate).not.toHaveBeenCalled();
  });
});
