import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';

async function admin() {
  const actor = await getActor();
  return actor?.platformRole === 'ADMIN' ? actor : null;
}

export async function GET() {
  const actor = await admin();
  if (!actor) return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });
  // Registrations create their own organization tenant. Platform review must
  // see those applications; tenant scoping here would make approval impossible.
  const users = await prisma.user.findMany({ where: { status: 'PENDING_VERIFICATION', deletedAt: null }, select: { id: true, email: true, name: true, platformRole: true, supplierId: true, hotelId: true, createdAt: true }, orderBy: { createdAt: 'asc' }, take: 100 });
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const actor = await admin();
  if (!actor) return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });
  const parsed = z.object({ userId: z.string().min(1), decision: z.enum(['APPROVE', 'REJECT']), taxVerification: z.enum(['VERIFY', 'REJECT', 'PENDING']).optional(), reviewNote: z.string().trim().min(10).max(1000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'userId, decision and a review note of at least 10 characters are required' }, { status: 400 });
  const target = await prisma.user.findFirst({ where: { id: parsed.data.userId, status: 'PENDING_VERIFICATION', deletedAt: null }, select: { id: true, tenantId: true, status: true, platformRole: true } });
  if (!target) return NextResponse.json({ error: 'Pending user not found in your organization' }, { status: 404 });
  const taxDecision = parsed.data.taxVerification ?? 'PENDING';
  const tenant = await prisma.tenant.findFirst({ where: { id: target.tenantId, deletedAt: null }, select: { id: true, taxId: true } });
  if (taxDecision === 'VERIFY' && !tenant?.taxId) return NextResponse.json({ error: 'A tax ID is required before financial access can be verified' }, { status: 409 });
  const status = parsed.data.decision === 'APPROVE' ? 'ACTIVE' : 'SUSPENDED';
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: target.id }, data: { status } });
    if (taxDecision !== 'PENDING') await tx.tenant.update({ where: { id: target.tenantId }, data: taxDecision === 'VERIFY' ? { verificationStatus: 'VERIFIED', verifiedAt: new Date(), verifiedBy: actor.id } : { verificationStatus: 'REJECTED', verifiedAt: null, verifiedBy: actor.id } });
    await appendAuditEntry({ entityName: 'USER', entityId: target.id, actionType: 'STATUS_CHANGED', tenantId: target.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { reason: 'VERIFICATION_DECISION', from: target.status, to: status, platformRole: target.platformRole, taxVerification: taxDecision, reviewNote: parsed.data.reviewNote } }, tx);
  });
  return NextResponse.json({ updated: true, status, taxVerification: taxDecision });
}
