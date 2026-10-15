import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { appendAuditEntry } from '@/lib/audit/tamper-proof';
import { isSupplierOwnedProductMedia, productImage } from '@/lib/catalog/owned-product-media';

const decision = z.object({
  productId: z.string().min(1),
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().trim().min(10).max(1000),
});

async function requireAdmin() {
  const actor = await getActor();
  return actor?.platformRole === 'ADMIN' ? actor : null;
}

export async function GET() {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });

  const products = await prisma.product.findMany({
    where: { source: 'MANUAL', sourceProvider: 'SUPPLIER_SUBMISSION', status: 'INACTIVE', deletedAt: null },
    select: { id: true, tenantId: true, name: true, sku: true, images: true, sourceKey: true, createdAt: true, supplier: { select: { id: true, name: true, website: true, isVerified: true, status: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  const evidenceByProduct = new Map((await prisma.evidenceRecord.findMany({
    where: { entityName: 'PRODUCT', entityId: { in: products.map(product => product.id) }, status: 'PENDING', deletedAt: null },
    select: { id: true, entityId: true, sourceUrl: true, createdAt: true },
  })).map(evidence => [evidence.entityId, evidence]));
  return NextResponse.json({ reviews: products.map(product => ({ ...product, evidence: evidenceByProduct.get(product.id) ?? null })) });
}

export async function PATCH(request: Request) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });
  const parsed = decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'PRODUCT_ID_DECISION_AND_REVIEW_NOTE_REQUIRED' }, { status: 400 });
  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, source: 'MANUAL', sourceProvider: 'SUPPLIER_SUBMISSION', status: 'INACTIVE', deletedAt: null },
    select: { id: true, tenantId: true, status: true, sourceKey: true, images: true, supplier: { select: { isVerified: true, status: true, website: true } } },
  });
  if (!product) return NextResponse.json({ error: 'PENDING_CATALOG_ITEM_NOT_FOUND' }, { status: 404 });
  if (!product.supplier.isVerified || product.supplier.status !== 'ACTIVE') return NextResponse.json({ error: 'SUPPLIER_NOT_ELIGIBLE_FOR_PUBLICATION' }, { status: 409 });
  const evidence = await prisma.evidenceRecord.findFirst({ where: { entityId: product.id, entityName: 'PRODUCT', status: 'PENDING', deletedAt: null }, select: { id: true, sourceUrl: true } });
  const imageUrl = productImage(product.images);
  if (!evidence || !product.sourceKey || evidence.sourceUrl !== product.sourceKey || !imageUrl || !isSupplierOwnedProductMedia(imageUrl, product.sourceKey, product.supplier.website)) return NextResponse.json({ error: 'PRODUCT_EVIDENCE_NOT_REVIEWABLE' }, { status: 409 });

  const status = parsed.data.decision === 'APPROVE' ? 'ACTIVE' : 'INACTIVE';
  const evidenceStatus = parsed.data.decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED';
  const updated = await prisma.$transaction(async tx => {
    const published = await tx.product.update({ where: { id: product.id }, data: { status } });
    await tx.evidenceRecord.update({ where: { id: evidence.id }, data: { status: evidenceStatus } });
    await appendAuditEntry({
      entityName: 'PRODUCT', entityId: product.id, actionType: 'STATUS_CHANGED', tenantId: product.tenantId,
      actorId: actor.id, actorRole: actor.platformRole,
      changes: { from: product.status, to: status, reviewDecision: parsed.data.decision, reviewNote: parsed.data.reviewNote, evidenceId: evidence.id, sourceUrl: evidence.sourceUrl },
    }, tx);
    return published;
  });
  return NextResponse.json({ product: updated, reviewStatus: evidenceStatus });
}
