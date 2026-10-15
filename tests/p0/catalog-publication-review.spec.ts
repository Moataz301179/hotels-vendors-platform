import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  actor: vi.fn(), productFindMany: vi.fn(), productFindFirst: vi.fn(), productUpdate: vi.fn(),
  evidenceFindMany: vi.fn(), evidenceFindFirst: vi.fn(), evidenceUpdate: vi.fn(),
  transaction: vi.fn(), audit: vi.fn(),
}));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  product: { findMany: m.productFindMany, findFirst: m.productFindFirst },
  evidenceRecord: { findMany: m.evidenceFindMany, findFirst: m.evidenceFindFirst },
  $transaction: m.transaction,
} }));

import { GET, PATCH } from '@/app/api/v2/admin/catalog-reviews/route';

const admin = { id: 'admin-1', tenantId: 'platform', platformRole: 'ADMIN' };
const pendingProduct = { id: 'product-1', tenantId: 'supplier-tenant', status: 'INACTIVE', sourceKey: 'https://supplier.example/catalog/towels', supplier: { isVerified: true, status: 'ACTIVE' } };
const request = (body: object) => new Request('https://hotelsvendors.com/api/v2/admin/catalog-reviews', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('catalog publication review', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(admin);
    m.productFindMany.mockResolvedValue([]);
    m.evidenceFindMany.mockResolvedValue([]);
    m.productFindFirst.mockResolvedValue(pendingProduct);
    m.evidenceFindFirst.mockResolvedValue({ id: 'evidence-1', sourceUrl: pendingProduct.sourceKey });
    m.productUpdate.mockResolvedValue({ id: 'product-1', status: 'ACTIVE' });
    m.evidenceUpdate.mockResolvedValue({});
    m.audit.mockResolvedValue('audit-1');
    m.transaction.mockImplementation(fn => fn({ product: { update: m.productUpdate }, evidenceRecord: { update: m.evidenceUpdate } }));
  });

  it('does not expose pending supplier submissions to non-admin users', async () => {
    m.actor.mockResolvedValue({ ...admin, platformRole: 'HOTEL' });
    expect((await GET()).status).toBe(403);
    expect(m.productFindMany).not.toHaveBeenCalled();
  });

  it('publishes only a reviewable pending product and resolves its evidence atomically', async () => {
    const response = await PATCH(request({ productId: 'product-1', decision: 'APPROVE', reviewNote: 'Verified supplier product and source page.' }));
    expect(response.status).toBe(200);
    expect(m.productUpdate).toHaveBeenCalledWith({ where: { id: 'product-1' }, data: { status: 'ACTIVE' } });
    expect(m.evidenceUpdate).toHaveBeenCalledWith({ where: { id: 'evidence-1' }, data: { status: 'RESOLVED' } });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'PRODUCT', entityId: 'product-1', tenantId: 'supplier-tenant', changes: expect.objectContaining({ reviewDecision: 'APPROVE', sourceUrl: pendingProduct.sourceKey }) }), expect.anything());
  });

  it('refuses publication if the evidence source is no longer tied to the submitted product', async () => {
    m.evidenceFindFirst.mockResolvedValue({ id: 'evidence-1', sourceUrl: 'https://different.example/item' });
    const response = await PATCH(request({ productId: 'product-1', decision: 'APPROVE', reviewNote: 'Verified supplier product and source page.' }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'PRODUCT_EVIDENCE_NOT_REVIEWABLE' });
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
