import Link from 'next/link';
import { ArrowRight, Armchair, BedDouble, ClipboardCheck, PackageCheck, RefreshCw, SearchCheck, Sparkles, UtensilsCrossed, Wrench } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { publicPageMetadata } from '@/lib/seo';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { publicDirectoryFields, publicDirectoryText } from '@/lib/directory/public-directory-profile';
import { MarketplaceDirectory } from '@/components/marketing/marketplace-directory';

export const metadata = publicPageMetadata(
  'Hospitality Vendor Sourcing',
  'Discover hospitality products and submit a sourcing requirement through the HOTELSVENDORS procurement network.',
  '/marketplace',
);

// Public listings must reflect verified live records at request time, not build-time database access.
export const dynamic = 'force-dynamic';

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const query = await searchParams;
  const selectedCategory = typeof query.category === 'string' ? query.category : undefined;
  const directoryProfiles = await prisma.directoryProfile.findMany({
    where: publicMarketplaceDirectoryProfileWhere,
    select: { id: true, itemType: true, name: true, nameAr: true, category: true, subcategory: true, unitOfMeasure: true, purchaseUnit: true, images: true, description: true, attributes: true },
    orderBy: { updatedAt: 'desc' }, take: 100,
  }).catch(() => null);
  const entries = directoryProfiles?.flatMap((profile) => {
    const category = profile.category ?? null;
    const fields = publicDirectoryFields(profile);
    // A category photograph is navigation artwork, not product evidence. Do not
    // attach it to every directory record when no reviewed, first-party product
    // image has been approved for publication.
    return fields ? [{ id: profile.id, itemType: profile.itemType, ...fields, category, image: null, description: publicDirectoryText(profile.description) }] : [];
  }) ?? [];
  const unavailable = directoryProfiles === null;

  const categoryTitle = selectedCategory ? `${selectedCategory} sourcing` : 'Hospitality sourcing';
  const sourcingAreas = [
    { title: 'Restaurants & bars', detail: 'Food, beverage, kitchen and table-service operations', icon: UtensilsCrossed, image: '/category-food-beverage.png' },
    { title: 'Housekeeping & laundry', detail: 'Linen, cleaning, textile care and room turnover', icon: Sparkles, image: '/category-housekeeping.png' },
    { title: 'Guest rooms & amenities', detail: 'In-room needs and guest-facing replenishment', icon: BedDouble, image: '/category-guest-supplies.png' },
    { title: 'Engineering & maintenance', detail: 'Property systems, parts, tools and planned maintenance', icon: Wrench, image: '/category-engineering-ffe.png' },
    { title: 'Furniture, fixtures & outdoor', detail: 'Guest rooms, public areas, pool and outdoor requirements', icon: Armchair, image: '/category-furniture-fixtures.jpg' },
    { title: 'Hotel services', detail: 'Specialist maintenance, compliance and operating support', icon: ClipboardCheck, image: '/category-supplier-catalogue.png' },
  ];
  return <main className="hv-public-page hv-marketplace">
    <section className="hv-marketplace-hero"><div className="shell"><p className="hv-marketplace-kicker">{selectedCategory ? 'Selected sourcing area' : 'Hotel procurement directory'}</p><h1>{selectedCategory ? `${categoryTitle}.` : 'Find the reference. Keep the commercial decision controlled.'}</h1><p>{selectedCategory ? `Browse reviewed ${selectedCategory} references. If the needed item is not present, start a controlled requirement instead of treating an incomplete directory as a live offer.` : 'Start with a reviewed product or service reference, then move the real specification, quantity, timing and commercial terms into a protected sourcing workflow.'}</p><div className="hv-marketplace-guard"><SearchCheck size={17}/><span>Vendor identity, availability, pricing and private commercial terms are not public catalogue data.</span></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-marketplace-list-head"><div><h2>Product and service directory</h2></div><span className="hv-market-count">{unavailable ? 'Live data unavailable' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}</span></div>
      {!selectedCategory && <nav className="hv-market-sourcing-areas" aria-label="Hospitality sourcing areas">{sourcingAreas.map(({ title, detail, image })=><Link href={`/marketplace?category=${encodeURIComponent(title)}`} key={title}><img src={image} alt="" loading="lazy" /><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight aria-hidden="true"/></Link>)}</nav>}
      {unavailable ? <div className="hv-market-empty hv-market-error"><span className="hv-market-empty-icon"><RefreshCw size={23}/></span><div><h3>The reviewed directory is unavailable.</h3><p>No product, price or commercial term is being substituted while the data source is unavailable. Try again, or start a controlled requirement from a hotel workspace.</p><Link href="/marketplace" className="hv-public-text-link">Try again <ArrowRight size={15}/></Link></div></div> : entries.length ? <MarketplaceDirectory entries={entries} initialCategory={selectedCategory} /> : <div className="hv-market-empty"><span className="hv-market-empty-icon"><PackageCheck size={25}/></span><div><h3>No reviewed references are published in this area yet.</h3><p>The directory will not invent products, prices or Vendor attribution. Hotels can create a structured requirement for an exact product or service.</p><Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace" className="hv-public-text-link">Start a controlled requirement <ArrowRight size={15}/></Link></div></div>}
      <p className="hv-market-footnote">Vendor identity, source records, hotel demand, RFQs, commercial terms, and order activity remain private.</p>
    </div></section>
  </main>;
}
