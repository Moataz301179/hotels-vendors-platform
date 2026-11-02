import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), findMany: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ PermissionDeniedError: class extends Error {}, requirePermission: m.permission }));
vi.mock('@/lib/prisma', () => ({ prisma: { order: { findMany: m.findMany } } }));
vi.mock('@/lib/admin/managed-hotel-tenants', () => ({ managedHotelTenants: vi.fn() }));
vi.mock('@/lib/logistics/eta-compliance', () => ({ classifyEtaCompliance: vi.fn(() => 'UNKNOWN') }));

import { GET } from '@/app/api/v2/orders/route';

describe('orders supplier tenant boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'supplier-user', tenantId: 'tenant-a', supplierId: 'supplier-a', platformRole: 'SUPPLIER' });
    m.permission.mockResolvedValue(undefined);
    m.findMany.mockResolvedValue([]);
  });

  it('always scopes supplier order reads by both supplier and authenticated tenant', async () => {
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/orders'));
    expect(response.status).toBe(200);
    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { supplierId: 'supplier-a', tenantId: 'tenant-a', deletedAt: null },
    }));
  });
});
