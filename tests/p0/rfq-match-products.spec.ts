import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), products: vi.fn(), resolved: vi.fn() }));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/catalog/resolved-product-evidence', () => ({ resolvedProductEvidenceIds: m.resolved }));
vi.mock('@/lib/prisma', () => ({ prisma: { product: { findMany: m.products } } }));

import { GET } from '@/app/api/v2/rfq/match/products/route';

describe('admin matching product search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'admin', tenantId: 'platform', platformRole: 'ADMIN' });
    m.permission.mockResolvedValue(undefined);
    m.products.mockResolvedValue([{ id: 'product-1', name: 'Bath towel', sku: 'TOWEL-1', unitOfMeasure: 'piece', sourceKey: 'https://vendor.example/towel', supplier: { name: 'Verified Vendor' } }]);
    m.resolved.mockResolvedValue(new Set(['product-1']));
  });

  it('keeps identity-bearing product search restricted to authorized administrators', async () => {
    m.actor.mockResolvedValue({ id: 'hotel', tenantId: 'hotel-1', platformRole: 'HOTEL' });
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/rfq/match/products?q=towel'));
    expect(response.status).toBe(403);
    expect(m.products).not.toHaveBeenCalled();
  });

  it('returns only resolved verified Vendor products for matching', async () => {
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/rfq/match/products?q=towel'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ products: [{ id: 'product-1', name: 'Bath towel', sku: 'TOWEL-1', unitOfMeasure: 'piece', vendorName: 'Verified Vendor' }] });
    expect(m.products).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ supplier: expect.objectContaining({ isVerified: true }) }) }));
  });
});
