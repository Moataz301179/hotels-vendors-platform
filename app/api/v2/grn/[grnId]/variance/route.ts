import { NextResponse } from 'next/server';
import { getActor } from '@/lib/v2-auth';
import { prisma } from '@/lib/prisma';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';

const hotelApproverRoles = ['OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER'];

/**
 * HOVIN/receiving records the observed quantity.  A difference is not funding
 * approval: a hotel approver must explicitly accept it before an external
 * funder may review the packet.
 */
export async function POST(request: Request, context: { params: Promise<{ grnId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'HOTEL' || !hotelApproverRoles.includes(actor.role)) return NextResponse.json({ error: 'HOTEL_APPROVER_REQUIRED' }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:approve');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'RECEIPT_VARIANCE_APPROVAL_PERMISSION_REQUIRED' }, { status: 403 });
    throw error;
  }
  const body = await request.json().catch(() => null);
  if (body?.accept !== true) return NextResponse.json({ error: 'EXPLICIT_VARIANCE_ACCEPTANCE_REQUIRED' }, { status: 400 });
  const { grnId } = await context.params;
  const receipt = await prisma.goodsReceiptNote.findFirst({
    where: { id: grnId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, tenantId: true, quantityVarianceAcceptedAt: true, lineItems: { select: { receivedQuantity: true, acceptedQuantity: true } } },
  });
  if (!receipt) return NextResponse.json({ error: 'GOODS_RECEIPT_NOT_FOUND' }, { status: 404 });
  if (receipt.quantityVarianceAcceptedAt) return NextResponse.json({ accepted: true, alreadyAccepted: true });
  if (!receipt.lineItems.some(line => line.receivedQuantity !== line.acceptedQuantity)) return NextResponse.json({ error: 'NO_RECEIPT_VARIANCE' }, { status: 409 });
  const acceptedAt = new Date();
  const updated = await prisma.goodsReceiptNote.update({
    where: { id: receipt.id },
    data: { quantityVarianceAcceptedAt: acceptedAt, quantityVarianceAcceptedById: actor.id },
    select: { id: true, quantityVarianceAcceptedAt: true },
  });
  await appendAuditEntry({
    entityName: 'GOODS_RECEIPT_NOTE', entityId: receipt.id, actionType: 'UPDATE', tenantId: receipt.tenantId,
    actorId: actor.id, actorRole: actor.platformRole,
    changes: { quantityVarianceAccepted: true, acceptedAt: updated.quantityVarianceAcceptedAt?.toISOString() },
  });
  return NextResponse.json({ accepted: true, acceptedAt: updated.quantityVarianceAcceptedAt });
}
