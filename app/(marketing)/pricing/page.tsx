import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import "../../../components/marketing/public-pages.css";
import { Check, ArrowRight, Building2, Store, Landmark, Zap } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/pricing") },
  title: "Enterprise Hospitality Procurement Pricing | HotelsVendors Egypt",
  description: "Understand which platform, supplier, delivery and funding charges to confirm in writing before purchasing through HotelsVendors.",
  keywords: ["B2B hospitality procurement Egypt", "hotel procurement pricing Egypt", "SaaS marketplace Egypt", "ETA document processing fee", "hospitality platform pricing", "تسعير المشتريات الفندقية مصر"],
  openGraph: {
    title: "Enterprise Hospitality Procurement Pricing | HotelsVendors Egypt",
    description: "Confirm platform, supplier, delivery and funding terms before committing to a purchase.",
    type: "website",
  },
};

const tiers = [
  {
    name: "Hotel buyers",
    price: "Confirm terms",
    period: "",
    desc: "Set out your properties and purchasing requirements, then request a written breakdown of applicable charges.",
    features: [
      "Platform charges and billing basis",
      "Supplier price, quantities and tax treatment",
      "Delivery charges and available destinations",
      "Payment schedule and cancellation terms",
      "Features and support included in your agreement",
    ],
    cta: "Discuss buyer requirements",
    highlighted: false,
    icon: Building2,
  },
  {
    name: "Suppliers",
    price: "Confirm terms",
    period: "",
    desc: "Confirm listing requirements and commercial terms before publishing offers or accepting an order.",
    features: [
      "Business verification and listing eligibility",
      "Applicable platform or transaction charges",
      "Who pays each fee and when it is deducted",
      "Delivery responsibilities and order terms",
      "Refunds, cancellations and settlement timing",
    ],
    cta: "Discuss supplier requirements",
    highlighted: false,
    icon: Store,
  },
  {
    name: "Delivery & funding partners",
    price: "Partner terms",
    period: "",
    desc: "External providers confirm their own availability, eligibility and charges. Platform access is not a service approval.",
    features: [
      "Delivery route, capacity and service charges",
      "Funding eligibility and independent approval",
      "Funding fees, deductions and settlement dates",
      "Provider responsibilities and exclusions",
      "Written terms before accepting a service",
    ],
    cta: "Discuss a partnership",
    highlighted: false,
    icon: Landmark,
  },
];

export default function PricingPage() {
  return (
    <div className="hv-maintenance-public">
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <span className="text-[11px] font-medium text-[var(--hv-maintenance-muted)] uppercase tracking-[0.15em] mb-3 block">Pricing</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-[var(--hv-maintenance-ink)]">
            Know the charges.<br />Confirm the terms.
          </h1>
          <p className="text-[15px] text-[var(--hv-maintenance-muted)] max-w-xl mx-auto leading-relaxed">
            Request written confirmation of the platform fee and any supplier, delivery or funding charges before committing. A public price schedule or free-plan entitlement is not confirmed on this page.
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "var(--hv-maintenance-line)", backgroundColor: "var(--hv-maintenance-raised)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Check, label: "Written fee breakdown", desc: "Confirm amount and billing basis" },
              { icon: Zap, label: "Separate provider terms", desc: "Delivery and funding charges may apply" },
              { icon: Building2, label: "Your business requirements", desc: "Confirm what your agreement includes" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "var(--hv-maintenance-blue)" }} />
                <div>
                  <p className="text-[11px] font-medium text-[var(--hv-maintenance-muted)]">{b.label}</p>
                  <p className="text-[9px] text-[var(--hv-maintenance-muted)]">{b.desc}</p>
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
                  backgroundColor: tier.highlighted ? "var(--hv-maintenance-raised)" : "var(--hv-maintenance-raised)",
                  border: tier.highlighted ? "1px solid var(--hv-maintenance-line)" : "1px solid var(--hv-maintenance-line)",
                }}
              >
                <tier.icon size={20} className="mb-3" style={{ color: tier.highlighted ? "var(--hv-maintenance-blue)" : "var(--hv-maintenance-blue)" }} />
                <h3 className="text-[18px] font-medium text-[var(--hv-maintenance-ink)] mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[32px] font-medium text-[var(--hv-maintenance-ink)]">{tier.price}</span>
                  {tier.period && <span className="text-[12px] text-[var(--hv-maintenance-muted)]">{tier.period}</span>}
                </div>
                <p className="text-[12px] text-[var(--hv-maintenance-muted)] mb-6">{tier.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--hv-maintenance-blue)" }} />
                      <span className="text-[12px] text-[var(--hv-maintenance-muted)]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-medium transition-all"
                  style={tier.highlighted
                    ? { backgroundColor: "var(--hv-maintenance-blue)", color: "#ffffff" }
                    : { border: "1px solid var(--hv-maintenance-line)", color: "var(--hv-maintenance-ink)" }
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
      <section className="py-16" style={{ backgroundColor: "var(--hv-maintenance-raised)" }}>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[11px] font-medium text-[var(--hv-maintenance-muted)] uppercase tracking-[0.15em] mb-6">Frequently Asked</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
            {[
              { q: "What fees should I check?", a: "Ask about the platform or transaction fee, supplier taxes, delivery charges and optional funding costs. Confirm who pays each charge, its billing basis and when it is due." },
              { q: "Is registration a free-plan guarantee?", a: "No published free-plan entitlement is confirmed here. Confirm account and service charges in writing before using a paid service or accepting an order." },
              { q: "Does financing have the same price for every hotel?", a: "No. Independent funders set eligibility, approval and terms for each business. Request their written fee breakdown and repayment or settlement terms separately." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl p-5" style={{ backgroundColor: "var(--hv-maintenance-raised)", border: "1px solid var(--hv-maintenance-line)" }}>
                <h3 className="text-[13px] font-medium text-[var(--hv-maintenance-ink)] mb-2">{faq.q}</h3>
                <p className="text-[12px] text-[var(--hv-maintenance-muted)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[24px] font-medium mb-4 text-[var(--hv-maintenance-ink)]">Get terms for your business.</h2>
          <p className="text-[13px] text-[var(--hv-maintenance-muted)] mb-8 max-w-lg mx-auto">Share your business role, properties or product categories and the services you want to discuss.</p>
          <Link href="/contact" className="hv-maintenance-button">
            Discuss charges and terms <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
