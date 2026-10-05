import Link from 'next/link';
import { ArrowRight, ArrowUpRight, PackageCheck, RefreshCw, SearchCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  'Hospitality Supplier Sourcing',
  'Discover active, verified hospitality supplier listings and connect with relevant sourcing opportunities through the HotelsVendors procurement network.',
  '/marketplace',
);

// Public listings must reflect verified live records at request time, not build-time database access.
export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', deletedAt: null, source:{not:'FIXTURE'}, supplier: { status: 'ACTIVE', isVerified: true, deletedAt:null } },
    select: { id: true, name: true, sku: true, unitPrice: true, unitOfMeasure: true, supplier: { select: { name: true } } },
    take: 60,
  }).catch(() => null);

  return <main className="hv-public-page hv-marketplace">
    <section className="hv-marketplace-hero"><div className="shell"><h1>Real supply.<br/><em>Clear commercial context.</em></h1><p>Discover published supplier listings. RFQs, purchasing decisions and organization-specific records remain inside authenticated workspaces.</p><div className="hv-marketplace-guard"><SearchCheck size={17}/><span>Only active, verified supplier listings are shown publicly.</span></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-marketplace-list-head"><div><h2>Supplier sourcing</h2></div><span className="hv-market-count">{products === null ? 'Live data unavailable' : `${products.length} ${products.length === 1 ? 'listing' : 'listings'}`}</span></div>
      {products === null ? <div className="hv-market-empty hv-market-error"><span className="hv-market-empty-icon"><RefreshCw size={23}/></span><div><h3>We couldn’t load verified listings.</h3><p>The live catalogue could not be reached just now. No placeholder products or prices are being substituted. Please try again in a moment.</p><a href="/marketplace" className="hv-public-text-link">Try again <ArrowRight size={15}/></a></div></div> : products.length ? <div className="hv-market-table"><div className="hv-market-table-head"><span>ITEM / SKU</span><span>SUPPLIER</span><span>UNIT</span><span>PRICE</span><span></span></div>{products.map(p=><article className="hv-market-row" key={p.id}><span className="hv-market-product"><i><PackageCheck size={17}/></i><span><strong>{p.name}</strong><small>{p.sku}</small></span></span><span className="hv-market-supplier">{p.supplier.name}</span><span className="hv-market-unit">{p.unitOfMeasure}</span><strong className="hv-market-price">{p.unitPrice ? `${Number(p.unitPrice).toLocaleString('en-EG',{maximumFractionDigits:2})} EGP` : 'Quote required'}</strong><Link href="/register" aria-label={`Join the network to enquire about ${p.name}`}><ArrowUpRight size={17}/></Link></article>)}</div> : <div className="hv-market-empty"><span className="hv-market-empty-icon"><PackageCheck size={25}/></span><div><h3>The public catalogue is currently empty.</h3><p>We will not fill this page with placeholder products, fabricated prices or unverified supplier claims. Published listings appear when eligible supplier records are available.</p><Link href="/register" className="hv-public-text-link">Join as a supplier <ArrowRight size={15}/></Link></div></div>}
      <p className="hv-market-footnote">Catalogue visibility does not grant access to private supplier pricing, RFQs, hotel demand or order records.</p>
    </div></section>
  </main>;
}
