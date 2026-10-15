import { beforeEach, describe, expect, it, vi } from 'vitest';

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const FinancialAccessDeniedError = vi.hoisted(() => class FinancialAccessDeniedError extends Error { constructor(public code: string) { super(code); } });
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  supplier: vi.fn(),
  grant: vi.fn(),
  grants: vi.fn(),
  quotes: vi.fn(),
  rfq: vi.fn(),
  product: vi.fn(),
  products: vi.fn(),
  quoteCreate: vi.fn(),
  updateMany: vi.fn(),
  audit: vi.fn(),
  permission: vi.fn(),
  financial: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/v2-auth', () => ({ getActor: m.actor }));
vi.mock('@/lib/audit/tamper-proof', () => ({ appendAuditEntry: m.audit }));
vi.mock('@/lib/auth/rbac', () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock('@/lib/auth/financial-access', () => ({ requireFinancialAccess: m.financial, FinancialAccessDeniedError }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    supplier: { findFirst: m.supplier },
    rfqSupplierAccess: { findFirst: m.grant, findMany: m.grants },
    rfqRequest: { findFirst: m.rfq },
    product: { findFirst: m.product, findMany: m.products },
    procurementQuote: { findMany: m.quotes },
    $transaction: m.transaction,
  },
}));

import { GET as listQuotes, POST as submitQuote } from '@/app/api/v2/quotes/route';

const supplierActor = { id: 'supplier-user', tenantId: 'supplier-tenant', platformRole: 'SUPPLIER', supplierId: 'supplier-a' };
const request = (body: unknown) => new Request('https://x/api/v2/quotes', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const quote = { rfqId: 'rfq-a', unitPrice: 125, quantity: 2, deliveryFee: 10, taxAmount: 5 };

describe('supplier quote submission boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(supplierActor);
    m.supplier.mockResolvedValue({ id: 'supplier-a' });
    m.grant.mockResolvedValue({ rfqId: 'rfq-a', hotelTenantId: 'hotel-tenant' });
    m.grants.mockResolvedValue([{ rfqId: 'rfq-a' }]);
    m.quotes.mockResolvedValue([]);
    m.rfq.mockResolvedValue({ id: 'rfq-a', productId: 'product-a', supplierId: 'supplier-a', buyerId: 'buyer-a', requestedQty: 2, tenantId: 'hotel-tenant', status: 'PENDING' });
    m.product.mockResolvedValue({ id: 'product-a' });
    m.products.mockResolvedValue([]);
    m.quoteCreate.mockResolvedValue({ id: 'quote-a', ...quote });
    m.updateMany.mockResolvedValue({ count: 1 });
    m.audit.mockResolvedValue('audit-a');
    m.permission.mockResolvedValue(undefined);
    m.financial.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn({
      rfqRequest: { updateMany: m.updateMany },
      procurementQuote: { create: m.quoteCreate },
    }));
  });

  it('rejects non-supplier actors before supplier or RFQ access', async () => {
    m.actor.mockResolvedValue({ ...supplierActor, platformRole: 'HOTEL', supplierId: undefined });
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(403);
    expect(m.supplier).not.toHaveBeenCalled();
    expect(m.rfq).not.toHaveBeenCalled();
  });

  it('requires the dedicated server-side quote-submit permission before supplier data access', async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError('denied'));
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'QUOTE_SUBMIT_PERMISSION_REQUIRED' });
    expect(m.supplier).not.toHaveBeenCalled();
  });

  it('blocks a priced supplier quote until the supplier tenant tax ID is verified', async () => {
    m.financial.mockRejectedValue(new FinancialAccessDeniedError('TAX_ID_VERIFICATION_REQUIRED'));
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'TAX_ID_VERIFICATION_REQUIRED' });
    expect(m.supplier).not.toHaveBeenCalled();
    expect(m.grant).not.toHaveBeenCalled();
  });

  it('allows a verified supplier tenant to respond only through its assigned RFQ relationship', async () => {
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(201);
    expect(m.supplier.mock.calls[0][0].where).toMatchObject({ id: 'supplier-a', tenantId: 'supplier-tenant' });
    expect(m.permission).toHaveBeenCalledWith({ userId: 'supplier-user', tenantId: 'supplier-tenant', platformRole: 'SUPPLIER' }, 'quote:submit');
    expect(m.grant.mock.calls[0][0].where).toMatchObject({ rfqId: 'rfq-a', supplierId: 'supplier-a', supplierTenantId: 'supplier-tenant' });
    expect(m.rfq.mock.calls[0][0].where).toMatchObject({ id: 'rfq-a', tenantId: 'hotel-tenant', supplierId: 'supplier-a' });
    expect(m.updateMany.mock.calls[0][0].where).toMatchObject({ id: 'rfq-a', tenantId: 'hotel-tenant', supplierId: 'supplier-a', status: 'PENDING' });
    expect(m.quoteCreate.mock.calls[0][0].data).toMatchObject({ deliveryFee: 10, taxAmount: 5 });
  });

  it('does not create a commercially incomplete quote when delivery or tax is not stated', async () => {
    const response = await submitQuote(request({ rfqId: 'rfq-a', unitPrice: 125, quantity: 2, deliveryFee: 10 }));
    expect(response.status).toBe(400);
    expect(m.grant).not.toHaveBeenCalled();
    expect(m.quoteCreate).not.toHaveBeenCalled();
  });

  it('rejects a supplier response whose quantity does not match the assigned RFQ', async () => {
    const response = await submitQuote(request({ ...quote, quantity: 1 }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'QUOTE_QUANTITY_MISMATCH' });
    expect(m.product).not.toHaveBeenCalled();
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.quoteCreate).not.toHaveBeenCalled();
  });

  it('rejects a direct quote when the RFQ product is no longer active', async () => {
    m.product.mockResolvedValue(null);
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'The RFQ product is no longer active' });
    expect(m.product).toHaveBeenCalledWith({ where: { id: 'product-a', supplierId: 'supplier-a', status: 'ACTIVE', deletedAt: null }, select: { id: true } });
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.quoteCreate).not.toHaveBeenCalled();
  });

  it('refuses supplier quote listing when its tenant-scoped supplier profile is inactive or unverified', async () => {
    m.supplier.mockResolvedValue(null);
    const response = await listQuotes();
    expect(response.status).toBe(403);
    expect(m.grants).not.toHaveBeenCalled();
    expect(m.quotes).not.toHaveBeenCalled();
  });

  it('lists supplier quotes only through active supplier-tenant grants', async () => {
    const response = await listQuotes();
    expect(response.status).toBe(200);
    expect(m.grants.mock.calls[0][0].where).toMatchObject({ supplierId: 'supplier-a', supplierTenantId: 'supplier-tenant', revokedAt: null });
    expect(m.quotes.mock.calls[0][0].where).toMatchObject({ supplierId: 'supplier-a', rfqId: { in: ['rfq-a'] } });
  });

  it('gives the buying hotel the verified supplier and requested product context for a tenant-scoped quote', async () => {
    m.actor.mockResolvedValue({ id: 'buyer-a', tenantId: 'hotel-tenant', platformRole: 'HOTEL' });
    m.quotes.mockResolvedValue([{
      id: 'quote-a', unitPrice: 125, quantity: 2, deliveryFee: 10, taxAmount: 5, currency: 'EGP',
      supplier: { id: 'supplier-a', name: 'Verified Supplier', isVerified: true },
      rfq: { id: 'rfq-a', productId: 'product-a', requestedQty: 2, status: 'QUOTED', tenantId: 'hotel-tenant', product: { id: 'product-a', name: 'Bath towel', sku: 'TOWEL-01', unitOfMeasure: 'piece' } },
    }]);
    m.products.mockResolvedValue([{ id: 'product-a', name: 'Bath towel', sku: 'TOWEL-01', unitOfMeasure: 'piece' }]);

    const response = await listQuotes();
    expect(response.status).toBe(200);
    expect(m.quotes.mock.calls[0][0].where).toMatchObject({ tenantId: 'hotel-tenant', deletedAt: null });
    expect(m.quotes.mock.calls[0][0].include).toMatchObject({
      supplier: { select: { id: true, name: true, isVerified: true } },
      rfq: { select: { id: true, productId: true, requestedQty: true, status: true, tenantId: true } },
    });
    expect((await response.json()).quotes[0]).toMatchObject({
      supplier: { id: 'supplier-a', name: 'Verified Supplier', isVerified: true },
      rfq: { product: { name: 'Bath towel', sku: 'TOWEL-01' } },
      cost: { productCost: 250, deliveryCost: 10, taxCost: 5, totalCost: 265 },
    });
  });

  it('returns a conflict and creates no quote when another response claimed the RFQ first', async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    const response = await submitQuote(request(quote));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'This request already has a fixed response.' });
    expect(m.quoteCreate).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});
