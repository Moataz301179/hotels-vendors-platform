import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ actor: vi.fn(), sourceFindMany: vi.fn(), sourceUpdate: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: { directorySource: { findMany: m.sourceFindMany, update: m.sourceUpdate }, $transaction: m.transaction } }));

import { GET, PATCH } from '@/app/api/v2/admin/directory/sources/route';

const request = (body: unknown) => new Request('https://hotelsvendors.test/api/v2/admin/directory/sources', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('directory source governance', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'admin-1', tenantId: 'platform', platformRole: 'ADMIN' });
    m.sourceFindMany.mockResolvedValue([]);
    m.sourceUpdate.mockResolvedValue({ id: 'source-1', permissionStatus: 'PERMITTED', permissionNote: 'Written reuse permission recorded in source review register.' });
    m.audit.mockResolvedValue('audit-1');
    m.transaction.mockImplementation((work) => work({ directorySource: { update: m.sourceUpdate } }));
  });

  it('does not reveal source registry to a buyer', async () => {
    m.actor.mockResolvedValue({ platformRole: 'HOTEL' });
    expect((await GET()).status).toBe(403);
    expect(m.sourceFindMany).not.toHaveBeenCalled();
  });

  it('records a source-permission decision and an audit event before candidate publication is possible', async () => {
    const response = await PATCH(request({ sourceId: 'source-1', permissionStatus: 'PERMITTED', permissionNote: 'Written reuse permission recorded in source review register.' }));
    expect(response.status).toBe(200);
    expect(m.sourceUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'source-1' }, data: expect.objectContaining({ permissionStatus: 'PERMITTED' }) }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'DIRECTORY_SOURCE', entityId: 'source-1', changes: expect.objectContaining({ permissionStatus: 'PERMITTED' }) }), expect.anything());
  });

  it('refuses a permission decision without traceable review notes', async () => {
    const response = await PATCH(request({ sourceId: 'source-1', permissionStatus: 'PERMITTED', permissionNote: 'short' }));
    expect(response.status).toBe(400);
    expect(m.sourceUpdate).not.toHaveBeenCalled();
  });
});
