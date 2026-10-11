import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  const grants = await prisma.userPermissionGrant.findMany({ where: { tenantId: actor.tenantId }, include: { user: { select: { id: true, email: true, name: true } }, permission: { select: { id: true, code: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ grants });
}

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.userId !== 'string' || typeof body?.permissionCode !== 'string') return NextResponse.json({ error: 'USER_AND_PERMISSION_REQUIRED' }, { status: 400 });
  const [user, permission] = await Promise.all([
    prisma.user.findFirst({ where: { id: body.userId, tenantId: actor.tenantId, deletedAt: null }, select: { id: true } }),
    prisma.permission.findFirst({ where: { code: body.permissionCode, deletedAt: null }, select: { id: true, code: true } }),
  ]);
  if (!user || !permission) return NextResponse.json({ error: 'USER_OR_PERMISSION_NOT_FOUND' }, { status: 404 });
  const grant = await prisma.userPermissionGrant.upsert({ where: { tenantId_userId_permissionId: { tenantId: actor.tenantId, userId: user.id, permissionId: permission.id } }, create: { tenantId: actor.tenantId, userId: user.id, permissionId: permission.id, grantedById: actor.id }, update: { revokedAt: null, grantedById: actor.id } });
  await appendAuditEntry({ entityName: 'USER', entityId: user.id, actionType: 'UPDATED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { delegatedPermission: permission.code, grantId: grant.id } });
  return NextResponse.json({ grant }, { status: 201 });
}

export async function DELETE(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_ROLE_REQUIRED' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.grantId !== 'string') return NextResponse.json({ error: 'GRANT_ID_REQUIRED' }, { status: 400 });
  const grant = await prisma.userPermissionGrant.findFirst({ where: { id: body.grantId, tenantId: actor.tenantId, revokedAt: null } });
  if (!grant) return NextResponse.json({ error: 'GRANT_NOT_FOUND' }, { status: 404 });
  const revoked = await prisma.userPermissionGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date(), revokedById: actor.id } });
  await appendAuditEntry({ entityName: 'USER', entityId: grant.userId, actionType: 'UPDATED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { delegatedPermissionRevoked: grant.permissionId, grantId: grant.id } });
  return NextResponse.json({ grant: revoked });
}
