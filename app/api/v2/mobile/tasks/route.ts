import { NextResponse } from 'next/server';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { planMobileWorkspace } from '@/lib/mobile/field-layer';
import { orderActions } from '@/lib/v2-order-actions';

export type FieldTask = {
  id: string;
  module: 'arrivals' | 'exceptions' | 'assignments' | 'movements' | 'fulfillment';
  title: string;
  detail: string;
  status: string;
  action: 'receive' | 'review' | 'respond' | 'none';
  targetId: string;
};

/**
 * Field work for the signed-in account. Hotel tasks omit supplier, price,
 * invoice, and source. Carrier tasks omit rates. Supplier tasks omit prices
 * and every other supplier.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const plan = planMobileWorkspace({ platformRole: actor.platformRole, role: actor.role });
  if (plan.workspace === 'web-only') return NextResponse.json({ error: 'MOBILE_DESK_REQUIRED' }, { status: 403 });

  if (plan.workspace === 'hotel-field') {
    try {
      await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:update');
    } catch (error) {
      if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'RECEIPT_PERMISSION_REQUIRED' }, { status: 403 });
      throw error;
    }
    return NextResponse.json({ workspace: plan.workspace, tasks: await hotelTasks(actor) });
  }
  if (plan.workspace === 'carrier-field') {
    return NextResponse.json({ workspace: plan.workspace, tasks: await carrierTasks(actor.tenantId) });
  }
  return NextResponse.json({ workspace: plan.workspace, tasks: await supplierTasks(actor.supplierId) });
}

async function hotelTasks(actor: { id: string; tenantId: string; platformRole: string; role: string }): Promise<FieldTask[]> {
  const [arrivals, disputes] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: { in: ['IN_TRANSIT', 'PARTIALLY_DELIVERED'] }, paymentGuaranteed: true },
      select: { id: true, orderNumber: true, status: true, items: { where: { deletedAt: null }, select: { quantity: true, receivedQuantity: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
    prisma.order.findMany({
      where: { tenantId: actor.tenantId, deletedAt: null, status: 'DISPUTED' },
      select: { id: true, orderNumber: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const arrivalTasks: FieldTask[] = arrivals
    .filter((order) => orderActions(actor, { status: order.status, supplierId: '', tenantId: actor.tenantId, paymentGuaranteed: true }).includes('RECEIVE'))
    .map((order) => {
      const remaining = order.items.reduce((total, item) => total + Math.max(0, item.quantity - (item.receivedQuantity ?? 0)), 0);
      return {
        id: `arrival:${order.id}`,
        module: 'arrivals',
        title: order.orderNumber,
        detail: `${order.items.length} lines · ${remaining} remaining`,
        status: order.status,
        action: 'receive',
        targetId: order.id,
      };
    });

  const exceptionTasks: FieldTask[] = disputes.map((order) => ({
    id: `exception:${order.id}`,
    module: 'exceptions',
    title: order.orderNumber,
    detail: 'Disputed. The phone shows the exception and the desk closes it.',
    status: order.status,
    action: 'review',
    targetId: order.id,
  }));

  return [...arrivalTasks, ...exceptionTasks];
}

async function carrierTasks(tenantId: string): Promise<FieldTask[]> {
  const assignments = await prisma.carrierOrderAssignment.findMany({
    where: { carrierTenantId: tenantId, deletedAt: null, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
    select: {
      id: true,
      status: true,
      order: { select: { orderNumber: true } },
      shipments: {
        where: { deletedAt: null },
        select: { id: true, status: true, originHub: true, destinationHub: true },
        take: 1,
      },
    },
    orderBy: { assignedAt: 'desc' },
    take: 50,
  });

  const tasks: FieldTask[] = [];
  for (const assignment of assignments) {
    tasks.push({
      id: `assignment:${assignment.id}`,
      module: 'assignments',
      title: assignment.order.orderNumber,
      detail: assignment.status === 'ASSIGNED' ? 'Waiting for this carrier to accept or decline.' : 'Accepted. Plan the movement on the carrier desk.',
      status: assignment.status,
      action: assignment.status === 'ASSIGNED' ? 'respond' : 'none',
      targetId: assignment.id,
    });
    const shipment = assignment.shipments[0];
    if (shipment) {
      tasks.push({
        id: `movement:${shipment.id}`,
        module: 'movements',
        title: `${shipment.originHub} → ${shipment.destinationHub}`,
        detail: 'Checkpoint only. Delivery proof is recorded on the carrier desk.',
        status: shipment.status,
        action: 'none',
        targetId: shipment.id,
      });
    }
  }
  return tasks;
}

async function supplierTasks(supplierId: string | null): Promise<FieldTask[]> {
  if (!supplierId) return [];
  const orders = await prisma.order.findMany({
    where: { supplierId, deletedAt: null, status: { in: ['APPROVED', 'CONFIRMED', 'IN_TRANSIT', 'PARTIALLY_DELIVERED'] } },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      items: { where: { deletedAt: null }, select: { quantity: true, product: { select: { name: true, unitOfMeasure: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return orders.map((order) => {
    const names = order.items.slice(0, 3).map((item) => `${item.product.name} × ${item.quantity}${item.product.unitOfMeasure ? ` ${item.product.unitOfMeasure}` : ''}`);
    const extra = order.items.length > 3 ? ` · +${order.items.length - 3} more` : '';
    return {
      id: `fulfillment:${order.id}`,
      module: 'fulfillment' as const,
      title: order.orderNumber,
      detail: `${names.join(', ') || 'No lines'}${extra}`,
      status: order.status,
      action: 'none' as const,
      targetId: order.id,
    };
  });
}
