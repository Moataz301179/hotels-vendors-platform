import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';

export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
      select: { overallStatus: true, completedAt: true, updatedAt: true },
    });
    const complete = Boolean(progress?.overallStatus === 'COMPLETED' && progress.completedAt);
    return NextResponse.json({
      complete,
      status: progress?.overallStatus ?? 'NOT_STARTED',
      completedAt: progress?.completedAt ?? null,
      workflowImplemented: false,
      platformRole: user.platformRole,
      tenantId: user.tenantId,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json({ error: 'SCHEMA_NOT_READY' }, { status: 503 });
    }
    throw error;
  }
}
