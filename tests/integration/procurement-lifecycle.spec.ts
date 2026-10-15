import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

if (process.env.HV_RUN_DB_INTEGRATION !== '1') {
  throw new Error('Refusing to run database integration tests without HV_RUN_DB_INTEGRATION=1.');
}

const session = vi.hoisted(() => ({ actor: null as Record<string, unknown> | null }));

vi.mock('@/lib/v2-auth', () => ({ getActor: vi.fn(() => session.actor) }));

import { prisma } from '@/lib/prisma';
import { POST as createRfq } from '@/app/api/v2/rfq/route';
import { POST as submitQuote } from '@/app/api/v2/quotes/route';
import { POST as acceptQuote } from '@/app/api/v2/quotes/accept/route';
import { POST as recordGuarantee } from '@/app/api/v2/orders/guarantee/route';
import { PATCH as transitionOrder } from '@/app/api/v2/orders/route';
import { POST as receiveOrder } from '@/app/api/v2/grn/route';

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

const request = (url: string, body: unknown, method = 'POST') => new Request(url, {
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

function asActor(actor: Record<string, unknown>) {
  session.actor = actor;
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
    const supplier = await prisma.supplier.create({ data: { tenantId: ids.supplierTenant, name: `Supplier ${run}`, taxId: `ST${run.slice(0, 19)}`, email: `supplier-${run}@example.test`, website: 'https://supplier.example.test', city: 'Cairo', governorate: 'Cairo', status: 'ACTIVE', isVerified: true } });
    supplierId = supplier.id;
    const product = await prisma.product.create({ data: { tenantId: ids.supplierTenant, supplierId, sku: `IT-${run}`, name: 'Verified lifecycle product', category: 'GUEST_SUPPLIES', status: 'ACTIVE', source: 'MANUAL', sourceProvider: 'SUPPLIER_SUBMISSION', sourceKey: 'https://supplier.example.test/products/lifecycle', images: JSON.stringify([{ url: 'https://supplier.example.test/images/lifecycle.jpg', sourceUrl: 'https://supplier.example.test/products/lifecycle' }]) } });
    productId = product.id;

    await prisma.user.createMany({ data: [
      { id: ids.buyer, email: `buyer-${run}@example.test`, name: 'Lifecycle buyer', role: 'GM', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, departmentId, roleId: hotelRole.id },
      { id: ids.approver, email: `approver-${run}@example.test`, name: 'Lifecycle approver', role: 'GM', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, roleId: hotelRole.id },
      { id: ids.receiver, email: `receiver-${run}@example.test`, name: 'Lifecycle receiver', role: 'RECEIVING_CLERK', platformRole: 'HOTEL', tenantId: ids.hotelTenant, hotelId: hotel.id, roleId: hotelRole.id },
      { id: ids.supplierUser, email: `supplier-user-${run}@example.test`, name: 'Lifecycle supplier', role: 'CLERK', platformRole: 'SUPPLIER', tenantId: ids.supplierTenant, supplierId, roleId: supplierRole.id },
      { id: ids.admin, email: `admin-${run}@example.test`, name: 'Lifecycle admin', role: 'OWNER', platformRole: 'ADMIN', tenantId: ids.platformTenant, roleId: adminRole.id },
    ] });

    await prisma.procurementApprovalPolicy.create({ data: { tenantId: ids.hotelTenant, departmentId, primaryApproverId: ids.approver, createdById: ids.admin } });
    await prisma.authorityRule.create({ data: { tenantId: ids.hotelTenant, role: 'GM', name: `Lifecycle approval ${run}`, action: 'APPROVE', minValue: 0, maxValue: 10_000_000, priority: 100, isActive: true } });
  });

  afterAll(async () => {
    await prisma.rfqSupplierAccess.deleteMany({ where: { hotelTenantId: ids.hotelTenant } });
    await prisma.rfqRequest.deleteMany({ where: { tenantId: ids.hotelTenant } });
    await prisma.tenant.deleteMany({ where: { id: { in: [ids.platformTenant, ids.hotelTenant, ids.supplierTenant] } } });
    await prisma.$disconnect();
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
    const orderResponse = await acceptQuote(request('https://hotelsvendors.test/api/v2/quotes/accept', { quoteId: quote.id }));
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
    const receiptResponse = await receiveOrder(request('https://hotelsvendors.test/api/v2/grn', { orderId: order.id, lines: [{ orderItemId: line.id, productId: line.productId, receivedQuantity: 4, acceptedQuantity: 4, conditionNotes: 'Accepted at receiving dock' }] }));
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
    expect(auditRecords.length).toBeGreaterThanOrEqual(5);
  });
});
