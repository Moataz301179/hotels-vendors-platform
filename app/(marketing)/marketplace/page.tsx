import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, PackageCheck, RefreshCw, SearchCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { publicPageMetadata } from '@/lib/seo';
import { resolvedProductEvidenceIds } from '@/lib/catalog/resolved-product-evidence';
import { firstPublicProductImageUrl } from '@/lib/catalog/public-product-images';

export const metadata = publicPageMetadata(
  'Hospitality Supplier Sourcing',
  'Discover hospitality products and submit a sourcing requirement through the HOTELSVENDORS procurement network.',
  '/marketplace',
);

// Public listings must reflect verified live records at request time, not build-time database access.
export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', deletedAt: null, source:{not:'FIXTURE'}, supplier: { status: 'ACTIVE', isVerified: true, deletedAt:null } },
    select: { id: true, name: true, sku: true, unitOfMeasure: true, images: true, sourceKey: true },
    take: 100,
  }).catch(() => null);
  const evidenceIds = products ? await resolvedProductEvidenceIds(prisma, products).catch(() => null) : null;
  const publishedProducts = products && evidenceIds ? products.filter(product => evidenceIds.has(product.id)).map(product => ({ ...product, image: firstPublicProductImageUrl(product.images) })).filter(product => product.image) : null;

  return <main className="hv-public-page hv-marketplace">
    <section className="hv-marketplace-hero"><div className="shell"><h1>Hospitality sourcing.<br/><em>Evidence before engagement.</em></h1><p>Discover product requirements with attributable source evidence. Prices, supplier identity, and commercial terms are protected until the approved invoice stage.</p><div className="hv-marketplace-guard"><SearchCheck size={17}/><span>Only products with resolved source evidence are shown publicly.</span></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-marketplace-list-head"><div><h2>Product sourcing</h2></div><span className="hv-market-count">{publishedProducts === null ? 'Live data unavailable' : `${publishedProducts.length} ${publishedProducts.length === 1 ? 'product' : 'products'}`}</span></div>
      <div className="hv-market-sourcing-areas" aria-label="Hospitality sourcing areas">{[
        ['Food & beverage','/category-food-beverage.png','Ingredients and beverage operations'],
        ['Housekeeping','/category-housekeeping.png','Linen, cleaning and turnover supplies'],
        ['Guest supplies','/category-guest-supplies.png','In-room amenities and replenishment'],
        ['Engineering & FF&E','/category-engineering-ffe.png','Maintenance and property equipment'],
      ].map(([title,image,description])=><article key={title}><Image src={image} alt={description} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 25vw"/><span><strong>{title}</strong><small>{description}</small></span></article>)}</div>
      {publishedProducts === null ? <div className="hv-market-empty hv-market-error"><span className="hv-market-empty-icon"><RefreshCw size={23}/></span><div><h3>We couldn’t load product discovery records.</h3><p>The live catalogue could not be reached just now. No placeholder products or commercial terms are being substituted. Please try again in a moment.</p><a href="/marketplace" className="hv-public-text-link">Try again <ArrowRight size={15}/></a></div></div> : publishedProducts.length ? <div className="hv-market-table"><div className="hv-market-table-head"><span>ITEM / SKU</span><span>UNIT</span><span>COMMERCIAL PATH</span><span></span></div>{publishedProducts.map(p=><article className="hv-market-row" key={p.id}><span className="hv-market-product">{p.image && <img className="hv-market-product-image" src={p.image} alt={p.name}/>}<span><strong>{p.name}</strong><small>{p.sku}</small></span></span><span className="hv-market-unit">{p.unitOfMeasure}</span><strong className="hv-market-price">RFQ required</strong><Link href="/register" aria-label={`Join the network to enquire about ${p.name}`}><ArrowUpRight size={17}/></Link></article>)}</div> : <div className="hv-market-empty"><span className="hv-market-empty-icon"><PackageCheck size={25}/></span><div><h3>The product catalogue is currently empty.</h3><p>We will not fill this page with placeholder products, fabricated prices or unverified supplier claims. Products appear when source evidence and attributable media are available.</p><Link href="/register" className="hv-public-text-link">Join the network <ArrowRight size={15}/></Link></div></div>}
      <p className="hv-market-footnote">Catalogue visibility does not grant access to supplier identity, commercial prices, RFQs, hotel demand, or order records.</p>
    </div></section>
  </main>;
}
