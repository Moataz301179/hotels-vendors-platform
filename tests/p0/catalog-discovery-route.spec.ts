import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ actor: vi.fn(), candidates: vi.fn(), candidateUpsert: vi.fn(), evidenceCreate: vi.fn(), audit: vi.fn(), discover: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/sourcing/scrapegraph-discovery', () => ({ discoverSupplierCatalogWithScrapeGraph: m.discover }));
vi.mock('@/lib/prisma', () => ({ prisma: { supplierResearchCandidate: { findMany: m.candidates, upsert: m.candidateUpsert }, evidenceRecord: { create: m.evidenceCreate } } }));

import { GET, POST } from '@/app/api/v2/discovery/runs/route';

const request = (body: unknown) => new Request('https://hotelsvendors.com/api/v2/discovery/runs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('catalog discovery intake', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'admin', tenantId: 'platform', platformRole: 'ADMIN' });
    m.candidates.mockResolvedValue([]);
    m.candidateUpsert.mockResolvedValue({ id: 'candidate-1', status: 'PRODUCT_REVIEW_PENDING' });
    m.evidenceCreate.mockResolvedValue({ id: 'evidence-1' });
    m.audit.mockResolvedValue(undefined);
    m.discover.mockResolvedValue({ supplierName: 'Source Supplier', canonicalUrl: 'https://supplier.example/catalogue', observedAt: '2026-10-15T00:00:00.000Z', schemaVersion: 'v1', responseHash: 'hash-1', products: [{ category: 'LINENS' }] });
  });

  it('does not expose source intake without an administrator', async () => {
    m.actor.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    m.actor.mockResolvedValue({ platformRole: 'HOTEL' });
    expect((await GET()).status).toBe(403);
    expect(m.candidates).not.toHaveBeenCalled();
  });

  it('records source observations as review-only evidence and never publishes a product', async () => {
    const response = await POST(request({ sourceUrl: 'https://supplier.example/catalogue' }));
    expect(response.status).toBe(201);
    expect(m.candidateUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ status: 'PRODUCT_REVIEW_PENDING', sourceUrl: 'https://supplier.example/catalogue' }) }));
    expect(m.evidenceCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ provenanceClass: 'OBSERVED', status: 'EXTRACTED' }) }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ changes: expect.objectContaining({ observedProducts: 1, status: 'PRODUCT_REVIEW_PENDING' }) }));
  });

  it('does not persist a candidate when source extraction is unavailable', async () => {
    m.discover.mockRejectedValue(new Error('SCRAPEGRAPH_NOT_CONFIGURED'));
    const response = await POST(request({ sourceUrl: 'https://supplier.example/catalogue' }));
    expect(response.status).toBe(503);
    expect(m.candidateUpsert).not.toHaveBeenCalled();
    expect(m.evidenceCreate).not.toHaveBeenCalled();
  });
});
