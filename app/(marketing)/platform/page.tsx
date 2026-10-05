import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Building2, CircleDollarSign, PackageCheck, Truck } from 'lucide-react';

const actors = [
  { title: 'Hotels', text: 'Manage purchasing, compare offers, control approvals and review spend signals.', href: '/dashboard', icon: Building2 },
  { title: 'Suppliers', text: 'Respond to relevant demand, manage offers and follow qualified orders.', href: '/suppliers', icon: PackageCheck },
  { title: 'Carriers', text: 'Coordinate fulfillment and delivery through controlled partner access.', href: '/carrier', icon: Truck },
  { title: 'Funders', text: 'Review consented signals and make independent financing decisions.', href: '/funding', icon: CircleDollarSign },
];

export default function Platform() {
  return <main className="hv-public-page hv-platform">
    <section className="hv-public-hero"><div className="shell hv-public-hero-inner hv-public-photo-layout"><div><h1>One network for the work behind hospitality.</h1><p>HotelsVendors connects procurement, supplier activity, fulfillment and partner signals. Market Compass finds context across that activity and routes evidence to the participant who can act.</p><div className="hv-public-actions"><Link href="/register" className="btn btn-blue">Join the network <ArrowRight size={15}/></Link><Link href="/intelligence" className="hv-public-text-link">Explore Market Compass <ArrowUpRight size={15}/></Link></div></div><figure className="hv-public-photo"><Image src="/hero-clean.jpeg" alt="Hotel suite with a sea-facing terrace" fill sizes="(max-width: 900px) 100vw, 42vw" preload /></figure></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-public-section-head"><div><h2>One commercial environment.<br/><em>Separate authority.</em></h2></div><p>Shared context does not mean shared access. Each organization works within its own permissions and responsibilities.</p></div><div className="hv-public-actor-list">{actors.map(({title,text,href,icon:Icon})=><Link className="hv-public-actor" href={href} key={title}><span className="hv-public-actor-icon"><Icon size={20}/></span><span className="hv-public-actor-name">{title}</span><span className="hv-public-actor-text">{text}</span><ArrowUpRight size={17}/></Link>)}</div></div></section>
    <section className="hv-public-alt-section"><div className="shell hv-platform-shadow"><div><h2>Not more charts.<br/><em>A better next move.</em></h2><p>Market Compass surfaces possible cost leaks, network matches and cash-flow signals with evidence, source context and uncertainty. A finding is a prompt to review—not a guaranteed result or an automated business verdict.</p><Link href="/intelligence" className="hv-public-text-link">Open the intelligence workspace <ArrowRight size={15}/></Link></div><div className="hv-platform-principles"><div><span>01</span><strong>Observe</strong><p>Authorized activity and trusted sources.</p></div><div><span>02</span><strong>Connect</strong><p>Relevant records, offers and context.</p></div><div><span>03</span><strong>Act</strong><p>A person validates and decides.</p></div><div><span>04</span><strong>Measure</strong><p>Track outcomes where evidence exists.</p></div></div></div></section>
    <section className="hv-public-close"><div className="shell"><div><h2>Bring your part of the network into view.</h2></div><Link href="/register" className="btn btn-blue">Get started <ArrowRight size={15}/></Link></div></section>
  </main>;
}
