import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { PermissionDeniedError, requirePermission } from '@/lib/auth/rbac';
import { resolvedProductEvidenceIds } from '@/lib/catalog/resolved-product-evidence';

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (actor.platformRole !== 'ADMIN') return NextResponse.json({ error: 'ADMIN_REQUIRED' }, { status: 403 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'order:approve');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: 'ORDER_APPROVE_PERMISSION_REQUIRED' }, { status: 403 });
    throw error;
  }
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) return NextResponse.json({ error: 'MATCH_PRODUCT_QUERY_REQUIRED' }, { status: 400 });
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', deletedAt: null, source: { not: 'FIXTURE' }, OR: [{ name: { contains: query, mode: 'insensitive' } }, { sku: { contains: query, mode: 'insensitive' } }], supplier: { status: 'ACTIVE', isVerified: true, deletedAt: null } },
    select: { id: true, name: true, sku: true, unitOfMeasure: true, sourceKey: true, supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const eligible = await resolvedProductEvidenceIds(prisma, products);
  return NextResponse.json({ products: products.filter((product) => eligible.has(product.id)).map((product) => ({ id: product.id, name: product.name, sku: product.sku, unitOfMeasure: product.unitOfMeasure, vendorName: product.supplier.name })) });
}
