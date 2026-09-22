import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText, Truck, CreditCard, Landmark, Zap, Shield, Building2, Factory, Users, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { OlivLogo } from "@/components/partners/oliv-logo";
import { BrandLogo } from "@/components/layout/brand-logo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/flow") },
  title: "How It Works — Order to Payment in 48 Hours | HotelsVendors × Oliv",
  description: "Place orders, get ETA-compliant invoices, access up to EGP 10M instant financing via Oliv. Paperless, 48-hour funding, any invoice volume.",
  openGraph: {
    title: "How It Works — Order to Payment in 48 Hours",
    description: "Seamless procurement + instant invoice financing for Egyptian hospitality.",
    type: "website",
  },
};

const FLOW_STEPS = [
  {
    number: "01",
    title: "Hotel Places Order",
    subtitle: "Browse catalog, select quantities, submit PO",
    actor: "Hotel Procurement",
    icon: Building2,
    color: "var(--accent-base)",
    details: [
      "Search 1,000+ verified hospitality SKUs",
      "Multi-property cart with budget controls",
      "Authority Matrix auto-routes approvals",
      "Instant PO generation with unique ID",
    ],
  },
  {
    number: "02",
    title: "Supplier Confirms & Ships",
    subtitle: "Accept order, pick/pack, dispatch via shared logistics",
    actor: "Supplier",
    icon: Factory,
    color: "var(--orange-base)",
    details: [
      "One-click order acceptance",
      "Real-time inventory sync",
      "Optimized coastal route assignment",
      "Live GPS tracking to hotel dock",
    ],
  },
  {
    number: "03",
    title: "ETA E-Invoice Auto-Generated",
    subtitle: "Three-way match: PO + Delivery Note + Invoice",
    actor: "System",
    icon: FileText,
    color: "var(--purple-base)",
    details: [
      "Cryptographic ETA UUID + digital signature",
      "Three-way match validated in seconds",
      "Invoice status: ACCEPTED by Egyptian Tax Authority",
      "Zero manual reconciliation",
    ],
  },
  {
    number: "04",
    title: "Oliv Finances Invoice (Optional)",
    subtitle: "Supplier clicks 'Get Financed' → up to EGP 10M in 48h",
    actor: "Oliv × Supplier",
    icon: Landmark,
    color: "var(--success)",
    details: [
      "Pre-approved credit engine processes any volume",
      "No paperwork — digital contract signing",
      "Funds in supplier account within 48 hours",
      "Hotel pays Oliv at net-60, supplier paid now",
    ],
  },
  {
    number: "05",
    title: "Hotel Settles at Net-60",
    subtitle: "Single consolidated payment to Oliv",
    actor: "Hotel Finance",
    icon: CreditCard,
    color: "#64b5f6",
    details: [
      "One payment covers all financed invoices",
      "Auto-reconciliation to PO level",
      "Full audit trail for ETA & FRA compliance",
      "Revolving facility — credit resets on repayment",
    ],
  },
];

const KEY_METRICS = [
  { label: "Max Pre-Approval", value: "EGP 10M", icon: CreditCard, color: "var(--success)" },
  { label: "Funding Speed", value: "48 Hours", icon: Clock, color: "var(--accent-base)" },
  { label: "Invoice Volume", value: "Unlimited", icon: RefreshCw, color: "var(--purple-base)" },
  { label: "Paperwork", value: "Zero", icon: FileText, color: "var(--orange-base)" },
  { label: "ETA Compliance", value: "100%", icon: Shield, color: "#64b5f6" },
  { label: "Hotel Payment Terms", value: "Net-60", icon: Calendar, color: "var(--accent-base)" },
];

const SUPPLIER_BENEFITS = [
  { icon: Zap, title: "Instant Cash Flow", desc: "Turn verified invoices into working capital in 48h — no waiting for hotel payment cycles." },
  { icon: Shield, title: "Zero Recourse Risk", desc: "Oliv collects from hotel. Supplier has zero liability if hotel delays." },
  { icon: RefreshCw, title: "Unlimited Volume", desc: "Credit engine handles any number of invoices. Revolving facility grows with your business." },
  { icon: ExternalLink, title: "No Tech Integration", desc: "Works through HotelsVendors dashboard. One click to apply. No API, no accounting software needed." },
];

const HOTEL_BENEFITS = [
  { icon: Clock, title: "Extended Payment Terms", desc: "Net-60 to Oliv vs. Net-15/30 to suppliers. Preserve cash for operations." },
  { icon: Shield, title: "Supplier Loyalty", desc: "Suppliers get paid instantly. They prioritize your orders. Better fill rates, better pricing." },
  { icon: Users, title: "Single Consolidated Payment", desc: "One monthly wire to Oliv covers all financed invoices. Simplified AP workflow." },
  { icon: Building2, title: "Zero Balance Sheet Impact", desc: "Financing is off-balance-sheet for hotel. Oliv takes the credit risk." },
];

function StepCard({ step, index }: { step: typeof FLOW_STEPS[0]; index: number }) {
  const Icon = step.icon;
  return (
    <div className="relative rounded-2xl border bg-[#12121a] p-6 hover:border-white/[0.10] transition-all" style={{ borderColor: `${step.color}22` }}>
      <div className="flex items-start gap-4">
<div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}33` }}>
            <Icon size={22} style={{ color: step.color }} />
          </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: step.color }}>{step.number}</span>
            <h3 className="text-[16px] font-semibold text-white">{step.title}</h3>
          </div>
          <p className="text-[13px] text-white/40 mb-3">{step.subtitle}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {step.details.map((d, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-white/[0.03] border text-white/50" style={{ borderColor: `${step.color}22` }}>{d}</span>
            ))}
          </div>
          <div className="text-[11px] font-medium" style={{ color: step.color }}>{step.actor}</div>
        </div>
      </div>
      {index < FLOW_STEPS.length - 1 && (
        <div className="absolute right-6 top-14 h-[calc(100%+24px)] w-px" style={{ background: `linear-gradient(to bottom, ${step.color}33, transparent)` }} />
      )}
    </div>
  );
}

function BenefitCard({ benefit }: { benefit: typeof SUPPLIER_BENEFITS[0] }) {
  const Icon = benefit.icon;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5 hover:border-white/[0.10] transition-all">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(var(--success-rgb),0.12)", border: "1px solid rgba(var(--success-rgb),0.22)" }}>
        <Icon size={20} style={{ color: "var(--success)" }} />
      </div>
      <h3 className="text-[14px] font-semibold text-white mb-1">{benefit.title}</h3>
      <p className="text-[13px] text-white/40 leading-relaxed">{benefit.desc}</p>
    </div>
  );
}

export default function FlowPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[150px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--success-rgb),0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(var(--success-rgb),0.10)" }}>
            <OlivLogo size="xs" variant="green" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>HotelsVendors × Oliv Partnership</span>
          </div>
          <h1 className="text-[clamp(28px,5vw,48px)] font-semibold leading-[1.1] tracking-tight mb-5">
            From Order to Cash in <span style={{ color: "var(--success)" }}>48 Hours</span>
          </h1>
          <p className="text-[16px] text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
            Place an order. Get ETA-compliant invoice. Click "Get Financed." Supplier paid in 48h. Hotel pays at net-60. <br />Zero paperwork. Unlimited invoice volume. Up to EGP 10M pre-approval.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/financing/oliv" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              <OlivLogo size="xs" variant="dark" />
              Learn About Financing <ArrowRight size={14} />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Start Transacting
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-10 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KEY_METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-4 text-center hover:border-white/[0.10] transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${m.color}12`, border: `1px solid ${m.color}22` }}>
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                  <div className="text-[22px] font-bold text-white">{m.value}</div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/30">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Flow Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--accent-base)" }}>Complete Journey</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Five Steps. One Platform. Zero Friction.</h2>
          </div>
          <div className="space-y-6">
            {FLOW_STEPS.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Supplier Benefits */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--orange-base)" }}>For Suppliers</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white">Get Paid Now. Grow Faster.</h2>
            </div>
            <OlivLogo size="md" variant="green" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUPPLIER_BENEFITS.map((b) => (
              <BenefitCard key={b.title} benefit={b} />
            ))}
          </div>
        </div>
      </section>

      {/* Hotel Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--accent-base)" }}>For Hotels</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-white">Extend Terms. Strengthen Supply Chain.</h2>
            </div>
            <BrandLogo variant="light" size="md" showText={false} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOTEL_BENEFITS.map((b) => (
              <BenefitCard key={b.title} benefit={b} />
            ))}
          </div>
        </div>
      </section>

      {/* How Financing Works Detail */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>Oliv Credit Engine</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Handles Any Invoice Volume. Instantly.</h2>
          </div>
          <div className="rounded-2xl border bg-[#12121a] p-8" style={{ borderColor: "rgba(var(--success-rgb),0.22)" }}>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "rgba(var(--success-rgb),0.08)", border: "1px solid rgba(var(--success-rgb),0.18)" }}>
                <div className="text-[36px] font-bold mb-1" style={{ color: "var(--success)" }}>10M+</div>
                <div className="text-[13px] text-white/40">EGP Pre-Approval Limit</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "rgba(var(--accent-base-rgb),0.08)", border: "1px solid var(--accent-base)18" }}>
                <div className="text-[36px] font-bold mb-1" style={{ color: "var(--accent-base)" }}>48h</div>
                <div className="text-[13px] text-white/40">Funds in Account</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "var(--purple-base)08", border: "1px solid var(--purple-base)18" }}>
                <div className="text-[36px] font-bold mb-1" style={{ color: "var(--purple-base)" }}>∞</div>
                <div className="text-[13px] text-white/40">Invoices Processed</div>
              </div>
            </div>
            <div className="space-y-4 text-[14px] text-white/60 leading-relaxed">
              <p><strong className="text-white">How it works:</strong> When a supplier clicks &ldquo;Get Financed&rdquo; on any verified invoice, Oliv&rsquo;s credit engine instantly evaluates the hotel&rsquo;s creditworthiness (not the supplier&rsquo;s), the invoice validity (ETA UUID verified), and the supplier&rsquo;s transaction history on HotelsVendors.</p>
              <p><strong className="text-white">Any volume:</strong> Whether it&rsquo;s one EGP 50K invoice or fifty EGP 200K invoices in a month — the engine processes each independently. The revolving facility means every repayment resets the available credit.</p>
              <p><strong className="text-white">Paperless:</strong> Digital contract signing via Oliv app. No branch visits. No physical documents. FRA-regulated and fully compliant.</p>
              <p><strong className="text-white">Hotel side:</strong> Hotel receives a single monthly statement from Oliv covering all financed invoices. Pays one wire at net-60. AP team reconciles at PO level automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Ready to Unlock 48-Hour Cash Flow?</h2>
          <p className="text-[14px] text-white/40 mb-8 max-w-md mx-auto">
            Join 100+ suppliers and 20+ hotel groups already transacting on HotelsVendors. First financing referral is free.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://oliv.finance/#register" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.3)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              <OlivLogo size="xs" variant="dark" />
              Apply for Oliv Financing <ExternalLink size={14} />
            </a>
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Join HotelsVendors Marketplace
            </Link>
          </div>
          <p className="text-[11px] text-white/20 mt-6">
            Powered by Oliv Finance — Egypt&apos;s first FRA-licensed digital factoring platform. Backed by Suez Canal Bank (EGP 30M facility).
          </p>
        </div>
      </section>
    </main>
  );
}