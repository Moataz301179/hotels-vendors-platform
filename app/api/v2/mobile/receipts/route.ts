import { NextResponse } from 'next/server';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { orderActions } from '@/lib/v2-order-actions';

const receivingRoles = ['OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER', 'RECEIVING_CLERK'];

/**
 * Lists only the authenticated hotel's receivable handoffs.  This is deliberately
 * not a delivery feed: supplier, commercial, invoice and source fields never
 * cross the mobile boundary.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'HOTEL' || !receivingRoles.includes(actor.role)) {
    return NextResponse.json({ error: 'RECEIVING_ROLE_REQUIRED' }, { status: 403 });
  }

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:update');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'RECEIPT_PERMISSION_REQUIRED' }, { status: 403 });
    throw error;
  }

  const orders = await prisma.order.findMany({
    where: {
      tenantId: actor.tenantId,
      deletedAt: null,
      status: { in: ['IN_TRANSIT', 'PARTIALLY_DELIVERED'] },
      paymentGuaranteed: true,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      estimatedDelivery: true,
      items: { where: { deletedAt: null }, select: { quantity: true, receivedQuantity: true } },
    },
    orderBy: [{ estimatedDelivery: 'asc' }, { createdAt: 'asc' }],
    take: 50,
  });

  return NextResponse.json({
    handoffs: orders
      .filter((order) => orderActions(actor, { status: order.status, supplierId: '', tenantId: actor.tenantId, paymentGuaranteed: true }).includes('RECEIVE'))
      .map((order) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
        lineCount: order.items.length,
        remainingQuantity: order.items.reduce((total, item) => total + Math.max(0, item.quantity - (item.receivedQuantity ?? 0)), 0),
        receiptContextPath: `/api/v2/mobile/receipts/${order.id}`,
      })),
  });
}
