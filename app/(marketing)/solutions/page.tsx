import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Network, ScanSearch, Truck } from 'lucide-react';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  'Hospitality Procurement Network Solutions',
  'See how hotels, suppliers, carriers and independent funding partners use HotelsVendors for hospitality sourcing, procurement and fulfillment workflows.',
  '/solutions',
);

const solutions = [
  { href: '/intelligence', action: 'Review price signals', title: 'Market Compass', text: 'Compare real purchasing context, surface price variance and route findings for review.', icon: ScanSearch, result: 'Evidence to validate' },
  { href: '/suppliers', action: 'Open supplier workspace', title: 'Supplier opportunity', text: 'Connect relevant hotel demand to supplier offers and available commercial capacity.', icon: Network, result: 'A relevant business connection' },
  { href: '/carrier', action: 'Open carrier workspace', title: 'Fulfillment visibility', text: 'Bring delivery milestones and exceptions into the commercial flow where available.', icon: Truck, result: 'Clearer coordination' },
  { href: '/funding', action: 'Review funding records', title: 'Funding records', text: 'Share contextual opportunities with consent; external partners retain every funding decision.', icon: CircleDollarSign, result: 'Partner-owned decision' },
];

export default function Solutions() {
  return <main className="hv-public-page hv-solutions">
    <section className="hv-public-hero"><div className="shell hv-public-hero-inner"><h1>Make commercial signals useful.</h1><p>HotelsVendors helps hospitality participants move from disconnected activity to evidence-backed decisions—without inventing outcomes or taking decisions away from the people responsible.</p><div className="hv-public-actions"><Link href="/register" className="btn btn-blue">Join the network <ArrowRight size={15}/></Link><Link href="/marketplace" className="hv-public-text-link">Explore supplier discovery <ArrowRight size={15}/></Link></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-public-section-head"><div><h2>Find the signal.<br/><em>Move the business.</em></h2></div><p>Each solution is grounded in a real workflow, a permission boundary and an outcome that can be checked.</p></div><div className="hv-solution-ledger">{solutions.map(({title,text,icon:Icon,result,href,action})=><article className="hv-solution-row" key={title}><span className="hv-public-actor-icon"><Icon size={20}/></span><div className="hv-solution-main"><h3>{title}</h3><p>{text}</p></div><div><p className="hv-solution-result">{result}</p><Link href={href} className="hv-public-text-link">{action} <ArrowRight size={15} aria-hidden="true" /></Link></div></article>)}</div></div></section>
    <section className="hv-public-alt-section"><div className="shell hv-solutions-note"><h2>HV connects the opportunity.<br/><em>The responsible party decides.</em></h2><p>HotelsVendors is not a lender. It does not approve financing or guarantee savings. The product makes evidence and next actions easier to see; organizations and external partners keep their authority.</p></div></section>
  </main>;
}
