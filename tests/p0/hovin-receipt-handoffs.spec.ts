import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), orders: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/prisma', () => ({ prisma: { order: { findMany: m.orders } } }));

import { GET } from '@/app/api/v2/mobile/receipts/route';

describe('HOVIN receipt handoffs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    m.permission.mockResolvedValue(undefined);
    m.orders.mockResolvedValue([{ id: 'order-1', orderNumber: 'HV-100', status: 'IN_TRANSIT', estimatedDelivery: new Date('2026-10-18T12:00:00.000Z'), items: [{ quantity: 10, receivedQuantity: 2 }, { quantity: 4, receivedQuantity: 0 }] }]);
  });

  it('lists only tenant-scoped, receivable handoffs without commercial or supplier data', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(m.orders).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'hotel-1', paymentGuaranteed: true, status: { in: ['IN_TRANSIT', 'PARTIALLY_DELIVERED'] } }) }));
    const body = await response.json();
    expect(body).toEqual({ handoffs: [{ orderId: 'order-1', orderNumber: 'HV-100', status: 'IN_TRANSIT', estimatedDelivery: '2026-10-18T12:00:00.000Z', lineCount: 2, remainingQuantity: 12, receiptContextPath: '/api/v2/mobile/receipts/order-1' }] });
    expect(JSON.stringify(body)).not.toContain('supplier');
  });

  it('rejects an untrusted or unauthorized session before querying orders', async () => {
    m.actor.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(m.orders).not.toHaveBeenCalled();

    m.actor.mockResolvedValue({ id: 'vendor-1', tenantId: 'vendor-1', platformRole: 'SUPPLIER', role: 'CLERK' });
    expect((await GET()).status).toBe(403);
    expect(m.orders).not.toHaveBeenCalled();
  });

  it('requires persisted receipt permission before disclosing handoffs', async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError('denied'));
    expect((await GET()).status).toBe(403);
    expect(m.orders).not.toHaveBeenCalled();
  });
});
