import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requireAnyPermission } from '@/lib/auth/rbac';

const READ_PERMISSIONS = ['order:read', 'product:read', 'report:read', 'user:read'] as const;

/**
 * Tenant hotels — the Connections Center's property picker.
 * G1 tenant-scoped, G2 RBAC-enforced, read-only.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    await requireAnyPermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      [...READ_PERMISSIONS],
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: 'HOTEL_READ_PERMISSION_REQUIRED' }, { status: 403 });
    }
    throw error;
  }

  const hotels = await prisma.hotel.findMany({
    where: { tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, name: true, city: true, status: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ hotels });
}
