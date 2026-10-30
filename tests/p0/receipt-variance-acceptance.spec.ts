import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), receipt: vi.fn(), update: vi.fn(), audit: vi.fn() }));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: { goodsReceiptNote: { findFirst: m.receipt, update: m.update } } }));

import { POST } from '@/app/api/v2/grn/[grnId]/variance/route';

describe('hotel receipt-variance acceptance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'hotel-admin', tenantId: 'hotel-tenant', platformRole: 'HOTEL', role: 'GM' });
    m.permission.mockResolvedValue(undefined);
    m.receipt.mockResolvedValue({ id: 'grn-1', tenantId: 'hotel-tenant', quantityVarianceAcceptedAt: null, lineItems: [{ receivedQuantity: 8, acceptedQuantity: 6 }] });
    m.update.mockResolvedValue({ id: 'grn-1', quantityVarianceAcceptedAt: new Date('2026-10-29T10:00:00.000Z') });
    m.audit.mockResolvedValue('audit-1');
  });

  it('requires a hotel approver before releasing a quantity variance for funding review', async () => {
    m.actor.mockResolvedValue({ id: 'receiver', tenantId: 'hotel-tenant', platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    const response = await POST(new Request('https://hotelsvendors.test/api/v2/grn/grn-1/variance', { method: 'POST' }), { params: Promise.resolve({ grnId: 'grn-1' }) });

    expect(response.status).toBe(403);
    expect(m.receipt).not.toHaveBeenCalled();
  });

  it('records only an explicit hotel acceptance for a HOVIN-confirmed difference', async () => {
    const response = await POST(new Request('https://hotelsvendors.test/api/v2/grn/grn-1/variance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accept: true }) }), { params: Promise.resolve({ grnId: 'grn-1' }) });

    expect(response.status).toBe(200);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'grn-1' }, data: expect.objectContaining({ quantityVarianceAcceptedById: 'hotel-admin' }) }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'GOODS_RECEIPT_NOTE', entityId: 'grn-1', actionType: 'UPDATE' }));
  });

  it('refuses an attempt to accept a receipt without a quantity difference', async () => {
    m.receipt.mockResolvedValue({ id: 'grn-1', tenantId: 'hotel-tenant', quantityVarianceAcceptedAt: null, lineItems: [{ receivedQuantity: 8, acceptedQuantity: 8 }] });
    const response = await POST(new Request('https://hotelsvendors.test/api/v2/grn/grn-1/variance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accept: true }) }), { params: Promise.resolve({ grnId: 'grn-1' }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'NO_RECEIPT_VARIANCE' });
    expect(m.update).not.toHaveBeenCalled();
  });
});
