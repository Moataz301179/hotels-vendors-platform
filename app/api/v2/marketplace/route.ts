import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      supplier: { isVerified: true, status: 'ACTIVE', deletedAt: null },
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: {
      id: true, uuid: true, name: true, description: true, category: true,
      unitOfMeasure: true, unitPrice: true, basePrice: true, images: true,
      supplier: { select: { id: true, name: true, isVerified: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });
  return NextResponse.json({ products });
}
