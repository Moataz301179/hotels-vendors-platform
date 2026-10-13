import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Investor briefing | HotelsVendors",
  description: "A concise, evidence-led briefing for partners and investors evaluating HotelsVendors.",
};

const pillars = [
  ["Connected procurement", "A controlled workspace for hotel requirements, supplier records, approvals and receiving evidence."],
  ["Evidence before claims", "Source, timestamp, confidence and owner stay attached to each comparison and recommendation."],
  ["Partner-ready network", "Carriers and funders remain provisioned partners with their own controlled portals and decision boundaries."],
];

export default function InvestorsPage() {
  const liveSource = "7a3b211";
  return <main className="hv-public-page">
    <section className="hv-public-hero"><div className="shell hv-public-hero-inner"><div><p className="eyebrow">Investor briefing · 2026</p><h1>The operating layer for hospitality supply.</h1><p>HotelsVendors is building a reviewable procurement network for the work behind every hotel stay: requirements, supplier terms, approvals, delivery and receiving evidence.</p><div className="hv-public-actions"><Link href="/register" className="btn btn-blue">Explore the workspace <ArrowRight size={16}/></Link><Link href="/contact" className="hv-public-text-link">Talk to the team</Link></div></div></div></section>
    <section className="hv-public-section"><div className="shell"><div className="hv-public-section-heading"><div><p className="eyebrow">What is being built</p><h2>From fragmented buying to a decision trail.</h2></div><p>We focus on the operational gap between a hotel requirement and a defensible purchasing decision—not on unverifiable claims of silent access to every marketplace.</p></div><div className="grid gap-4 md:grid-cols-3">{pillars.map(([title,text]) => <article key={title} className="card p-6"><CheckCircle2 size={21} className="text-blue-600"/><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 text-slate-600 leading-7">{text}</p></article>)}</div></div></section>
    <section className="hv-public-section bg-slate-100"><div className="shell"><div className="hv-public-section-heading"><div><p className="eyebrow">Current evidence boundary</p><h2>What can be verified today.</h2></div><p>Public pages explain the product. Authenticated workspaces protect organization records. Production now serves the promoted verified catalogue; private pricing, RFQs and purchasing decisions remain workspace-scoped.</p></div><div className="grid gap-3 md:grid-cols-3"><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Release identity</strong><span className="mt-2 block text-sm text-slate-600">Live source: {liveSource}</span></div><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Workflow scope</strong><span className="mt-2 block text-sm text-slate-600">Requirements → comparison → approval → receiving</span></div><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Data discipline</strong><span className="mt-2 block text-sm text-slate-600">76 active listings from verified SUPPLIER_SYNC records; no placeholders</span></div></div></div></section>
    <section className="hv-public-section"><div className="shell hv-public-final"><h2>Review the product in context.</h2><p>Start with the public workflow, then request a controlled workspace walkthrough for procurement, supplier or partner operations.</p><div className="hv-public-actions"><Link href="/marketplace" className="btn btn-blue">Open supplier catalogue <ArrowRight size={16}/></Link><Link href="/contact" className="hv-public-text-link">Request an investor walkthrough</Link></div></div></section>
  </main>;
}
