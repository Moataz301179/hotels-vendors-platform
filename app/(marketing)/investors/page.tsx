import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Building2, Network, Handshake, LineChart } from "lucide-react";

export const metadata = {
  title: "Investor briefing | HOTELSVENDORS",
  description:
    "Company profile, business model, market opportunity and partnership model for investors and strategic partners evaluating HOTELSVENDORS, a hospitality procurement network in Egypt.",
  alternates: { canonical: "https://www.hotelsvendors.com/investors" },
  openGraph: {
    title: "Investor briefing | HOTELSVENDORS",
    description:
      "Company profile, business model, market opportunity and partnership model for investors and strategic partners.",
    type: "article",
  },
};

const pillars = [
  ["Connected procurement", "A controlled workspace for hotel requirements, supplier records, approvals and receiving evidence."],
  ["Evidence before claims", "Source, timestamp, confidence and owner stay attached to each comparison and recommendation."],
  ["Partner-ready network", "Carriers and funders remain provisioned partners with their own controlled portals and decision boundaries."],
];

const businessModel = [
  ["Procurement network", "Hotels frame requirements, suppliers respond with sealed terms, and the platform records the comparison, approval and receiving trail."],
  ["Transactional model", "Revenue is intended to follow completed network activity rather than a flat listing fee, so the platform is aligned with the transactions it helps complete."],
  ["Compliance backbone", "Egyptian Tax Authority e-invoicing integration is built into the workflow, not added as an afterthought."],
  ["Provider-controlled finance", "External funders and carriers participate through their own portals. HOTELSVENDORS does not hold funds, extend credit or underwrite risk."],
];

const opportunity = [
  ["Vertical depth", "Hospitality has its own categories, units, seasonality and suppliers. A horizontal B2B catalogue does not represent it well."],
  ["Working-capital pressure", "Hotels pay suppliers on terms while their own revenue is seasonal. Provider-controlled financing addresses a real cash-flow gap."],
  ["Fragmented sourcing", "Multi-property groups still coordinate purchasing through informal channels, which makes spend hard to review and hard to defend."],
  ["Regulatory timing", "Mandatory e-invoicing creates a compliance deadline that procurement systems must absorb."],
];

const investment = [
  ["What is being raised", "The team is open to conversations with investors who understand marketplace, compliance and fintech-adjacent businesses in Egypt and the wider MENA region."],
  ["What a partner should expect", "Evidence over projection. Where a figure cannot be verified from production records, it is stated as a target or omitted."],
  ["How to evaluate the company", "Review the live platform, the public workflow and the authenticated workspace before drawing conclusions about the operating model."],
];

const partnership = [
  ["Supplier networks", "Industry associations, chambers of commerce and supplier cooperatives that want a structured route to hotel buyers."],
  ["Logistics providers", "Carriers and fulfilment operators that can serve shared routes and reduce per-delivery overhead."],
  ["Finance providers", "Licensed funders that can offer provider-controlled financing against verified receivables."],
  ["Technology partners", "PMS, ERP and property-operations vendors whose systems could exchange structured purchasing data."],
];

function Section({ icon, eyebrow, title, intro, items }: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
  items: string[][];
}) {
  return <section className="hv-public-section"><div className="shell"><div className="hv-public-section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><p>{intro}</p></div><div className="grid gap-4 md:grid-cols-2">{items.map(([t, d]) => <article key={t} className="card p-6"><div className="flex items-center gap-3">{icon}<h3 className="text-lg font-semibold">{t}</h3></div><p className="mt-3 text-slate-600 leading-7">{d}</p></article>)}</div></div></section>;
}

export default function InvestorsPage() {
  const liveSource = "available at /api/health";
  return <main className="hv-public-page">
    <section className="hv-public-hero"><div className="shell hv-public-hero-inner"><div><p className="eyebrow">Investor briefing · 2026</p><h1>The operating layer for hospitality supply.</h1><p>HOTELSVENDORS is building a reviewable procurement network for the work behind every hotel stay: requirements, supplier terms, approvals, delivery and receiving evidence.</p><div className="hv-public-actions"><Link href="/register" className="btn btn-blue">Explore the workspace <ArrowRight size={16}/></Link><Link href="/contact" className="hv-public-text-link">Talk to the team</Link></div></div></div></section>

    <Section icon={<Building2 size={21} className="text-blue-600"/>} eyebrow="Company profile" title="What HOTELSVENDORS is." intro="A hospitality procurement network connecting hotels, suppliers, carriers and external funders. The platform is operated by an Egyptian entity and serves properties across the country." items={pillars} />

    <Section icon={<Network size={21} className="text-blue-600"/>} eyebrow="Business model" title="How the network is intended to earn." intro="The model is transactional and compliance-led. No figure below is presented as current revenue or as a commitment to charge." items={businessModel} />

    <Section icon={<LineChart size={21} className="text-blue-600"/>} eyebrow="Market opportunity" title="Why hospitality procurement is the gap." intro="The opportunity is structural rather than seasonal. Each point below describes an operating condition the platform is built to address." items={opportunity} />

    <Section icon={<Handshake size={21} className="text-blue-600"/>} eyebrow="Strategic partnership" title="Who can build this with us." intro="The network only works if the other three sides are properly represented. These are the partnership categories the team is structured to work with." items={partnership} />

    <section className="hv-public-section bg-slate-100"><div className="shell"><div className="hv-public-section-heading"><div><p className="eyebrow">Investment opportunity</p><h2>What we are open to discussing.</h2></div><p>Conversations should be grounded in what can be verified. Where the team does not have production evidence, it will say so directly.</p></div><div className="grid gap-3 md:grid-cols-3">{investment.map(([t, d]) => <div key={t} className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">{t}</strong><span className="mt-2 block text-sm text-slate-600">{d}</span></div>)}</div></div></section>

    <section className="hv-public-section"><div className="shell"><div className="hv-public-section-heading"><div><p className="eyebrow">Current evidence boundary</p><h2>What can be verified today.</h2></div><p>Public pages explain the product. Authenticated workspaces protect organization records. Production enforces supplier eligibility and source-evidence review before a listing can become visible; private pricing, RFQs and purchasing decisions remain workspace-scoped.</p></div><div className="grid gap-3 md:grid-cols-3"><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Release identity</strong><span className="mt-2 block text-sm text-slate-600">Live source: {liveSource}</span></div><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Workflow scope</strong><span className="mt-2 block text-sm text-slate-600">Requirements → comparison → approval → receiving</span></div><div className="card p-5"><ShieldCheck size={20}/><strong className="mt-3 block">Data discipline</strong><span className="mt-2 block text-sm text-slate-600">A public listing requires an active verified supplier and resolved evidence for its exact source; no placeholders.</span></div></div></div></section>

    <section className="hv-public-section"><div className="shell hv-public-final"><h2>Review the product in context.</h2><p>Start with the public workflow, then request a controlled workspace walkthrough for procurement, supplier or partner operations.</p><div className="hv-public-actions"><Link href="/marketplace" className="btn btn-blue">Open supplier catalogue <ArrowRight size={16}/></Link><Link href="/contact" className="hv-public-text-link">Request an investor walkthrough</Link></div></div></section>
  </main>;
}
