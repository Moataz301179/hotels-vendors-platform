import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  ShieldCheck,
  Clock,
  TrendingUp,
  FileCheck,
  Check,
  Zap,
  Receipt,
  Building2,
  Star,
} from "lucide-react";
import { InvoNav } from "@/components/invo/invo-nav";
import { InvoFooter } from "@/components/invo/invo-footer";

export const metadata: Metadata = {
  title: "INVO — Supplier Growth & Liquidity Platform",
  description:
    "List on INVO. Get paid faster. Access invoice factoring with zero default risk. Monthly subscription for verified suppliers on Egypt's largest hospitality procurement network.",
};

const STATS = [
  { value: "100+", label: "Suppliers Listed", icon: Building2 },
  { value: "1-2%", label: "Service Fee", icon: Receipt },
  { value: "24hr", label: "Settlement", icon: Clock },
  { value: "0%", label: "Default Risk", icon: ShieldCheck },
];

const FEATURES = [
  {
    icon: Banknote,
    title: "Fast Monthly Liquidity",
    desc: "Subscribe once. Get paid in 24 hours on every invoice. No chasing hotels, no 60-day waits. Your cash flow becomes predictable.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Default Risk",
    desc: "Non-recourse factoring. If the hotel doesn't pay, that's our problem — not yours. We take the credit risk so you don't have to.",
  },
  {
    icon: TrendingUp,
    title: "Reach Every Hotel",
    desc: "Your products visible to every hotel on HotelsVendors. One listing, 52+ properties. No cold calls, no chasing procurement managers.",
  },
  {
    icon: FileCheck,
    title: "ETA Compliance Built-In",
    desc: "Every invoice digitally signed and submitted to the Egyptian Tax Authority automatically. Zero manual work from your side.",
  },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Subscribe & List",
    desc: "Pick a tier, pay a flat monthly fee. Your catalog goes live to every hotel on the network. No commission, no hidden costs.",
  },
  {
    num: "02",
    title: "Sell & Invoice",
    desc: "Hotels order from your catalog. Invoices are ETA-compliant automatically. You focus on delivery, we handle the paperwork.",
  },
  {
    num: "03",
    title: "Get Paid in 24 Hours",
    desc: "Choose factoring on any invoice. We pay you within 24 hours. The hotel pays us later. You get liquidity, we take the risk.",
  },
  {
    num: "04",
    title: "Grow Predictably",
    desc: "Monthly subscription = predictable costs. Service fee only on factored invoices. Your margins are yours to keep.",
  },
];

const PRICING = [
  {
    tier: "Starter",
    price: "500",
    period: "/month",
    desc: "For suppliers starting out on the network",
    features: [
      "List up to 50 SKUs",
      "Access to all hotels",
      "ETA-compliant invoicing",
      "24hr factoring settlement",
      "Email support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    tier: "Growth",
    price: "1,500",
    period: "/month",
    desc: "For active suppliers scaling their reach",
    features: [
      "Unlimited SKUs",
      "Priority listing placement",
      "Dedicated account manager",
      "API access for catalog sync",
      "Same-day factoring settlement",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    tier: "Professional",
    price: "3,000",
    period: "/month",
    desc: "For established suppliers with high volume",
    features: [
      "Everything in Growth",
      "Custom pricing negotiations",
      "White-glove onboarding",
      "Priority factoring rates",
      "Quarterly business reviews",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function InvoPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <InvoNav />

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-24 overflow-hidden hero-glow-gold">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-orange-base/[0.04] rounded-full blur-[150px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-base/15 bg-orange-base/4 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-base animate-pulse" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-orange-base">
                Supplier Growth Platform
              </span>
            </div>

            <h1 className="text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-white font-medium">
              List Once. Get Paid Fast.
              <span className="block text-orange-base">Grow Predictably.</span>
            </h1>

            <p className="mt-6 text-[16px] text-white/45 leading-relaxed max-w-lg">
              INVO is the financial layer for suppliers on Egypt&apos;s largest hospitality
              procurement network. A flat monthly subscription gets you listed. A small
              service fee on factored invoices gets you paid in 24 hours. No commission.
              No hidden costs. No default risk.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-orange-base text-black text-[15px] font-medium rounded-xl hover:bg-orange-light transition-all hover:shadow-[0_0_30px_rgba(var(--orange-base-rgb),0.2)]"
              >
                Subscribe Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-4 text-[14px] font-medium text-white/50 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                How It Works
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-[13px] text-white/30">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-orange-base" />
                No commission
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-orange-base" />
                24hr settlement
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-orange-base" />
                Zero default risk
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-white/[0.04]">
        <div className="stat-strip max-w-5xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="stat-strip-item">
              <s.icon className="w-5 h-5 text-orange-base/30 mx-auto mb-2" />
              <div className="stat-strip-value">{s.value}</div>
              <div className="stat-strip-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="label-upper mb-4">Why INVO</p>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-white">
              Procurement under one slate.
              <br />
              <span className="text-orange-base">Your growth, simplified.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface-card p-7 hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-base/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-start gap-5">
                  <div className="w-11 h-11 rounded-xl bg-orange-base/8 border border-orange-base/12 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5 text-orange-base" />
                  </div>
                  <div>
                    <h3 className="text-[17px] text-white mb-2 tracking-tight font-medium">{f.title}</h3>
                    <p className="text-[14px] text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="label-upper mb-4">How It Works</p>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-white">
              Four steps to
              <br />
              <span className="text-orange-base">predictable cash flow.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.num} className="surface-card p-6 hover-lift">
                <div className="text-[36px] font-medium text-orange-base/15 leading-none mb-4">
                  {step.num}
                </div>
                <h3 className="text-[16px] text-white mb-2 tracking-tight font-medium">{step.title}</h3>
                <p className="text-[13px] text-white/35 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PRICING */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="label-upper mb-4">Pricing</p>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-white">
              Flat monthly fee.
              <br />
              <span className="text-orange-base">No commission. Ever.</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/35 max-w-lg mx-auto">
              Pay a fixed monthly subscription to be listed. When you use factoring,
              a small service fee (1-2%) is deducted from the invoice amount. That&apos;s it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PRICING.map((p) => (
              <div
                key={p.tier}
                className={`surface-card p-7 flex flex-col hover-lift ${
                  p.featured ? "border-orange-base/20" : ""
                }`}
              >
                {p.featured && (
                  <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-orange-base mb-3">
                    Most Popular
                  </div>
                )}
                <h3 className="text-[18px] text-white tracking-tight font-medium">{p.tier}</h3>
                <div className="mt-4 mb-1">
                  <span className="text-[32px] text-white tracking-tight font-medium">EGP {p.price}</span>
                  <span className="text-[14px] text-white/30">{p.period}</span>
                </div>
                <p className="text-[13px] text-white/30 mb-6">{p.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-[13px] text-white/50">
                      <Check className="w-4 h-4 text-orange-base shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl text-[14px] font-medium transition-all ${
                    p.featured
                      ? "bg-orange-base text-black hover:bg-orange-light hover:shadow-[0_0_30px_rgba(var(--orange-base-rgb),0.2)]"
                      : "border border-white/[0.08] text-white/50 hover:bg-white/[0.04]"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Receipt className="w-4 h-4 text-orange-base" />
              <span className="text-[13px] text-white/40">
                Factoring service fee: <span className="text-orange-base font-medium">1-2%</span> of invoice value — only when you use it
              </span>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-white font-medium">
            Ready to stop chasing
            <br />
            <span className="text-orange-base">payments?</span>
          </h2>
          <p className="mt-5 text-[16px] text-white/35 leading-relaxed mb-10 max-w-lg mx-auto">
            30 days free. No credit card. List your catalog, access every hotel,
            and see why Egypt&apos;s top suppliers are moving to INVO.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-base text-black text-[15px] font-medium rounded-xl hover:bg-orange-light transition-all hover:shadow-[0_0_30px_rgba(var(--orange-base-rgb),0.2)]"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-4 text-[14px] font-medium text-white/40 border border-white/[0.08] rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Back to HotelsVendors
            </Link>
          </div>
        </div>
      </section>

      <InvoFooter />
    </div>
  );
}
