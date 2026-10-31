import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

if (process.env.HV_RUN_DB_INTEGRATION !== '1') {
  throw new Error('Refusing to run database integration tests without HV_RUN_DB_INTEGRATION=1.');
}

const integrationDatabaseUrl = process.env.DATABASE_URL;
if (!integrationDatabaseUrl) {
  throw new Error('Refusing to run database integration tests without DATABASE_URL.');
}
const integrationDatabaseHost = new URL(integrationDatabaseUrl).hostname;
if (integrationDatabaseHost.endsWith('.neon.tech') && process.env.HV_INTEGRATION_ALLOW_REMOTE !== '1') {
  throw new Error('Refusing to run database integration tests against Neon without HV_INTEGRATION_ALLOW_REMOTE=1. Use the isolated CI database or an explicit disposable branch.');
}

const session = vi.hoisted(() => ({ actor: null as Record<string, unknown> | null }));

vi.mock('@/lib/v2-auth', () => ({ getActor: vi.fn(() => session.actor) }));

import { prisma } from '@/lib/prisma';
import { POST as createRfq } from '@/app/api/v2/rfq/route';
import { POST as matchRequirement } from '@/app/api/v2/rfq/match/route';
import { POST as submitQuote } from '@/app/api/v2/quotes/route';
import { POST as acceptQuote } from '@/app/api/v2/quotes/accept/route';
import { POST as recordGuarantee } from '@/app/api/v2/orders/guarantee/route';
import { PATCH as transitionOrder } from '@/app/api/v2/orders/route';
import { POST as receiveOrder } from '@/app/api/v2/grn/route';
import { GET as listMarketplace } from '@/app/api/v2/marketplace/route';
import { GET as listRoleCatalog, POST as submitCatalogItem } from '@/app/api/v2/catalog/route';
import { PATCH as reviewCatalogItem } from '@/app/api/v2/admin/catalog-reviews/route';

const run = randomUUID().replaceAll('-', '');
const ids = {
  platformTenant: `it-platform-${run}`,
  hotelTenant: `it-hotel-${run}`,
  supplierTenant: `it-supplier-${run}`,
  buyer: `it-buyer-${run}`,
  approver: `it-approver-${run}`,
  receiver: `it-receiver-${run}`,
  supplierUser: `it-supplier-user-${run}`,
  admin: `it-admin-${run}`,
};

let supplierId = '';
let productId = '';
let departmentId = '';

let requestSequence = 0;
const request = (url: string, body: unknown, method = 'POST') => new Request(url, {
  method,
  headers: { 'content-type': 'application/json', ...(url.endsWith('/api/v2/rfq') ? { 'x-idempotency-key': `integration-rfq-${run}-${++requestSequence}` } : {}) },
  body: JSON.stringify(body),
});

function asActor(actor: Record<string, unknown>) {
  session.actor = actor;
}

/**
 * This only models the state that the official ETA callback persists after a
 * successful signed submission. It is deliberately direct-to-DB because the
 * integration suite must prove the receiving gate without accepting a browser
 * supplied ETA UUID or signature.
 */
async function persistAcceptedEtaClearance(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { id: true, tenantId: true, hotelId: true, supplierId: true },
  });
  const suffix = randomUUID();
  return prisma.invoice.create({
    data: {
      invoiceNumber: `IT-ETA-${run.slice(0, 12)}-${suffix.slice(0, 8)}`,
      issueDate: new Date(),
      status: 'VALIDATED',
      etaStatus: 'ACCEPTED',
      etaUuid: `eta-test-${suffix}`,
      digitalSignature: `test-callback-signature-${suffix}`,
      orderId: order.id,
      hotelId: order.hotelId,
      supplierId: order.supplierId,
      tenantId: order.tenantId,
    },
  });
}

describe('procurement lifecycle against the isolated database', () => {
  beforeAll(async () => {
    await prisma.tenant.createMany({ data: [
      { id: ids.platformTenant, name: `Platform ${run}`, slug: `it-platform-${run}`, type: 'PLATFORM', status: 'ACTIVE', taxId: `P${run.slice(0, 20)}`, verificationStatus: 'VERIFIED' },
      { id: ids.hotelTenant, name: `Hotel ${run}`, slug: `it-hotel-${run}`, type: 'HOTEL_GROUP', status: 'ACTIVE', taxId: `H${run.slice(0, 20)}`, verificationStatus: 'VERIFIED' },
      { id: ids.supplierTenant, name: `Supplier ${run}`, slug: `it-supplier-${run}`, type: 'SUPPLIER', status: 'ACTIVE', taxId: `S${run.slice(0, 20)}`, verificationStatus: 'VERIFIED' },
    ] });

    const [hotelRole, supplierRole, adminRole] = await Promise.all([
      prisma.role.create({ data: { name: `it-hotel-role-${run}`, tenantId: ids.hotelTenant } }),
      prisma.role.create({ data: { name: `it-supplier-role-${run}`, tenantId: ids.supplierTenant } }),
      prisma.role.create({ data: { name: `it-admin-role-${run}`, tenantId: ids.platformTenant } }),
    ]);

    const permissions = await Promise.all([
      prisma.permission.upsert({ where: { code: 'order:create' }, update: {}, create: { code: 'order:create', name: 'Create procurement requests' } }),
      prisma.permission.upsert({ where: { code: 'order:approve' }, update: {}, create: { code: 'order:approve', name: 'Approve procurement orders' } }),
      prisma.permission.upsert({ where: { code: 'order:confirm' }, update: {}, create: { code: 'order:confirm', name: 'Confirm procurement orders' } }),
      prisma.permission.upsert({ where: { code: 'order:update' }, update: {}, create: { code: 'order:update', name: 'Update procurement orders' } }),
      prisma.permission.upsert({ where: { code: 'quote:submit' }, update: {}, create: { code: 'quote:submit', name: 'Submit supplier quotes' } }),
    ]);
    const byCode = new Map(permissions.map((permission) => [permission.code, permission.id]));
    await prisma.rolePermission.createMany({
      data: [
        { roleId: hotelRole.id, permissionId: byCode.get('order:create')! },
        { roleId: hotelRole.id, permissionId: byCode.get('order:approve')! },
        { roleId: hotelRole.id, permissionId: byCode.get('order:update')! },
        { roleId: supplierRole.id, permissionId: byCode.get('quote:submit')! },
        { roleId: supplierRole.id, permissionId: byCode.get('order:confirm')! },
        { roleId: supplierRole.id, permissionId: byCode.get('order:update')! },
      ],
    });

    const hotel = await prisma.hotel.create({ data: { tenantId: ids.hotelTenant, name: `Hotel ${run}`, taxId: `HT${run.slice(0, 19)}`, city: 'Cairo', governorate: 'Cairo', status: 'ACTIVE', riskTier: 'LOW' } });
    const department = await prisma.department.create({ data: { tenantId: ids.hotelTenant, name: 'Lifecycle procurement', code: `IT-${run.slice(0, 12)}` } });
    departmentId = department.id;
    await prisma.departmentCategoryAccess.create({ data: { departmentId, category: 'GUEST_SUPPLIES' } });
    const supplier = await prisma.supplier.create({ data: { tenantId: ids.supplierTenant, name: `Supplier ${run}`, taxId: `ST${run.slice(0, 19)}`, email: `supplier-${run}@example.test`, website: 'https://supplier.example.test', city: 'Cairo', governorate: 'Cairo', status: 'ACTIVE', isVerified: true } });
    supplierId = supplier.id;
    const product = await prisma.product.create({ data: { tenantId: ids.supplierTenant, supplierId, sku: `IT-${run}`, name: 'Verified lifecycle product', category: 'GUEST_SUPPLIES', status: 'ACTIVE', source: 'MANUAL', sourceProvider: 'SUPPLIER_SUBMISSION', sourceKey: 'https://supplier.example.test/products/lifecycle', images: JSON.stringify([{ url: 'https://supplier.example.test/images/lifecycle.jpg', sourceUrl: 'https://supplier.example.test/products/lifecycle' }]) } });
    productId = product.id;
    await prisma.evidenceRecord.create({ data: { tenantId: ids.supplierTenant, entityId: product.id, entityName: 'PRODUCT', sourceUrl: 'https://supplier.example.test/products/lifecycle', sourceReference: 'integration fixture', provenanceClass: 'AUTHORIZED', status: 'RESOLVED' } });

    await prisma.user.createMany({ data: [
      { id: ids.buyer, email: `buyer-${run}@example.test`, name: 'Lifecycle buyer', role: 'GM', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, departmentId, roleId: hotelRole.id },
      { id: ids.approver, email: `approver-${run}@example.test`, name: 'Lifecycle approver', role: 'GM', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, roleId: hotelRole.id },
      { id: ids.receiver, email: `receiver-${run}@example.test`, name: 'Lifecycle receiver', role: 'RECEIVING_CLERK', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, roleId: hotelRole.id },
      { id: ids.supplierUser, email: `supplier-user-${run}@example.test`, name: 'Lifecycle supplier', role: 'CLERK', platformRole: 'SUPPLIER', tenantId: ids.supplierTenant, supplierId, roleId: supplierRole.id },
      { id: ids.admin, email: `admin-${run}@example.test`, name: 'Lifecycle admin', role: 'OWNER', platformRole: 'ADMIN', tenantId: ids.platformTenant, roleId: adminRole.id },
    ] });

    await prisma.procurementApprovalPolicy.create({ data: { tenantId: ids.hotelTenant, departmentId, primaryApproverId: ids.approver, createdById: ids.approver } });
    await prisma.authorityRule.create({ data: { tenantId: ids.hotelTenant, role: 'GM', name: `Lifecycle approval ${run}`, action: 'APPROVE', minValue: 0, maxValue: 10_000_000, priority: 100, isActive: true } });
  });

  afterAll(async () => {
    // The isolated database is disposable. Removing test tenants would cascade into
    // AuditLog, whose append-only trigger deliberately rejects DELETE operations.
    await prisma.$disconnect();
  });

  it('blocks hotel sourcing until tax verification is complete', async () => {
    const beforeCount = await prisma.rfqRequest.count({ where: { tenantId: ids.hotelTenant } });
    await prisma.tenant.update({ where: { id: ids.hotelTenant }, data: { verificationStatus: 'PENDING' } });

    try {
      asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
      const response = await createRfq(request('https://hotelsvendors.test/api/v2/rfq', { productId, quantity: 1 }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'TAX_ID_VERIFICATION_REQUIRED' });
      await expect(prisma.rfqRequest.count({ where: { tenantId: ids.hotelTenant } })).resolves.toBe(beforeCount);
    } finally {
      await prisma.tenant.update({ where: { id: ids.hotelTenant }, data: { verificationStatus: 'VERIFIED' } });
    }
  });

  it('blocks supplier commercial responses until tax verification is complete', async () => {
    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const rfqResponse = await createRfq(request('https://hotelsvendors.test/api/v2/rfq', { productId, quantity: 2 }));
    expect(rfqResponse.status).toBe(201);
    const { rfq } = await rfqResponse.json() as { rfq: { id: string } };
    await prisma.tenant.update({ where: { id: ids.supplierTenant }, data: { verificationStatus: 'PENDING' } });

    try {
      asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
      const response = await submitQuote(request('https://hotelsvendors.test/api/v2/quotes', { rfqId: rfq.id, unitPrice: 100, quantity: 2, deliveryFee: 10, taxAmount: 14, leadTimeDays: 2 }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'TAX_ID_VERIFICATION_REQUIRED' });
      await expect(prisma.rfqRequest.findUniqueOrThrow({ where: { id: rfq.id }, select: { status: true } })).resolves.toEqual({ status: 'PENDING' });
    } finally {
      await prisma.tenant.update({ where: { id: ids.supplierTenant }, data: { verificationStatus: 'VERIFIED' } });
    }
  });

  it('shows hotels only supplier products with resolved source evidence and owned media', async () => {
    const unresolved = await prisma.product.create({
      data: {
        tenantId: ids.supplierTenant,
        supplierId,
        sku: `UNRESOLVED-${run}`,
        name: 'Unreviewed lifecycle product',
        category: 'GUEST_SUPPLIES',
        status: 'ACTIVE',
        source: 'MANUAL',
        sourceProvider: 'SUPPLIER_SUBMISSION',
        sourceKey: 'https://supplier.example.test/products/unreviewed',
        images: JSON.stringify(['https://supplier.example.test/images/unreviewed.jpg']),
      },
    });
    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });

    const response = await listMarketplace(new Request('https://hotelsvendors.test/api/v2/marketplace'));

    expect(response.status).toBe(200);
    const { products } = await response.json() as { products: Array<{ id: string; images: string[] }> };
    expect(products).toContainEqual(expect.objectContaining({ id: productId, images: [`/api/v2/catalog/products/${productId}/images/0`] }));
    expect(products).not.toContainEqual(expect.objectContaining({ id: unresolved.id }));

    const roleCatalog = await listRoleCatalog();
    const { products: roleProducts } = await roleCatalog.json() as { products: Array<{ id: string }> };
    expect(roleProducts).toContainEqual(expect.objectContaining({ id: productId }));
    expect(roleProducts).not.toContainEqual(expect.objectContaining({ id: unresolved.id }));
  });

  it('moves a supplier-owned product from submission through review into a hotel RFQ', async () => {
    asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
    const submittedResponse = await submitCatalogItem(request('https://hotelsvendors.test/api/v2/catalog', {
      name: 'Reviewed lifecycle towel',
      sku: `REVIEWED-${run}`,
      category: 'GUEST_SUPPLIES',
      unitOfMeasure: 'piece',
      unitPrice: null,
      stockQuantity: 24,
      imageUrl: 'https://supplier.example.test/images/reviewed-towel.jpg',
      imageSourceUrl: 'https://supplier.example.test/products/reviewed-towel',
    }));
    expect(submittedResponse.status).toBe(201);
    const { product } = await submittedResponse.json() as { product: { id: string } };

    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const beforeReview = await listMarketplace(new Request('https://hotelsvendors.test/api/v2/marketplace'));
    expect((await beforeReview.json() as { products: Array<{ id: string }> }).products).not.toContainEqual(expect.objectContaining({ id: product.id }));

    asActor({ id: ids.admin, tenantId: ids.platformTenant, platformRole: 'ADMIN', role: 'OWNER' });
    const reviewResponse = await reviewCatalogItem(request('https://hotelsvendors.test/api/v2/admin/catalog-reviews', {
      productId: product.id,
      decision: 'APPROVE',
      reviewNote: 'Verified supplier-owned towel media and product source page.',
    }, 'PATCH'));
    expect(reviewResponse.status).toBe(200);

    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const afterReview = await listMarketplace(new Request('https://hotelsvendors.test/api/v2/marketplace'));
    const { products } = await afterReview.json() as { products: Array<{ id: string; images: string[] }> };
    expect(products).toContainEqual(expect.objectContaining({ id: product.id, images: [`/api/v2/catalog/products/${product.id}/images/0`] }));

    const rfqResponse = await createRfq(request('https://hotelsvendors.test/api/v2/rfq', { productId: product.id, quantity: 3 }));
    expect(rfqResponse.status).toBe(201);
  });

  it('persists request, quote, order, payment gate, approval, dispatch, and receipt', async () => {
    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const rfqResponse = await createRfq(request('https://hotelsvendors.test/api/v2/rfq', { productId, quantity: 4 }));
    expect(rfqResponse.status).toBe(201);
    const { rfq } = await rfqResponse.json() as { rfq: { id: string } };

    asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
    const quoteResponse = await submitQuote(request('https://hotelsvendors.test/api/v2/quotes', { rfqId: rfq.id, unitPrice: 100, quantity: 4, deliveryFee: 20, taxAmount: 14, leadTimeDays: 2 }));
    expect(quoteResponse.status).toBe(201);
    const { quote } = await quoteResponse.json() as { quote: { id: string } };

    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const orderResponse = await acceptQuote(request('https://hotelsvendors.test/api/v2/quotes/accept', { quoteId: quote.id, exceptionReason: 'Urgent maintenance requirement requires early selection.' }));
    expect(orderResponse.status).toBe(201);
    const { order } = await orderResponse.json() as { order: { id: string } };
    const storedApprovalPolicy = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, select: { departmentId: true, procurementApprovalPolicyId: true, approvalPolicySnapshot: true } });
    expect(storedApprovalPolicy.departmentId).toBe(departmentId);
    expect(storedApprovalPolicy.procurementApprovalPolicyId).not.toBeNull();
    expect(storedApprovalPolicy.approvalPolicySnapshot).toMatchObject({ requiredApproverIds: [ids.approver] });

    asActor({ id: ids.admin, tenantId: ids.platformTenant, platformRole: 'ADMIN', role: 'OWNER' });
    expect((await recordGuarantee(request('https://hotelsvendors.test/api/v2/orders/guarantee', { orderId: order.id, tenantId: ids.hotelTenant, method: 'DIRECT', etaValidated: false }))).status).toBe(201);

    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'APPROVED' }, 'PATCH'))).status).toBe(403);

    asActor({ id: ids.approver, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM' });
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'APPROVED' }, 'PATCH'))).status).toBe(200);

    asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'CONFIRMED' }, 'PATCH'))).status).toBe(200);
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'IN_TRANSIT', estimatedDelivery: new Date(Date.now() + 86_400_000).toISOString() }, 'PATCH'))).status).toBe(200);

    const line = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id }, select: { id: true, productId: true } });
    asActor({ id: ids.receiver, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    const receiptPayload = { orderId: order.id, lines: [{ orderItemId: line.id, productId: line.productId, receivedQuantity: 4, acceptedQuantity: 4, conditionNotes: 'Accepted at receiving dock' }], evidenceUrls: ['https://supplier.example.test/receipts/lifecycle.jpg'] };
    const blockedReceipt = await receiveOrder(request('https://hotelsvendors.test/api/v2/grn', receiptPayload));
    expect(blockedReceipt.status).toBe(409);
    await expect(blockedReceipt.json()).resolves.toEqual({ error: 'ETA_CLEARANCE_REQUIRED_BEFORE_DELIVERY' });

    await persistAcceptedEtaClearance(order.id);
    const receiptResponse = await receiveOrder(request('https://hotelsvendors.test/api/v2/grn', receiptPayload));
    expect(receiptResponse.status).toBe(201);

    const [storedOrder, storedRfq, storedQuote, receipts, auditRecords] = await Promise.all([
      prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } }),
      prisma.rfqRequest.findUniqueOrThrow({ where: { id: rfq.id } }),
      prisma.procurementQuote.findUniqueOrThrow({ where: { id: quote.id } }),
      prisma.goodsReceiptNote.findMany({ where: { orderId: order.id, tenantId: ids.hotelTenant } }),
      prisma.auditLog.findMany({ where: { tenantId: ids.hotelTenant, entityId: order.id } }),
    ]);
    expect(storedRfq.status).toBe('CONVERTED_TO_ORDER');
    expect(storedQuote.status).toBe('ACCEPTED');
    expect(storedOrder.status).toBe('DELIVERED');
    expect(storedOrder.paymentGuaranteed).toBe(true);
    expect(storedOrder.items[0]?.receivedQuantity).toBe(4);
    expect(receipts).toHaveLength(1);
    await expect(prisma.evidenceRecord.findMany({ where: { tenantId: ids.hotelTenant, entityId: receipts[0]!.id, entityName: 'GOODS_RECEIPT_NOTE', sourceUrl: 'https://supplier.example.test/receipts/lifecycle.jpg' } })).resolves.toHaveLength(1);
    await expect(prisma.auditLog.findFirst({ where: { tenantId: ids.hotelTenant, entityId: receipts[0]!.id, entityName: 'GOODS_RECEIPT_NOTE', actionType: 'CREATED' }, select: { changes: true } })).resolves.toMatchObject({ changes: expect.objectContaining({ orderId: order.id, evidenceRecordIds: expect.any(Array) }) });
    expect(auditRecords.length).toBeGreaterThanOrEqual(5);

    const ledger = await prisma.networkTransaction.findUniqueOrThrow({
      where: { orderId: order.id },
      include: { events: { orderBy: { recordedAt: 'asc' } } },
    });
    expect(ledger.rootRfqId).toBe(rfq.id);
    expect(ledger.eventCount).toBe(ledger.events.length);
    expect(ledger.events.length).toBeGreaterThanOrEqual(5);
    expect(ledger.latestEventHash).toBe(ledger.events.at(-1)?.hash);
    expect(ledger.events[0]?.previousHash).toBe('genesis');
    for (let index = 1; index < ledger.events.length; index += 1) {
      expect(ledger.events[index]?.previousHash).toBe(ledger.events[index - 1]?.hash);
    }
    // The disposable CI projection is initialized with Prisma db push because
    // an older SQLite-era migration cannot replay into a blank PostgreSQL
    // service. That projection cannot install SQL-only triggers. The Neon
    // recovery-branch rehearsal keeps this check enabled and proves the real
    // migration-installed append-only control before deployment.
    if (process.env.HV_EXPECT_NETWORK_LEDGER_IMMUTABILITY !== '0') {
      await expect(prisma.networkTransactionEvent.update({
        where: { id: ledger.events[0]!.id },
        data: { hash: 'tampered' },
      })).rejects.toThrow(/append-only/i);
    }
  }, 90_000);

  it('moves an unlisted hotel requirement through Product Intelligence matching before supplier disclosure', async () => {
    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const queuedResponse = await createRfq(request('https://hotelsvendors.test/api/v2/rfq', { itemName: 'Hotel-grade bath towel', unitOfMeasure: 'piece', quantity: 5, deliveryLocation: 'Cairo receiving dock' }));
    expect(queuedResponse.status).toBe(201);
    const { rfq } = await queuedResponse.json() as { rfq: { id: string } };
    const queued = await prisma.rfqRequest.findUniqueOrThrow({ where: { id: rfq.id }, select: { productId: true, supplierId: true, matchingStatus: true } });
    expect(queued).toEqual({ productId: null, supplierId: null, matchingStatus: 'QUEUED' });

    asActor({ id: ids.admin, tenantId: ids.platformTenant, platformRole: 'ADMIN', role: 'OWNER' });
    const matchResponse = await matchRequirement(request('https://hotelsvendors.test/api/v2/rfq/match', { tenantId: ids.hotelTenant, rfqId: rfq.id, productId }));
    expect(matchResponse.status).toBe(200);
    const matched = await prisma.rfqRequest.findUniqueOrThrow({ where: { id: rfq.id }, select: { productId: true, supplierId: true, matchingStatus: true } });
    expect(matched).toEqual({ productId, supplierId: null, matchingStatus: 'MATCHED' });
    await expect(prisma.rfqSupplierAccess.findFirst({ where: { rfqId: rfq.id, supplierId, hotelTenantId: ids.hotelTenant, supplierTenantId: ids.supplierTenant, revokedAt: null } })).resolves.not.toBeNull();

    asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
    const quoteResponse = await submitQuote(request('https://hotelsvendors.test/api/v2/quotes', { rfqId: rfq.id, unitPrice: 110, quantity: 5, deliveryFee: 25, taxAmount: 18, leadTimeDays: 3 }));
    expect(quoteResponse.status).toBe(201);
    const { quote } = await quoteResponse.json() as { quote: { id: string } };

    asActor({ id: ids.buyer, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM', departmentId });
    const orderResponse = await acceptQuote(request('https://hotelsvendors.test/api/v2/quotes/accept', { quoteId: quote.id, exceptionReason: 'Urgent receiving requirement requires early selection.' }));
    expect(orderResponse.status).toBe(201);
    const { order } = await orderResponse.json() as { order: { id: string } };

    asActor({ id: ids.admin, tenantId: ids.platformTenant, platformRole: 'ADMIN', role: 'OWNER' });
    expect((await recordGuarantee(request('https://hotelsvendors.test/api/v2/orders/guarantee', { orderId: order.id, tenantId: ids.hotelTenant, method: 'DIRECT', etaValidated: false }))).status).toBe(201);
    asActor({ id: ids.approver, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'GM' });
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'APPROVED' }, 'PATCH'))).status).toBe(200);
    asActor({ id: ids.supplierUser, tenantId: ids.supplierTenant, platformRole: 'SUPPLIER', role: 'CLERK', supplierId });
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'CONFIRMED' }, 'PATCH'))).status).toBe(200);
    expect((await transitionOrder(request('https://hotelsvendors.test/api/v2/orders', { id: order.id, status: 'IN_TRANSIT', estimatedDelivery: new Date(Date.now() + 86_400_000).toISOString() }, 'PATCH'))).status).toBe(200);
    const line = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id }, select: { id: true, productId: true } });
    asActor({ id: ids.receiver, tenantId: ids.hotelTenant, platformRole: 'HOTEL', role: 'RECEIVING_CLERK' });
    const receiptPayload = { orderId: order.id, lines: [{ orderItemId: line.id, productId: line.productId, receivedQuantity: 5, acceptedQuantity: 5, conditionNotes: 'Matched requirement received' }] };
    const blockedReceipt = await receiveOrder(request('https://hotelsvendors.test/api/v2/grn', receiptPayload));
    expect(blockedReceipt.status).toBe(409);
    await expect(blockedReceipt.json()).resolves.toEqual({ error: 'ETA_CLEARANCE_REQUIRED_BEFORE_DELIVERY' });

    await persistAcceptedEtaClearance(order.id);
    expect((await receiveOrder(request('https://hotelsvendors.test/api/v2/grn', receiptPayload))).status).toBe(201);
    await expect(prisma.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true, paymentGuaranteed: true } })).resolves.toEqual({ status: 'DELIVERED', paymentGuaranteed: true });
  }, 90_000);
});
