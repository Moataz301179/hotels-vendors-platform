import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Building2, CircleDollarSign, PackageCheck, Truck } from 'lucide-react';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  'Hospitality Procurement Platform',
  'Explore how HOTELSVENDORS connects hotel requirements, Vendor sourcing, fulfillment evidence and provider-controlled referrals without removing organizational authority.',
  '/platform',
);

const actors = [
  { title: 'Hotels', text: 'Frame requirements, preserve approval authority and reconcile what arrives.', href: '/dashboard', icon: Building2 },
  { title: 'Vendors', text: 'Maintain owned catalogue evidence and respond only to authorized sourcing work.', href: '/suppliers', icon: PackageCheck },
  { title: 'Carriers', text: 'Accept assigned handoffs and record delivery evidence on the linked order.', href: '/carrier', icon: Truck },
  { title: 'Funders', text: 'Receive evidence-led referrals and retain every credit, payout and collection decision.', href: '/funding', icon: CircleDollarSign },
];

export default function Platform() {
  return <div className="hv-public-page hv-platform">
    <section className="hv-public-hero"><div className="shell hv-public-hero-inner hv-public-photo-layout"><div><h1>The operating network behind a ready property.</h1><p>A hotel requirement can move through controlled sourcing, approval, delivery and receiving without losing its commercial context—or the authority of the organization responsible for the next step.</p><div className="hv-public-actions"><Link href="/register" className="btn btn-blue">Join the network <ArrowRight size={15}/></Link><Link href="/walkthrough" className="hv-public-text-link">See the operating flow <ArrowUpRight size={15}/></Link></div></div><figure className="hv-public-photo"><Image src="/hv-workspace-team.webp" alt="Hotel operator reviewing a procurement workspace while the property team prepares service supplies" fill sizes="(max-width: 900px) 100vw, 42vw" preload /></figure></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-public-section-head"><div><h2>One network record.<br/><em>Distinct responsibilities.</em></h2></div><p>Shared operating context does not make commercial data public or transfer decision rights. Every participant sees only the handoff their role is authorized to own.</p></div><div className="hv-public-actor-list">{actors.map(({title,text,href,icon:Icon})=><Link className="hv-public-actor" href={href} key={title}><span className="hv-public-actor-icon"><Icon size={20}/></span><span className="hv-public-actor-name">{title}</span><span className="hv-public-actor-text">{text}</span><ArrowUpRight size={17}/></Link>)}</div></div></section>
    <section className="hv-public-alt-section"><div className="shell hv-platform-shadow"><div><h2>Technology that clarifies.<br/><em>People who decide.</em></h2><p>Virtual Shadow can organize permissioned records into evidence-led decision briefs. It does not invent a supplier result, approve a purchase, guarantee a saving or make a financing decision.</p><Link href="/intelligence" className="hv-public-text-link">Explore the intelligence boundary <ArrowRight size={15}/></Link></div><div className="hv-platform-principles"><div><span>01</span><strong>Frame</strong><p>Capture the operating requirement with context.</p></div><div><span>02</span><strong>Protect</strong><p>Keep terms and identity within the authorized workflow.</p></div><div><span>03</span><strong>Authorize</strong><p>Route the decision to the accountable person.</p></div><div><span>04</span><strong>Reconcile</strong><p>Connect delivery and receipt evidence to the record.</p></div></div></div></section>
    <section className="hv-public-close"><div className="shell"><div><h2>Bring the right organization to the right handoff.</h2></div><Link href="/register" className="btn btn-blue">Start with your workspace <ArrowRight size={15}/></Link></div></section>
  </div>;
}
