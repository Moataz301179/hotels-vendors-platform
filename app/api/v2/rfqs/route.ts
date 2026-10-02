import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActor } from '@/lib/v2-auth';
import { z } from 'zod';

const rfqSchema = z.object({
  productId: z.string().min(1),
  requestedQty: z.number().int().positive().max(100000),
  targetPrice: z.number().positive().finite().optional(),
  deliveryTimeline: z.string().trim().max(200).optional(),
  specialReq: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  try {
    const rfqs = await prisma.rfqRequest.findMany({
      where: { tenantId: user.tenantId, buyerId: user.id, deletedAt: null },
      select: {
        id: true, productId: true, supplierId: true, requestedQty: true,
        targetPrice: true, status: true, deliveryTimeline: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ rfqs }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
      (error.code === 'P2021' || error.code === 'P2022')) {
      return NextResponse.json({ error: 'SCHEMA_NOT_READY' }, { status: 503 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const user = await getActor();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  if (user.platformRole !== 'HOTEL') {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Only hotel users can create procurement RFQs.' }, { status: 403 });
  }

  const parsed = rfqSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_REQUEST', details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.productId,
      status: 'ACTIVE',
      deletedAt: null,
      supplier: { status: 'ACTIVE', isVerified: true, deletedAt: null },
    },
    select: { id: true, name: true, supplierId: true, tenantId: true },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_AVAILABLE' }, { status: 404 });

  const rfq = await prisma.rfqRequest.create({
    data: {
      buyerId: user.id,
      productId: product.id,
      supplierId: product.supplierId,
      requestedQty: parsed.data.requestedQty,
      targetPrice: parsed.data.targetPrice,
      deliveryTimeline: parsed.data.deliveryTimeline,
      specialReq: parsed.data.specialReq,
      notes: parsed.data.notes,
      tenantId: user.tenantId,
      status: 'PENDING',
    },
  });

  await prisma.auditLog.create({
    data: {
      entityId: rfq.id,
      actorId: user.id,
      actorRole: user.platformRole,
      tenantId: user.tenantId,
      actionType: 'CREATE',
      changes: {
        entity: 'RFQ_REQUEST',
        productId: product.id,
        supplierId: product.supplierId,
        requestedQty: parsed.data.requestedQty,
      },
    },
  });

  return NextResponse.json({ rfq }, { status: 201 });
}
