import Link from 'next/link';
import { ArrowRight, PackageCheck, RefreshCw } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { publicPageMetadata } from '@/lib/seo';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { publicDirectoryFields, publicDirectoryText } from '@/lib/directory/public-directory-profile';
import { MarketplaceDirectory } from '@/components/marketing/marketplace-directory';
import { PROCUREMENT_JOURNEY } from '@/lib/marketing/procurement-journey';

export const metadata = publicPageMetadata(
  'Hospitality Vendor Sourcing',
  'Discover hospitality products and submit a sourcing requirement through the HOTELSVENDORS procurement network.',
  '/marketplace',
);

// Public listings must reflect verified live records at request time, not build-time database access.
export const dynamic = 'force-dynamic';

function firstString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const query = await searchParams;
  const selectedCategory = firstString(query.category);
  const initialQuery = firstString(query.q)?.trim() || undefined;
  const directoryProfiles = await prisma.directoryProfile.findMany({
    where: publicMarketplaceDirectoryProfileWhere,
    select: {
      id: true,
      itemType: true,
      name: true,
      nameAr: true,
      category: true,
      subcategory: true,
      unitOfMeasure: true,
      purchaseUnit: true,
      images: true,
      description: true,
      attributes: true,
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    take: 1000,
  }).catch(() => null);

  const entries = directoryProfiles?.flatMap((profile) => {
    const category = profile.category ?? null;
    const fields = publicDirectoryFields(profile);
    // A category photograph is navigation artwork, not product evidence. Do not
    // attach it to every directory record when no reviewed, first-party product
    // image has been approved for publication.
    return fields
      ? [{
          id: profile.id,
          itemType: profile.itemType,
          ...fields,
          category,
          image: null,
          description: publicDirectoryText(profile.description),
        }]
      : [];
  }) ?? [];
  const unavailable = directoryProfiles === null;

  return (
    <div className="hv-public-page hv-marketplace">
      {entries.length && !unavailable ? (
        <MarketplaceDirectory
          entries={entries}
          initialCategory={selectedCategory}
          initialQuery={initialQuery}
        />
      ) : (
        <section className="hv-public-section">
          <div className="shell">
            {unavailable ? (
              <div className="hv-market-empty hv-market-error">
                <span className="hv-market-empty-icon"><RefreshCw size={23} /></span>
                <div>
                  <h3>The reviewed directory is unavailable.</h3>
                  <p>
                    No product, price or commercial term is being substituted while the data source is
                    unavailable. Try again, or start a controlled requirement from a hotel workspace.
                  </p>
                  <Link href={PROCUREMENT_JOURNEY.catalogue.href} className="hv-public-text-link">
                    Try again <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hv-market-empty">
                <span className="hv-market-empty-icon"><PackageCheck size={25} /></span>
                <div>
                  <h3>No reviewed references are published in this area yet.</h3>
                  <p>
                    The directory will not invent products, prices or Vendor attribution. Hotels can create a
                    structured requirement for an exact product or service.
                  </p>
                  <Link
                    href={`/login?redirect_url=${encodeURIComponent(PROCUREMENT_JOURNEY.workspaceMarketplace.href)}`}
                    className="hv-public-text-link"
                  >
                    Start a controlled requirement <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
