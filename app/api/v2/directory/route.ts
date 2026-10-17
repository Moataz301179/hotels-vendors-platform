import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function publicProfile(profile: {
  id: string; itemType: string; name: string; nameAr: string | null; category: string; subcategory: string | null;
  description: string | null; attributes: unknown; unitOfMeasure: string | null; purchaseUnit: string | null;
  images: unknown; searchTerms: unknown; updatedAt: Date;
}) {
  return {
    id: profile.id,
    itemType: profile.itemType,
    name: profile.name,
    nameAr: profile.nameAr,
    category: profile.category,
    subcategory: profile.subcategory,
    description: profile.description,
    attributes: profile.attributes,
    unitOfMeasure: profile.unitOfMeasure,
    purchaseUnit: profile.purchaseUnit,
    images: Array.isArray(profile.images) ? profile.images.filter((image): image is string => typeof image === 'string') : [],
    searchTerms: Array.isArray(profile.searchTerms) ? profile.searchTerms.filter((term): term is string => typeof term === 'string') : [],
    rfqRequired: true,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/** Public, non-commercial discovery surface. It deliberately does not select candidate or source relations. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get('q')?.trim();
  const category = params.get('category')?.trim();
  const itemType = params.get('itemType')?.trim();
  const profiles = await prisma.directoryProfile.findMany({
    where: {
      publicationStatus: 'PUBLISHED', deletedAt: null,
      ...(category ? { category } : {}),
      ...(itemType ? { itemType } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { searchText: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    },
    select: { id: true, itemType: true, name: true, nameAr: true, category: true, subcategory: true, description: true, attributes: true, unitOfMeasure: true, purchaseUnit: true, images: true, searchTerms: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ profiles: profiles.map(publicProfile), rfqFallback: { href: '/login?redirect_url=%2Fworkspace%2Fmarketplace', label: 'Request what you need' } });
}
