import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), order: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/prisma', () => ({ prisma: { order: { findFirst: m.order } } }));

import { GET } from '@/app/api/v2/mobile/receipts/[orderId]/route';

describe('HOVIN receipt context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'receiver-1', tenantId: 'hotel-1', platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    m.permission.mockResolvedValue(undefined);
    m.order.mockResolvedValue({ id: 'order-1', orderNumber: 'HV-100', status: 'IN_TRANSIT', paymentGuaranteed: true, estimatedDelivery: new Date('2026-10-18T12:00:00.000Z'), currency: 'EGP', items: [{ id: 'line-1', quantity: 10, receivedQuantity: 2, product: { id: 'product-1', name: 'Bath towel', sku: 'TOWEL-1', unitOfMeasure: 'piece' } }], supplier: { id: 'supplier-1', name: 'Private Supplier' } });
  });

  it('returns an authorized hotel receiver only the controlled receiving context', async () => {
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/mobile/receipts/order-1'), { params: Promise.resolve({ orderId: 'order-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ order: { id: 'order-1', orderNumber: 'HV-100', canRecordReceipt: true, items: [{ remainingQuantity: 8, product: { name: 'Bath towel' } }] }, receiptEndpoint: '/api/v2/grn' });
    expect(JSON.stringify(body)).not.toContain('supplier-1');
    expect(JSON.stringify(body)).not.toContain('Private Supplier');
  });

  it('rejects a user lacking the receiving permission before any order lookup', async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError('denied'));
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/mobile/receipts/order-1'), { params: Promise.resolve({ orderId: 'order-1' }) });
    expect(response.status).toBe(403);
    expect(m.order).not.toHaveBeenCalled();
  });

  it('does not let suppliers use the hotel receiving context', async () => {
    m.actor.mockResolvedValue({ id: 'supplier-user', tenantId: 'supplier-tenant', platformRole: 'SUPPLIER', role: 'CLERK' });
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/mobile/receipts/order-1'), { params: Promise.resolve({ orderId: 'order-1' }) });
    expect(response.status).toBe(403);
    expect(m.order).not.toHaveBeenCalled();
  });
});
