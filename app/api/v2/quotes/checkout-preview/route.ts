import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { costBreakdown } from '@/lib/procurement/pre-spend';
import { checkoutPreviewTotals } from '@/lib/procurement/checkout-preview';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { FinancialAccessDeniedError, requireFinancialAccess } from '@/lib/auth/financial-access';

const payload = z.object({ quoteId: z.string().min(1), acceptCommercialTerms: z.literal(true), exceptionReason: z.string().trim().min(10).max(500).optional() });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (!['HOTEL', 'ADMIN'].includes(actor.platformRole)) return NextResponse.json({ error: 'HOTEL_ROLE_REQUIRED' }, { status: 403 });
  try { await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:create'); }
  catch (error) { if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'ORDER_CREATE_PERMISSION_REQUIRED' }, { status: 403 }); throw error; }
  try { await requireFinancialAccess(actor); }
  catch (error) { if (error instanceof FinancialAccessDeniedError) return NextResponse.json({ error: error.code }, { status: 403 }); throw error; }
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'quoteId and commercial terms acceptance are required' }, { status: 400 });
  const quote = await prisma.procurementQuote.findFirst({
    where: { id: parsed.data.quoteId, tenantId: actor.tenantId, deletedAt: null, status: 'SUBMITTED', supplier: { isVerified: true, status: 'ACTIVE', deletedAt: null } },
    include: { rfq: { select: { id: true, status: true, responseDeadline: true, deletedAt: true } }, supplier: { select: { name: true, legalName: true, city: true, governorate: true } } },
  });
  if (!quote || quote.rfq.deletedAt || !['PENDING', 'QUOTED'].includes(quote.rfq.status)) return NextResponse.json({ error: 'An available verified quote was not found' }, { status: 404 });
  if (quote.rfq.responseDeadline && quote.rfq.responseDeadline > new Date() && !parsed.data.exceptionReason) return NextResponse.json({ error: 'RFQ_RESPONSE_WINDOW_OPEN', message: 'Wait for the sealed response deadline or record a procurement exception reason.' }, { status: 409 });
  if (quote.validUntil && quote.validUntil < new Date()) return NextResponse.json({ error: 'QUOTE_EXPIRED' }, { status: 409 });
  const costs = costBreakdown(quote);
  const settings = await prisma.platformSettings.findFirst({ select: { platformFeeRate: true, minOrderFee: true, maxOrderFee: true }, orderBy: { updatedAt: 'desc' } });
  const totals = checkoutPreviewTotals(costs, { platformFeeRate: Number(settings?.platformFeeRate ?? 0), minOrderFee: Number(settings?.minOrderFee ?? 0), maxOrderFee: Number(settings?.maxOrderFee ?? 0) });
  if (!totals) return NextResponse.json({ error: 'QUOTE_TOTALS_INCOMPLETE' }, { status: 409 });
  await appendAuditEntry({ entityName: 'PROCUREMENT_QUOTE', entityId: quote.id, actionType: 'UPDATED', tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { action: 'CHECKOUT_PREVIEW_DISCLOSURE', rfqId: quote.rfq.id, exceptionReason: parsed.data.exceptionReason ?? null, biddingFee: totals.biddingFee, biddingFeeRate: totals.biddingFeeRate } });
  return NextResponse.json({
    quoteId: quote.id,
    vendor: { name: quote.supplier.legalName || quote.supplier.name, city: quote.supplier.city, governorate: quote.supplier.governorate },
    totals,
    financing: { status: 'SUBJECT_TO_FUNDER_ELIGIBILITY', note: 'Invoice factoring is assessed by the selected licensed funder after order and invoice submission.' },
    next: 'Confirm this fee-inclusive checkout to create the controlled order.',
  });
}
