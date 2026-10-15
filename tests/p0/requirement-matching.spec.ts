import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), tenants: vi.fn(), tenant: vi.fn(), requirement: vi.fn(), requirements: vi.fn(), product: vi.fn(), update: vi.fn(), grant: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/admin/managed-hotel-tenants', () => ({ managedHotelTenants: m.tenants, managedHotelTenant: m.tenant }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/prisma', () => ({ prisma: { rfqRequest: { findFirst: m.requirement, findMany: m.requirements, updateMany: m.update }, product: { findFirst: m.product }, rfqSupplierAccess: { create: m.grant }, $transaction: m.transaction } }));

import { GET, POST } from '@/app/api/v2/rfq/match/route';

const admin = { id: 'operator', tenantId: 'platform', platformRole: 'ADMIN', role: 'OWNER' };
const request = (body: unknown) => new Request('https://x/api/v2/rfq/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
type TransactionCallback = (transaction: { rfqRequest: { updateMany: unknown }; rfqSupplierAccess: { create: unknown } }) => unknown;

describe('queued requirement matching', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(admin);
    m.permission.mockResolvedValue(undefined);
    m.tenants.mockResolvedValue([{ id: 'hotel-tenant', name: 'Hotel group' }]);
    m.tenant.mockResolvedValue({ id: 'hotel-tenant', name: 'Hotel group' });
    m.requirement.mockResolvedValue({ id: 'rfq', itemName: 'Bath towels', unitOfMeasure: 'piece' });
    m.requirements.mockResolvedValue([]);
    m.product.mockResolvedValue({ id: 'product', name: 'Bath towel', sku: 'BT-01', supplierId: 'supplier', supplier: { tenantId: 'supplier-tenant' } });
    m.update.mockResolvedValue({ count: 1 });
    m.grant.mockResolvedValue({ id: 'grant' });
    m.audit.mockResolvedValue('audit');
    m.transaction.mockImplementation((fn: TransactionCallback) => fn({ rfqRequest: { updateMany: m.update }, rfqSupplierAccess: { create: m.grant } }));
  });

  it('does not reveal requirement queues to a non-admin user', async () => {
    m.actor.mockResolvedValue({ ...admin, platformRole: 'HOTEL' });
    const response = await GET(new Request('https://x/api/v2/rfq/match?tenantId=hotel-tenant'));
    expect(response.status).toBe(403);
    expect(m.requirements).not.toHaveBeenCalled();
  });

  it('lists only queued unlisted requirements for a managed hotel organization', async () => {
    const response = await GET(new Request('https://x/api/v2/rfq/match?tenantId=hotel-tenant'));
    expect(response.status).toBe(200);
    expect(m.requirements).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'hotel-tenant', productId: null, supplierId: null, matchingStatus: 'QUEUED' }) }));
  });

  it('rejects a tenant outside the platform operator scope', async () => {
    m.tenant.mockResolvedValue(null);
    const response = await POST(request({ tenantId: 'other-tenant', rfqId: 'rfq', productId: 'product' }));
    expect(response.status).toBe(404);
    expect(m.requirement).not.toHaveBeenCalled();
  });

  it('requires a verified active supplier product before matching', async () => {
    m.product.mockResolvedValue(null);
    const response = await POST(request({ tenantId: 'hotel-tenant', rfqId: 'rfq', productId: 'unverified-product' }));
    expect(response.status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.grant).not.toHaveBeenCalled();
  });

  it('matches once, grants only the selected supplier, and records the evidence trail', async () => {
    const response = await POST(request({ tenantId: 'hotel-tenant', rfqId: 'rfq', productId: 'product' }));
    expect(response.status).toBe(200);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'rfq', tenantId: 'hotel-tenant', productId: null, supplierId: null, matchingStatus: 'QUEUED' }), data: expect.objectContaining({ productId: 'product', supplierId: 'supplier', matchingStatus: 'MATCHED' }) }));
    expect(m.grant).toHaveBeenCalledWith({ data: expect.objectContaining({ rfqId: 'rfq', supplierId: 'supplier', hotelTenantId: 'hotel-tenant', supplierTenantId: 'supplier-tenant', grantedById: 'operator' }) });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'RFQ', tenantId: 'hotel-tenant', changes: expect.objectContaining({ kind: 'PRODUCT_INTELLIGENCE_MATCH', productId: 'product', supplierId: 'supplier' }) }), expect.anything());
  });

  it('does not grant supplier access when a concurrent match already changed the requirement', async () => {
    m.update.mockResolvedValue({ count: 0 });
    const response = await POST(request({ tenantId: 'hotel-tenant', rfqId: 'rfq', productId: 'product' }));
    expect(response.status).toBe(409);
    expect(m.grant).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});
