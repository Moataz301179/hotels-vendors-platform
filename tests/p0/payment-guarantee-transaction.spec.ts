import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ transaction: vi.fn(), updateMany: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: m.transaction } }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));

import { PaymentGuaranteeTransitionError, setPaymentGuarantee } from '@/lib/auth/authority-matrix';

const input = {
  orderId: 'order-a',
  tenantId: 'hotel-a',
  method: 'DIRECT' as const,
  etaValidated: false,
  verifiedBy: 'platform-admin',
  verifiedAt: new Date('2026-10-15T12:00:00.000Z'),
};

describe('payment guarantee transaction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('commits the state change and its audit record in one transaction', async () => {
    m.updateMany.mockResolvedValue({ count: 1 });
    m.transaction.mockImplementation((work: (tx: unknown) => unknown) => work({ order: { updateMany: m.updateMany } }));

    await setPaymentGuarantee(input);

    expect(m.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'order-a', tenantId: 'hotel-a', status: 'PENDING_APPROVAL', paymentGuaranteed: false, deletedAt: null }),
      data: expect.objectContaining({ paymentGuaranteed: true, paymentGuaranteeMethod: 'DIRECT', paymentGuaranteeSetAt: input.verifiedAt }),
    }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'order-a', tenantId: 'hotel-a', actorId: 'platform-admin' }), expect.anything());
  });

  it('fails closed when the order no longer satisfies the guarded transition', async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    m.transaction.mockImplementation((work: (tx: unknown) => unknown) => work({ order: { updateMany: m.updateMany } }));

    await expect(setPaymentGuarantee(input)).rejects.toBeInstanceOf(PaymentGuaranteeTransitionError);
    expect(m.audit).not.toHaveBeenCalled();
  });
});
