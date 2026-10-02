import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const transitions: Record<string, string[]> = {
  DETECTED: ['REVIEWING', 'CLOSED'],
  REVIEWING: ['RESEARCHING', 'ACTION_READY', 'CLOSED'],
  RESEARCHING: ['ACTION_READY', 'CLOSED'],
  ACTION_READY: ['RFQ_SENT', 'APPROVED', 'CLOSED'],
  RFQ_SENT: ['APPROVED', 'EXECUTING', 'CLOSED'],
  APPROVED: ['EXECUTING', 'CLOSED'],
  EXECUTING: ['RESULT_PENDING', 'CLOSED'],
  RESULT_PENDING: ['VERIFIED', 'CLOSED'],
  VERIFIED: ['CLOSED'],
  CLOSED: [],
};

const bodySchema = z.object({
  status: z.enum([
    'DETECTED', 'REVIEWING', 'RESEARCHING', 'ACTION_READY', 'RFQ_SENT',
    'APPROVED', 'EXECUTING', 'RESULT_PENDING', 'VERIFIED', 'CLOSED',
  ]),
  reason: z.string().trim().max(2000).optional(),
  realizedAmount: z.number().finite().nonnegative().optional(),
  outcome: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_REQUEST', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      select: {
        id: true,
        status: true,
        tenantId: true,
        baseline: true,
        potentialImpact: true,
        resultingTransactionId: true,
      },
    });
    if (!opportunity) return NextResponse.json({ error: 'OPPORTUNITY_NOT_FOUND' }, { status: 404 });

    const allowed = transitions[opportunity.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json({
        error: 'INVALID_TRANSITION',
        from: opportunity.status,
        to: parsed.data.status,
        allowed,
      }, { status: 409 });
    }

    if (parsed.data.status === 'VERIFIED' && parsed.data.realizedAmount === undefined) {
      return NextResponse.json({ error: 'REALIZED_AMOUNT_REQUIRED' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: opportunity.id },
        data: {
          status: parsed.data.status,
          realizedResult: parsed.data.outcome ? parsed.data.outcome as Prisma.InputJsonValue : undefined,
          verificationState: parsed.data.status === 'VERIFIED' ? 'VERIFIED' : parsed.data.status,
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          entityId: opportunity.id,
          actorId: user.id,
          actorRole: user.platformRole,
          tenantId: user.tenantId,
          actionType: 'UPDATE',
          changes: {
            entity: 'OPPORTUNITY',
            from: opportunity.status,
            to: parsed.data.status,
            reason: parsed.data.reason ?? null,
            realizedAmount: parsed.data.realizedAmount ?? null,
          },
        },
      });

      if (parsed.data.status === 'VERIFIED') {
        await tx.savingsLedger.create({
          data: {
            tenantId: user.tenantId,
            opportunityId: opportunity.id,
            type: 'VERIFIED',
            status: 'VERIFIED',
            baseline: opportunity.baseline,
            potentialSaving: opportunity.potentialImpact,
            realizedAmount: parsed.data.realizedAmount,
            verifiedAmount: parsed.data.realizedAmount,
            transactionId: opportunity.resultingTransactionId,
            ownerId: user.id,
            verifiedById: user.id,
            verifiedAt: new Date(),
            evidence: parsed.data.outcome ? parsed.data.outcome as Prisma.InputJsonValue : undefined,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ opportunity: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json({ error: 'SCHEMA_NOT_READY' }, { status: 503 });
    }
    throw error;
  }
}
