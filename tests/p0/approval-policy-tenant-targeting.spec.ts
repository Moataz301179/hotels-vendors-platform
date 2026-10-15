import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ actor: vi.fn(), targetTenant: vi.fn(), permission: vi.fn(), users: vi.fn(), department: vi.fn(), create: vi.fn(), policies: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/admin/managed-hotel-tenants', () => ({ managedHotelTenant: m.targetTenant }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError: class PermissionDeniedError extends Error {} }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  user: { findMany: m.users },
  department: { findFirst: m.department },
  procurementApprovalPolicy: { create: m.create, findMany: m.policies },
} }));

import { GET, POST } from '@/app/api/v2/admin/procurement-approval-policies/route';

const body = { tenantId: 'hotel-tenant', departmentId: 'department-a', primaryApproverId: 'approver-a', secondaryApproverId: 'approver-b', minAmount: 0, maxAmount: 50000 };
const request = (payload = body) => new Request('https://hotelsvendors.test/api/v2/admin/procurement-approval-policies', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });

describe('hotel approval policy tenancy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: 'platform-admin', tenantId: 'platform-tenant', platformRole: 'ADMIN' });
    m.targetTenant.mockResolvedValue({ id: 'hotel-tenant' });
    m.permission.mockResolvedValue(undefined);
    m.users.mockResolvedValue([{ id: 'approver-a' }, { id: 'approver-b' }]);
    m.department.mockResolvedValue({ id: 'department-a' });
    m.create.mockResolvedValue({ id: 'policy-a' });
    m.policies.mockResolvedValue([]);
  });

  it('creates the policy and audit record for the selected hotel tenant, never the platform tenant', async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(m.users).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'hotel-tenant', status: 'ACTIVE' }) }));
    expect(m.department).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'hotel-tenant' }) }));
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'hotel-tenant' }) }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'hotel-tenant' }));
  });

  it('does not expose approval policies until a managed hotel organization is selected', async () => {
    const response = await GET(new Request('https://hotelsvendors.test/api/v2/admin/procurement-approval-policies'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ policies: [] });
    expect(m.policies).not.toHaveBeenCalled();
  });

  it('rejects an unmanaged hotel target before reading approvers or departments', async () => {
    m.targetTenant.mockResolvedValue(null);
    const response = await POST(request({ ...body, tenantId: 'other-tenant' }));
    expect(response.status).toBe(404);
    expect(m.users).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
});
