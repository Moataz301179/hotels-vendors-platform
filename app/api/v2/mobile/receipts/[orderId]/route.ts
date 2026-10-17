import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { orderActions } from '@/lib/v2-order-actions';

const receivingRoles = ['OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER', 'RECEIVING_CLERK'];

/**
 * HOVIN reads the same protected purchase record as the web workspace.
 * The response intentionally excludes supplier, price, invoice, and source data.
 */
export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'HOTEL' || !receivingRoles.includes(actor.role)) return NextResponse.json({ error: 'RECEIVING_ROLE_REQUIRED' }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:update');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'RECEIPT_PERMISSION_REQUIRED' }, { status: 403 });
    throw error;
  }
  const { orderId } = await context.params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: actor.tenantId, deletedAt: null },
    select: {
      id: true, orderNumber: true, status: true, paymentGuaranteed: true, estimatedDelivery: true, currency: true,
      items: { where: { deletedAt: null }, select: { id: true, quantity: true, receivedQuantity: true, product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  const canRecordReceipt = orderActions(actor, { status: order.status, supplierId: '', tenantId: actor.tenantId, paymentGuaranteed: order.paymentGuaranteed }).includes('RECEIVE');
  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentGuaranteed: order.paymentGuaranteed,
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      currency: order.currency,
      canRecordReceipt,
      items: order.items.map(item => { const receivedQuantity = item.receivedQuantity ?? 0; return { id: item.id, quantity: item.quantity, receivedQuantity, remainingQuantity: Math.max(0, item.quantity - receivedQuantity), product: item.product }; }),
    },
    receiptEndpoint: '/api/v2/grn',
  });
}
