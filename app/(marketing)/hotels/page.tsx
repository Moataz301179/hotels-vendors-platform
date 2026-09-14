import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Building2, CreditCard, FileText, Users, TrendingUp, Package, Truck, Clock, Landmark, RefreshCw, Wallet, Banknote, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/hotels") },
  title: "Hotels — B2B Procurement + Oliv Factoring | HotelsVendors",
  description: "Centralize procurement across all properties. Get Net-60 terms via Oliv reverse factoring. Suppliers paid instantly. ETA-compliant invoicing. EGP 10M+ credit facility.",
  openGraph: {
    title: "Hotels — B2B Procurement + Oliv Factoring | HotelsVendors",
    description: "Centralize procurement. Net-60 terms via Oliv. Suppliers paid instantly. ETA-compliant.",
    type: "website",
  },
};

const ONBOARDING_STEPS = [
  {
    step: "1",
    title: "Register Your Hotel",
    desc: "Create your account with Tax ID, city, and governorate. Select 'Hotel' as your account type.",
    icon: Building2,
    color: "var(--accent-base)",
    detail: "Single property or chain — we support both. Multi-property groups get centralized procurement.",
  },
  {
    step: "2",
    title: "Get Your ETA Token",
    desc: "Connect to the Egyptian Tax Authority. Your ETA token enables compliant invoicing for all transactions.",
    icon: Shield,
    color: "var(--purple-base)",
    detail: "Required for all B2B transactions in Egypt. We guide you through the ETA registration process.",
  },
  {
    step: "3",
    title: "Connect Oliv Finance",
    desc: "Link your HotelsVendors account to Oliv. Choose factoring or reverse factoring based on your needs.",
    icon: Landmark,
    color: "var(--success)",
    detail: "Oliv evaluates your credit profile and assigns a revolving facility up to EGP 10M+.",
  },
  {
    step: "4",
    title: "Start Procuring",
    desc: "Browse the marketplace, place orders, and let Oliv handle supplier payments. You pay at Net-60.",
    icon: Package,
    color: "var(--orange-base)",
    detail: "500+ suppliers, 10,000+ products, fixed pricing. All invoices ETA-compliant automatically.",
  },
];

const FACTORING_OPTIONS = [
  {
    title: "Factoring (Supplier-Initiated)",
    desc: "Suppliers submit verified invoices to Oliv for immediate payment. You maintain your payment terms.",
    icon: RefreshCw,
    color: "var(--accent-base)",
    benefits: [
      "Suppliers get paid in 48 hours",
      "Your payment terms stay Net-60",
      "Suppliers prioritize your orders",
      "Zero balance sheet impact",
    ],
  },
  {
    title: "Reverse Factoring (Hotel-Initiated)",
    desc: "You approve invoices and Oliv pays suppliers early. You settle with Oliv at Net-60.",
    icon: ArrowRight,
    color: "var(--success)",
    benefits: [
      "You control the payment timing",
      "Suppliers get early payment",
      "Single consolidated monthly payment",
      "Better supplier relationships",
    ],
  },
];

const BENEFITS = [
  { icon: Clock, title: "Net-60 Payment Terms", desc: "Pay Oliv at Net-60 instead of Net-15/30 to suppliers. Preserve working capital for operations.", color: "var(--success)" },
  { icon: Shield, title: "Supplier Priority", desc: "Suppliers get paid instantly via Oliv. They prioritize your orders — better fill rates, faster delivery.", color: "var(--accent-base)" },
  { icon: Users, title: "One Monthly Payment", desc: "Single wire to Oliv covers all financed invoices. Simplified AP. Auto-reconciled to PO level.", color: "var(--purple-base)" },
  { icon: Building2, title: "Multi-Property Support", desc: "Centralized procurement across all properties. Budget controls per outlet. Authority Matrix governance.", color: "var(--orange-base)" },
  { icon: BarChart3, title: "Full Spend Visibility", desc: "Real-time dashboard: PO → Delivery → Invoice → Financing → Payment. Complete audit trail.", color: "#64b5f6" },
  { icon: Landmark, title: "ETA & FRA Compliant", desc: "Every invoice ETA-validated. Digital signatures. Audit-ready trail for Egyptian Tax Authority.", color: "var(--success)" },
];

const METRICS = [
  { label: "Payment Terms", value: "Net-60", icon: Clock, color: "var(--success)" },
  { label: "Consolidated Payments", value: "1 / Month", icon: CreditCard, color: "var(--accent-base)" },
  { label: "Supplier Fill Rate", value: "+23%", icon: TrendingUp, color: "var(--purple-base)" },
  { label: "AP Workload", value: "-60%", icon: Wallet, color: "var(--orange-base)" },
  { label: "ETA Compliance", value: "100%", icon: Shield, color: "#64b5f6" },
  { label: "Oliv Credit Facility", value: "EGP 10M+", icon: Landmark, color: "var(--success)" },
];

const FAQ = [
  { q: "What is the ETA token and why do I need it?", a: "The ETA token is your Egyptian Tax Authority digital identity. It's required for all B2B invoicing in Egypt. Without it, invoices aren't legally compliant. We guide you through the registration process during onboarding." },
  { q: "What's the difference between factoring and reverse factoring?", a: "Factoring is supplier-initiated — suppliers submit invoices to Oliv for early payment. Reverse factoring is hotel-initiated — you approve invoices and Oliv pays suppliers early. Both result in Net-60 terms for you." },
  { q: "Does this change our existing supplier contracts?", a: "No. Your contracts remain unchanged. Oliv is an optional financing layer. Suppliers choose whether to use it. Your payment obligation stays Net-60 to Oliv." },
  { q: "What if a supplier doesn't want financing?", a: "They get paid on your normal terms. Oliv financing is optional. You still benefit from the platform's ordering, logistics, and ETA compliance." },
  { q: "How do I get started?", a: "Register as a hotel → Get your ETA token → Connect Oliv → Start procuring. The entire process takes 1-2 business days." },
  { q: "Is this Shariah-compliant?", a: "Oliv offers Shariah-compliant financing structures. Discuss with their team during onboarding for your specific requirements." },
];

export default function HotelsPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--success-rgb),0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(var(--success-rgb),0.10)" }}>
            <Landmark size={12} style={{ color: "var(--success)" }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>
              Hotels & Property Groups
            </span>
          </div>
          <h1 className="text-[clamp(30px,5vw,52px)] font-semibold leading-[1.05] tracking-tight mb-5">
            Procure for All Properties.<br />
            <span style={{ color: "var(--success)" }}>Pay Once Monthly at Net-60.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed mb-8">
            Centralize multi-property procurement. Connect your ETA token for compliant invoicing.
            Choose <strong style={{ color: "var(--success)" }}>factoring</strong> or <strong style={{ color: "var(--success)" }}>reverse factoring</strong> through Oliv.
            Suppliers get paid instantly. You settle at Net-60.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register?type=hotel" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Start Onboarding <ArrowRight size={14} />
            </Link>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-6 text-[12px] text-white/30">
          <span className="flex items-center gap-2"><Landmark size={14} style={{ color: "var(--success)" }} /> FRA Licensed Digital Factoring</span>
          <span className="flex items-center gap-2"><Shield size={14} style={{ color: "var(--success)" }} /> Suez Canal Bank EGP 30M Facility</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--success)" }} /> Net-60 Payment Terms</span>
          <span className="flex items-center gap-2"><Zap size={14} style={{ color: "var(--success)" }} /> ETA Token Integration</span>
        </div>
      </section>

      {/* Onboarding Steps */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--accent-base)" }}>Get Started in 4 Steps</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">From Registration to First Order</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ONBOARDING_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative rounded-2xl border bg-[#12121a] p-6 hover:border-white/[0.10] transition-all" style={{ borderColor: `${s.color}22` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}33` }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: s.color }}>Step {s.step}</div>
                  <h3 className="text-[15px] font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed mb-3">{s.desc}</p>
                  <p className="text-[11px] text-white/25 leading-relaxed">{s.detail}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/register?type=hotel" className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Begin Hotel Onboarding <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Factoring Options */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>Oliv Financing Options</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Choose What Works for You</h2>
            <p className="text-[14px] text-white/40 max-w-2xl mx-auto mt-4">
              Both options give you Net-60 terms. The difference is who initiates the financing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FACTORING_OPTIONS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border bg-[#12121a] p-8 hover:border-white/[0.10] transition-all" style={{ borderColor: `${f.color}22` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}33` }}>
                    <Icon size={24} style={{ color: f.color }} />
                  </div>
                  <h3 className="text-[18px] font-semibold text-white mb-3">{f.title}</h3>
                  <p className="text-[14px] text-white/40 leading-relaxed mb-5">{f.desc}</p>
                  <ul className="space-y-2.5">
                    {f.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-[13px] text-white/50">
                        <CheckCircle2 size={14} style={{ color: f.color }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Marketplace Payment Flow */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--orange-base)" }}>Marketplace Integration</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Shop. Checkout. Oliv Handles Payment.</h2>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-8 md:p-10">
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Browse Catalog", desc: "Search 10,000+ products from 500+ verified suppliers.", color: "var(--accent-base)" },
                { step: "2", title: "Place Order", desc: "Add to cart, apply Authority Matrix approvals, confirm PO.", color: "var(--purple-base)" },
                { step: "3", title: "Checkout via Oliv", desc: "At checkout, Oliv processes the payment. Your terms: Net-60.", color: "var(--success)" },
                { step: "4", title: "Suppliers Paid", desc: "Suppliers receive payment in 48 hours. You pay Oliv later.", color: "var(--orange-base)" },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 text-[16px] font-bold" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}33`, color: s.color }}>
                    {s.step}
                  </div>
                  <h4 className="text-[14px] font-semibold text-white mb-2">{s.title}</h4>
                  <p className="text-[12px] text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 pt-8 border-t border-white/[0.06]">
              <p className="text-[13px] text-white/40 mb-4">
                Every transaction is ETA-compliant. Every invoice is digitally signed. Every payment is auditable.
              </p>
              <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(var(--orange-base-rgb),0.2)]" style={{ backgroundColor: "var(--orange-base)", color: "var(--surface)" }}>
                Browse Marketplace <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3 block" style={{ color: "var(--success)" }}>Why Hotels Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Built for Multi-Property Hospitality</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-2xl border border-white/[0.06] bg-[#12121a] p-6 hover:border-white/[0.10] transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${b.color}12`, border: `1px solid ${b.color}22` }}>
                    <Icon size={18} style={{ color: b.color }} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border p-8 md:p-12 text-center" style={{ borderColor: "rgba(var(--success-rgb),0.22)", backgroundColor: "rgba(var(--success-rgb),0.06)" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(var(--success-rgb),0.10)" }}>
              <Landmark size={12} style={{ color: "var(--success)" }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>Measurable Impact</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">Results You Can Track</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {METRICS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5 hover:border-white/[0.10] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}12`, border: `1px solid ${m.color}22` }}>
                        <Icon size={18} style={{ color: m.color }} />
                      </div>
                      <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{m.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{m.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-xl border border-white/[0.06] bg-[#12121a] p-5">
                <h3 className="text-[14px] font-semibold text-white mb-2">{f.q}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Ready to Transform Your Hotel Procurement?</h2>
          <p className="text-[14px] text-white/40 mb-8 max-w-md mx-auto">
            Join leading hotel groups in Egypt. Connect your ETA token, set up Oliv financing,
            and start procuring with Net-60 terms.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register?type=hotel" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--success-rgb),0.25)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Start Onboarding <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Talk to Our Team
            </Link>
          </div>
          <p className="text-[11px] text-white/20 mt-6">
            Questions? Click the chat button to talk to our onboarding agent.
          </p>
        </div>
      </section>
    </main>
  );
}
