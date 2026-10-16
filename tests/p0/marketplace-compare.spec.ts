import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  actor: vi.fn(), compare: vi.fn(), evidenceCreate: vi.fn(), products: vi.fn(), resolved: vi.fn(),
  opportunityFind: vi.fn(), opportunityCreate: vi.fn(), audit: vi.fn(),
}));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/sourcing/scrapegraph-discovery', () => ({ compareMarketOffers: m.compare }));
vi.mock('@/lib/catalog/resolved-product-evidence', () => ({ resolvedProductEvidenceIds: m.resolved }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  evidenceRecord: { create: m.evidenceCreate },
  product: { findMany: m.products },
  opportunity: { findFirst: m.opportunityFind, create: m.opportunityCreate },
} }));

import { POST } from '@/app/api/v2/marketplace/compare/route';

const request = (body: unknown) => new Request('https://hotelsvendors.test/api/v2/marketplace/compare', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

describe('observed market comparison', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'hotel-user', tenantId: 'hotel-tenant', platformRole: 'HOTEL' });
    m.compare.mockResolvedValue({ observedAt: '2026-10-16T00:00:00.000Z', offers: [{ sourceUrl: 'https://source.example/towel', unitPrice: 80 }] });
    m.evidenceCreate.mockResolvedValue({ id: 'evidence-1' });
    m.products.mockResolvedValue([{ id: 'supplier-product', supplierId: 'supplier', unitPrice: 100, name: 'Bath towel', sourceKey: 'https://supplier.example/towel' }]);
    m.resolved.mockResolvedValue(new Set(['supplier-product']));
    m.opportunityFind.mockResolvedValue(null);
    m.opportunityCreate.mockResolvedValue({ id: 'opportunity-1', title: 'Alternative source observed for Bath towel' });
    m.audit.mockResolvedValue(undefined);
  });

  it('compares against a resolved supplier product instead of a hotel-owned product', async () => {
    const response = await POST(request({ query: 'towel', quantity: 10 }));

    expect(response.status).toBe(200);
    expect(m.products).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      source: { not: 'FIXTURE' },
      supplier: { status: 'ACTIVE', isVerified: true, deletedAt: null },
    }) }));
    expect(m.resolved).toHaveBeenCalledWith(expect.anything(), expect.any(Array));
    expect(m.opportunityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      tenantId: 'hotel-tenant', affectedProductId: 'supplier-product', verificationState: 'OBSERVED_PUBLIC_SOURCE',
    }) }));
  });

  it('does not create an opportunity from an unresolved supplier product', async () => {
    m.resolved.mockResolvedValue(new Set());

    const response = await POST(request({ query: 'towel', quantity: 10 }));

    expect(response.status).toBe(200);
    expect(m.opportunityCreate).not.toHaveBeenCalled();
  });
});
