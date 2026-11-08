import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { classifyEtaCompliance } from '@/lib/logistics/eta-compliance';

const paramsSchema = z.object({ orderId: z.string().min(1).max(64) });

/**
 * Order detail — the slide-over drawer's data source.
 * G1: tenant-scoped (supplier scope never widens past the tenant).
 * G2: RBAC re-checked server-side. Read-only.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    await requirePermission(
      { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole },
      'order:read',
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'ORDER_READ_PERMISSION_REQUIRED' }, { status: 403 });
    }
    throw error;
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'ORDER_ID_INVALID' }, { status: 400 });

  const scope =
    user.platformRole === 'SUPPLIER'
      ? { supplierId: user.supplierId || '__unassigned__', tenantId: user.tenantId }
      : { tenantId: user.tenantId };

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, ...scope, deletedAt: null },
    include: {
      supplier: { select: { name: true, city: true, isVerified: true } },
      hotel: { select: { name: true } },
      department: { select: { name: true } },
      items: {
        where: { deletedAt: null },
        include: { product: { select: { name: true, sku: true, unitOfMeasure: true } } },
      },
      approvals: {
        where: { deletedAt: null },
        include: { approver: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      invoices: {
        where: { deletedAt: null },
        select: { id: true, invoiceNumber: true, status: true, etaStatus: true, issueDate: true },
      },
    },
  });
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });

  const receipts = await prisma.goodsReceiptNote.findMany({
    where: { orderId: order.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Keep the private foreign key out of the DTO.
  const { supplierId, ...safeOrder } = order;
  void supplierId;

  return NextResponse.json({
    order: {
      ...safeOrder,
      etaCompliance: classifyEtaCompliance(order),
      receipts: receipts.map((receipt) => ({
        id: receipt.id,
        grnNumber: receipt.grnNumber,
        status: receipt.status,
        receivedAt: receipt.receivedAt,
        inspectedAt: receipt.inspectedAt,
        acceptedAt: receipt.acceptedAt,
      })),
    },
  });
}
