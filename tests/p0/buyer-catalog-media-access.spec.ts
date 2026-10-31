import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ actor: vi.fn(), grants: vi.fn(), product: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/prisma', () => ({ prisma: { departmentCategoryAccess: { findMany: m.grants }, product: { findFirst: m.product } } }));

import { GET } from '@/app/api/v2/catalog/products/[productId]/images/[imageIndex]/route';

describe('buyer catalogue media access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'admin-1', tenantId: 'platform', platformRole: 'ADMIN' });
  });

  it('does not allow administrators to retrieve buyer catalogue media', async () => {
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/catalog/products/product-1/images/0'), { params: Promise.resolve({ productId: 'product-1', imageIndex: '0' }) });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'BUYER_CATALOG_ACCESS_REQUIRED' });
    expect(m.grants).not.toHaveBeenCalled();
    expect(m.product).not.toHaveBeenCalled();
  });
});
