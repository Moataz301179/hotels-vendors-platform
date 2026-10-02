import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';

export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      select: {
        id: true, uuid: true, type: true, status: true, title: true,
        description: true, evidence: true, potentialImpact: true,
        confidence: true, recommendedAction: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ opportunities }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json({ error: 'SCHEMA_NOT_READY' }, { status: 503 });
    }
    throw error;
  }
}
