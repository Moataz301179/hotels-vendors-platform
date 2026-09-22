import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { Check, ArrowRight, Building2, Store, Landmark, Zap } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/pricing") },
  title: "Enterprise Hospitality Procurement Pricing | HotelsVendors Egypt",
  description: "Transparent pricing for Egyptian hospitality procurement. SaaS listing plans, per-document ETA processing fees, and marketplace commissions. No hidden financial spreads.",
  keywords: ["B2B hospitality procurement Egypt", "hotel procurement pricing Egypt", "SaaS marketplace Egypt", "ETA document processing fee", "hospitality platform pricing", "تسعير المشتريات الفندقية مصر"],
  openGraph: {
    title: "Enterprise Hospitality Procurement Pricing | HotelsVendors Egypt",
    description: "Transparent pricing for Egyptian hospitality procurement. SaaS listing plans, per-document ETA processing fees, and marketplace commissions.",
    type: "website",
  },
};

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "For single-property hotels getting started with digital procurement. No credit card. No commitment.",
    features: [
      "Up to 50 orders/month",
      "Basic AI demand forecasting",
      "ETA e-invoicing compliance",
      "1 user seat",
      "Email support",
    ],
    cta: "Get Started Free",
    highlighted: false,
    icon: Building2,
  },
  {
    name: "Professional",
    price: "Custom",
    period: "per property/month",
    desc: "For growing hotel groups needing full procurement automation, budget control, and embedded factoring.",
    features: [
      "Unlimited orders",
      "Advanced AI forecasting (14-day)",
      "Budget blockades & authority matrix",
      "Multi-property management",
      "Embedded factoring (net-60)",
      "Shared-route logistics",
      "10 user seats",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: true,
    icon: Store,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large hotel chains and resort groups with complex requirements, custom integrations, and dedicated support.",
    features: [
      "Everything in Professional",
      "Unlimited properties",
      "Custom authority matrices",
      "Dedicated account manager",
      "API access & integrations",
      "Custom SLA",
      "On-premise deployment option",
      "Unlimited user seats",
    ],
    cta: "Talk to Us",
    highlighted: false,
    icon: Landmark,
  },
];

export default function PricingPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Pricing</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-white">
            No Per-Transaction Fees.<br />No Hidden Spreads.<br /><span className="text-white">Transparent Enterprise<br />Pricing.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-xl mx-auto leading-relaxed">
            Start free. Scale when you&apos;re ready. No hidden fees, no long-term contracts, no surprises on your invoice.
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Check, label: "Free Tier Available", desc: "No credit card" },
              { icon: Zap, label: "No Hidden Fees", desc: "Transparent pricing" },
              { icon: Building2, label: "Per-Property Billing", desc: "Scales with you" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "var(--accent-base)" }} />
                <div>
                  <p className="text-[11px] font-medium text-white/60">{b.label}</p>
                  <p className="text-[9px] text-white/25">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl p-7 flex flex-col transition-all hover:border-accent-base/10"
                style={{
                  backgroundColor: tier.highlighted ? "#12121a" : "#12121a",
                  border: tier.highlighted ? "1px solid rgba(var(--accent-base-rgb),0.2)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {tier.highlighted && (
                  <span className="text-[10px] font-medium text-accent-base uppercase tracking-wider mb-3">Most Popular</span>
                )}
                <tier.icon size={20} className="mb-3" style={{ color: tier.highlighted ? "var(--accent-base)" : "rgba(255,255,255,0.3)" }} />
                <h3 className="text-[18px] font-medium text-white mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[32px] font-medium text-white">{tier.price}</span>
                  {tier.period && <span className="text-[12px] text-white/30">{tier.period}</span>}
                </div>
                <p className="text-[12px] text-white/35 mb-6">{tier.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-base)" }} />
                      <span className="text-[12px] text-white/50">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-medium transition-all"
                  style={tier.highlighted
                    ? { backgroundColor: "var(--accent-base)", color: "var(--surface)" }
                    : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  {tier.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-6">Frequently Asked</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
            {[
              { q: "Is the Starter plan really free?", a: "Yes. Single-property hotels can process up to 50 orders/month at no cost. No credit card required. Full ETA compliance included." },
              { q: "How is Professional pricing calculated?", a: "Pricing is per property per month, based on order volume and required features. Contact us for a custom quote tailored to your portfolio." },
              { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time. No penalties, no data loss, no lock-in contracts." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl p-5" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-[13px] font-medium text-white mb-2">{faq.q}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[24px] font-medium mb-4 text-white">Need a Custom Plan?</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">We work with hotel groups of all sizes. Let&apos;s build a plan that fits your portfolio.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
            Contact Sales <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
