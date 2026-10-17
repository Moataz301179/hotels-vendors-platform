import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';

const sourceDecision = z.object({
  sourceId: z.string().min(1),
  permissionStatus: z.enum(['PERMISSION_UNKNOWN', 'PERMITTED', 'RESTRICTED']),
  permissionNote: z.string().trim().min(10).max(1000),
});

async function directoryAdmin() {
  const actor = await getActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) };
  if (actor.platformRole !== 'ADMIN') return { actor: null, response: NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 }) };
  return { actor, response: null };
}

/** Internal source registry; buyer-facing APIs never use this endpoint or these fields. */
export async function GET() {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const sources = await prisma.directorySource.findMany({
    where: { deletedAt: null },
    select: { id: true, sourceUrl: true, sourceType: true, permissionStatus: true, permissionNote: true, observedAt: true, lastSuccessAt: true, refreshStatus: true, _count: { select: { candidates: true } } },
    orderBy: { updatedAt: 'desc' }, take: 100,
  });
  return NextResponse.json({ sources, metrics: {
    totalSources: sources.length,
    permittedSources: sources.filter(source => source.permissionStatus === 'PERMITTED').length,
    pendingPermissionSources: sources.filter(source => source.permissionStatus === 'PERMISSION_UNKNOWN').length,
    restrictedSources: sources.filter(source => source.permissionStatus === 'RESTRICTED').length,
    candidateRecords: sources.reduce((total, source) => total + source._count.candidates, 0),
  } });
}

export async function PATCH(request: Request) {
  const { actor, response } = await directoryAdmin();
  if (!actor) return response!;
  const parsed = sourceDecision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'SOURCE_PERMISSION_DECISION_AND_NOTE_REQUIRED' }, { status: 400 });
  try {
    const source = await prisma.$transaction(async (tx) => {
      const updated = await tx.directorySource.update({ where: { id: parsed.data.sourceId }, data: { permissionStatus: parsed.data.permissionStatus, permissionNote: parsed.data.permissionNote }, select: { id: true, permissionStatus: true, permissionNote: true } });
      await appendAuditEntry({ entityName: 'DIRECTORY_SOURCE', entityId: updated.id, actionType: 'STATUS_CHANGED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { permissionStatus: updated.permissionStatus, permissionNote: updated.permissionNote } }, tx);
      return updated;
    });
    return NextResponse.json({ source });
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: 'DIRECTORY_SOURCE_NOT_FOUND' }, { status: 404 });
    throw error;
  }
}
