import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requireAnyPermission } from '@/lib/auth/rbac';

/**
 * "Needs Your Action" queue — the dashboard's decision surface.
 * Every item carries a reason and a route, so a number always leads somewhere.
 * Read-only, tenant-scoped, RBAC-enforced (G1/G2).
 */

const READ_PERMISSIONS = ['order:read', 'product:read', 'invoice:read', 'shipping:read', 'report:read'] as const;

export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    await requireAnyPermission(
      { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole },
      [...READ_PERMISSIONS],
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'ACTION_QUEUE_PERMISSION_REQUIRED' }, { status: 403 });
    }
    throw error;
  }

  // G1: supplier identities are never a substitute for tenant scope.
  const scope = user.platformRole === 'SUPPLIER'
    ? { supplierId: user.supplierId || '__unassigned__', tenantId: user.tenantId }
    : { tenantId: user.tenantId };

  const now = new Date();
  const items: {
    id: string;
    kind: 'rfq' | 'order';
    title: string;
    reason: string;
    href: string;
    urgent: boolean;
  }[] = [];

  const rfqs = await prisma.rfqRequest.findMany({
    where: { ...scope, deletedAt: null, status: { in: ['PENDING', 'QUOTED'] } },
    select: { id: true, itemName: true, status: true, requestedQty: true, responseDeadline: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  for (const rfq of rfqs) {
    const windowClosed = rfq.responseDeadline ? new Date(rfq.responseDeadline) <= now : false;
    items.push({
      id: `rfq:${rfq.id}`,
      kind: 'rfq',
      title: rfq.itemName ?? 'Sourcing request',
      reason:
        rfq.status === 'QUOTED'
          ? windowClosed
            ? 'Response window closed — decide now'
            : 'Responses ready to compare'
          : 'Awaiting supplier responses',
      href: '/workspace/marketplace',
      urgent: windowClosed,
    });
  }

  const orders = await prisma.order.findMany({
    where: {
      ...scope,
      deletedAt: null,
      status: { in: ['PENDING_APPROVAL', 'CONFIRMED', 'IN_TRANSIT', 'PARTIALLY_DELIVERED', 'DISPUTED'] },
    },
    select: { id: true, orderNumber: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const orderReasons: Record<string, { reason: string; href: string }> = {
    PENDING_APPROVAL: { reason: 'Awaiting an accountable approval', href: '/orders?view=approval' },
    CONFIRMED: { reason: 'Confirmed — awaiting fulfilment', href: '/orders?view=receiving' },
    IN_TRANSIT: { reason: 'In transit — prepare to receive', href: '/orders?view=receiving' },
    PARTIALLY_DELIVERED: { reason: 'Partially delivered — confirm receipt', href: '/orders?view=receiving' },
    DISPUTED: { reason: 'Disputed — resolution required', href: '/orders' },
  };
  for (const order of orders) {
    const entry = orderReasons[order.status];
    if (!entry) continue;
    items.push({
      id: `order:${order.id}`,
      kind: 'order',
      title: order.orderNumber,
      reason: entry.reason,
      href: entry.href,
      urgent: order.status === 'DISPUTED',
    });
  }

  return NextResponse.json({ items: items.slice(0, 12) });
}
