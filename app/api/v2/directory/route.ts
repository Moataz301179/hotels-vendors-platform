import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { publicDirectoryFields, publicDirectoryImages, publicDirectorySpecifications, publicDirectoryText } from '@/lib/directory/public-directory-profile';

function publicProfile(profile: {
  id: string; itemType: string; name: string; nameAr: string | null; category: string; subcategory: string | null;
  description: string | null; attributes: unknown; unitOfMeasure: string | null; purchaseUnit: string | null;
  images: unknown; searchTerms: unknown; updatedAt: Date;
}) {
  const fields = publicDirectoryFields(profile);
  if (!fields) return null;
  return {
    id: profile.id,
    itemType: profile.itemType,
    ...fields,
    description: publicDirectoryText(profile.description),
    attributes: publicDirectorySpecifications(profile.attributes),
    images: publicDirectoryImages(profile.images),
    rfqRequired: true,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/** Public, non-commercial discovery surface. It deliberately does not select candidate or source relations. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get('id')?.trim();
  const q = params.get('q')?.trim();
  const category = params.get('category')?.trim();
  const itemType = params.get('itemType')?.trim();
  const profiles = await prisma.directoryProfile.findMany({
    where: {
      ...publicMarketplaceDirectoryProfileWhere,
      ...(id ? { id } : {}),
      ...(category ? { category } : {}),
      ...(itemType ? { itemType } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { subcategory: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    },
    select: { id: true, itemType: true, name: true, nameAr: true, category: true, subcategory: true, description: true, attributes: true, unitOfMeasure: true, purchaseUnit: true, images: true, searchTerms: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ profiles: profiles.flatMap((profile) => {
    const publicProfileRecord = publicProfile(profile);
    return publicProfileRecord ? [publicProfileRecord] : [];
  }), rfqFallback: { href: '/login?redirect_url=%2Fworkspace%2Fmarketplace', label: 'Request what you need' } });
}
