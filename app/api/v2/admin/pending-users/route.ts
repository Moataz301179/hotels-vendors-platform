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
  const users = await prisma.user.findMany({ where: { tenantId: actor.tenantId, status: 'PENDING_VERIFICATION', deletedAt: null }, select: { id: true, email: true, name: true, platformRole: true, supplierId: true, hotelId: true, createdAt: true }, orderBy: { createdAt: 'asc' }, take: 100 });
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const actor = await admin();
  if (!actor) return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });
  const parsed = z.object({ userId: z.string().min(1), decision: z.enum(['APPROVE', 'REJECT']), reviewNote: z.string().trim().min(10).max(1000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'userId, decision and a review note of at least 10 characters are required' }, { status: 400 });
  const target = await prisma.user.findFirst({ where: { id: parsed.data.userId, tenantId: actor.tenantId, status: 'PENDING_VERIFICATION', deletedAt: null }, select: { id: true, status: true, platformRole: true } });
  if (!target) return NextResponse.json({ error: 'Pending user not found in your organization' }, { status: 404 });
  const status = parsed.data.decision === 'APPROVE' ? 'ACTIVE' : 'SUSPENDED';
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: target.id }, data: { status } });
    await appendAuditEntry({ entityName: 'USER', entityId: target.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { reason: 'VERIFICATION_DECISION', from: target.status, to: status, platformRole: target.platformRole, reviewNote: parsed.data.reviewNote } }, tx);
  });
  return NextResponse.json({ updated: true, status });
}
