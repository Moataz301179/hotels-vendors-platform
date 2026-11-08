import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requireAnyPermission } from '@/lib/auth/rbac';

/**
 * Dashboard trends — the sparkline series behind the KPI cards.
 * Six monthly buckets, tenant-scoped, RBAC-enforced, read-only.
 */
export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    await requireAnyPermission(
      { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole },
      ['order:read'],
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'TRENDS_PERMISSION_REQUIRED' }, { status: 403 });
    }
    throw error;
  }

  const since = new Date();  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const scope =
    user.platformRole === 'SUPPLIER'
      ? { supplierId: user.supplierId || '__unassigned__', tenantId: user.tenantId }
      : { tenantId: user.tenantId };

  const [orders, rfqs] = await Promise.all([
    prisma.order.findMany({
      where: { ...scope, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.rfqRequest.findMany({
      where: { ...scope, deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const months: { key: string; label: string }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const month = new Date();
    month.setMonth(month.getMonth() - offset);
    month.setDate(1);
    months.push({
      key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
      label: month.toLocaleString('en', { month: 'short' }),
    });
  }

  const bucket = (rows: { createdAt: Date }[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const createdAt = new Date(row.createdAt);
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return months.map((month) => ({ month: month.label, count: counts.get(month.key) ?? 0 }));
  };

  return NextResponse.json({ orders: bucket(orders), rfqs: bucket(rfqs) });
}
