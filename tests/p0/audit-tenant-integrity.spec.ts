import { describe, expect, it, vi } from 'vitest';

const auditLog = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { auditLog } }));

import { computeEntryHash, verifyTenantAuditRecords } from '@/lib/audit/tamper-proof';

type Entry = {
  id: string;
  tenantId: string;
  entityName: 'ORDER';
  entityId: string;
  actionType: 'CREATED';
  actorId: string;
  actorRole: string;
  changes: { stage: string };
  ipAddress: null;
  userAgent: null;
  createdAt: Date;
  previousHash: string;
  hash: string;
};

function entry(id: string, tenantId: string, previousHash: string, millisecond: number): Entry {
  const createdAt = new Date(1_760_000_000_000 + millisecond);
  const base = {
    id,
    tenantId,
    entityName: 'ORDER' as const,
    entityId: `order-${id}`,
    actionType: 'CREATED' as const,
    actorId: `user-${tenantId}`,
    actorRole: 'ADMIN',
    changes: { stage: id },
    ipAddress: null,
    userAgent: null,
    createdAt,
    previousHash,
  };
  return {
    ...base,
    hash: computeEntryHash({
      id: base.id,
      entityName: base.entityName,
      entityId: base.entityId,
      actionType: base.actionType,
      actorId: base.actorId,
      actorRole: base.actorRole,
      changes: JSON.stringify(base.changes),
      ipAddress: base.ipAddress,
      userAgent: base.userAgent,
      createdAt: base.createdAt,
      previousHash: base.previousHash,
    }),
  };
}

describe('organization audit integrity verification', () => {
  it('accepts an organization audit trail interleaved with another organization', async () => {
    const first = entry('first', 'hotel-a', 'genesis', 1);
    const otherTenant = entry('second', 'supplier-b', first.hash, 2);
    const third = entry('third', 'hotel-a', otherTenant.hash, 3);
    auditLog.findMany.mockResolvedValue([first, otherTenant, third]);

    await expect(verifyTenantAuditRecords('hotel-a')).resolves.toEqual({ valid: true, totalEntries: 2 });
  });

  it('flags an altered internal chain link without exposing another organization record', async () => {
    const first = entry('first', 'hotel-a', 'genesis', 1);
    const altered = { ...entry('second', 'supplier-b', first.hash, 2), hash: 'altered' };
    const third = entry('third', 'hotel-a', altered.hash, 3);
    auditLog.findMany.mockResolvedValue([first, altered, third]);

    await expect(verifyTenantAuditRecords('hotel-a')).resolves.toEqual({ valid: false, totalEntries: 1 });
  });
});
