import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, PackageCheck, RefreshCw, SearchCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { publicPageMetadata } from '@/lib/seo';
import { publicMarketReference } from '@/lib/directory/public-market-reference';
import { publicMarketplaceDirectoryProfileWhere } from '@/lib/directory/public-marketplace';
import { MarketplaceDirectory } from '@/components/marketing/marketplace-directory';

export const metadata = publicPageMetadata(
  'Hospitality Supplier Sourcing',
  'Discover hospitality products and submit a sourcing requirement through the HOTELSVENDORS procurement network.',
  '/marketplace',
);

// Public listings must reflect verified live records at request time, not build-time database access.
export const dynamic = 'force-dynamic';

function firstDirectoryImage(images: unknown) {
  return Array.isArray(images) ? images.find((image): image is string => typeof image === 'string' && /^https:\/\//i.test(image)) ?? null : null;
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const query = await searchParams;
  const selectedCategory = typeof query.category === 'string' ? query.category : undefined;
  const directoryProfiles = await prisma.directoryProfile.findMany({
    where: publicMarketplaceDirectoryProfileWhere,
    select: { id: true, itemType: true, name: true, category: true, unitOfMeasure: true, images: true, description: true, attributes: true },
    orderBy: { updatedAt: 'desc' }, take: 100,
  }).catch(() => null);
  const entries = directoryProfiles?.map(profile => ({ id: profile.id, itemType: profile.itemType, name: profile.name, category: profile.category, unitOfMeasure: profile.unitOfMeasure, image: firstDirectoryImage(profile.images), description: profile.description, marketReference: publicMarketReference(profile.attributes) })) ?? [];
  const unavailable = directoryProfiles === null;

  const categoryTitle = selectedCategory ? `${selectedCategory} sourcing` : 'Hospitality sourcing';
  return <main className="hv-public-page hv-marketplace">
    <section className="hv-marketplace-hero"><div className="shell"><p className="hv-marketplace-kicker">{selectedCategory ? 'Selected sourcing area' : 'Hospitality sourcing network'}</p><h1>{categoryTitle}.<br/><em>{selectedCategory ? 'Explore what is inside.' : 'Intelligence before commitment.'}</em></h1><p>{selectedCategory ? `Browse the reviewed ${selectedCategory} subcategories and product references. If the needed item is not listed, create one controlled requirement rather than returning to a generic catalogue.` : 'Discover reviewed products with listed MOQ prices where available. Larger quantities, special specifications and delivery terms move to a controlled RFQ before an order is placed.'}</p><div className="hv-marketplace-guard"><SearchCheck size={17}/><span>Prices and MOQ can be shown; vendor identity stays private until the fee-inclusive controlled checkout.</span></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-marketplace-list-head"><div><h2>Product and service directory</h2></div><span className="hv-market-count">{unavailable ? 'Live data unavailable' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}</span></div>
      {!selectedCategory && <div className="hv-market-sourcing-areas" aria-label="Hospitality sourcing areas">{[
        ['Restaurants & bars','/category-food-beverage.png','Ingredients, beverage and kitchen operations'],
        ['Housekeeping & laundry','/category-housekeeping.png','Linen, cleaning and turnover supplies'],
        ['Guest rooms & amenities','/category-guest-supplies.png','In-room amenities and replenishment'],
        ['Engineering & maintenance','/category-engineering-ffe.png','Maintenance and property equipment'],
        ['Furniture, fixtures & outdoor','/category-engineering-ffe.png','Guest-room, public-area and outdoor operating furniture'],
        ['Hotel services','/category-supplier-catalogue.png','Specialist operating, maintenance and compliance services'],
      ].map(([title,image,description])=><Link href={`/marketplace?category=${encodeURIComponent(title)}`} key={title}><Image src={image} alt={description} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 25vw"/><span><strong>{title}</strong><small>{description}</small></span></Link>)}</div>}
      {unavailable ? <div className="hv-market-empty hv-market-error"><span className="hv-market-empty-icon"><RefreshCw size={23}/></span><div><h3>We couldn’t load product discovery records.</h3><p>The live directory could not be reached just now. No placeholder products or commercial terms are being substituted. Please try again in a moment.</p><Link href="/marketplace" className="hv-public-text-link">Try again <ArrowRight size={15}/></Link></div></div> : entries.length ? <MarketplaceDirectory entries={entries} initialCategory={selectedCategory} /> : <div className="hv-market-empty"><span className="hv-market-empty-icon"><PackageCheck size={25}/></span><div><h3>The directory is being prepared.</h3><p>We will not fill this page with placeholder products or fabricated prices. Hotels can still submit a structured requirement for any product or service.</p><Link href="/register" className="hv-public-text-link">Submit a requirement <ArrowRight size={15}/></Link></div></div>}
      <p className="hv-market-footnote">An observed market price is a dated reference only. Supplier identity, source records, hotel demand, RFQs, commercial terms, and order activity remain private.</p>
    </div></section>
  </main>;
}
