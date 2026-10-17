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

  it('publishes a reviewed profile without returning source or supplier data to discovery users', async () => {
    const pending = { id: 'candidate-1', sourceId: 'source-1', itemType: 'PRODUCT', name: 'Bath towel', nameAr: null, category: 'LINEN_TEXTILES', subcategory: null, description: 'Hotel bath towel', attributes: { material: 'cotton' }, unitOfMeasure: 'piece', purchaseUnit: null, images: ['https://images.example.test/towel.jpg'], searchTerms: ['towel'], reviewStatus: 'PENDING_REVIEW', source: { id: 'source-1', sourceUrl: 'https://catalog.example.test/products', permissionStatus: 'PERMITTED' } };
    m.candidateFindUnique.mockResolvedValue(pending);
    m.candidateUpdate.mockResolvedValue({ ...pending, reviewStatus: 'APPROVED' });
    m.profileCreate.mockResolvedValue({ id: 'profile-1' });
    const response = await reviewCandidate(jsonRequest('https://hotelsvendors.test/api/v2/admin/directory/candidates', { candidateId: 'candidate-1', decision: 'APPROVE', reviewNote: 'Evidence and image suitability reviewed by catalog operations.', publicDescription: 'White cotton bath towel suitable for hotel guest-room replenishment.', publicAttributes: { material: 'cotton' }, publicImages: ['https://images.example.test/towel.jpg'], publicSearchTerms: ['bath towel', 'hotel towel'] }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(m.profileCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ candidateId: 'candidate-1', publicationStatus: 'PUBLISHED' }) }));

    m.profileFindMany.mockResolvedValue([{ id: 'profile-1', itemType: 'PRODUCT', name: 'Bath towel', nameAr: null, category: 'LINEN_TEXTILES', subcategory: null, description: 'Hotel bath towel', attributes: { material: 'cotton' }, unitOfMeasure: 'piece', purchaseUnit: null, images: ['https://images.example.test/towel.jpg'], searchTerms: ['towel'], updatedAt: new Date('2026-10-17T00:00:00.000Z'), candidate: { source: { sourceUrl: 'https://catalog.example.test/products' } } }]);
    const publicResponse = await getDirectory(new Request('https://hotelsvendors.test/api/v2/directory?q=towel'));
    expect(publicResponse.status).toBe(200);
    const body = await publicResponse.json() as { profiles: Array<Record<string, unknown>> };
    expect(body.profiles).toEqual([expect.objectContaining({ id: 'profile-1', name: 'Bath towel', rfqRequired: true })]);
    expect(JSON.stringify(body)).not.toContain('catalog.example.test');
    expect(JSON.stringify(body)).not.toMatch(/supplier/i);
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
});
