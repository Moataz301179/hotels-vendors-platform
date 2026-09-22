import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Building2, Store, Landmark, Truck, BrainCircuit, ShieldCheck, Banknote, FileCheck, MapPin, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/solutions") },
  title: "Hospitality Procurement Solutions Egypt | F&B, Consumables, FF&E Covered | HotelsVendors",
  description: "Tailored B2B procurement solutions for Egyptian hotels, suppliers, factoring companies, and logistics providers. F&B, consumables, guest supplies, FF&E, and services.",
  keywords: ["B2B hospitality procurement Egypt", "hotel procurement solutions Egypt", "F&B suppliers Egypt", "FF&E procurement", "hospitality factoring Egypt", "حلول المشتريات الفندقية مصر", "سلسلة التوريد الفندقية"],
  openGraph: {
    title: "Hospitality Procurement Solutions Egypt | F&B, Consumables, FF&E Covered | HotelsVendors",
    description: "Tailored B2B procurement solutions for Egyptian hotels, suppliers, factoring companies, and logistics providers.",
    type: "website",
  },
};

const solutions = [
  {
    icon: Building2,
    title: "For Hotels & Resorts",
    desc: "AI-automated procurement, budget blockades, ETA compliance, and net-60 factoring — all from one dashboard. Built for Egyptian hospitality groups managing 100-500 room coastal properties.",
    features: ["AI demand forecasting", "Budget blockades", "Multi-property control", "Net-60 factoring", "48-hour delivery"],
    href: "/register?sector=procurement",
    cta: "Register Hotel",
    color: "var(--accent-base)",
  },
  {
    icon: Store,
    title: "For Suppliers & Vendors",
    desc: "Get discovered by Egypt's largest hotel groups. Upload catalogs, receive POs, issue ETA-compliant invoices, and get paid in 24 hours via embedded factoring. Stop chasing payments.",
    features: ["Catalog management", "PO notifications", "ETA invoicing", "24hr payment", "Analytics dashboard"],
    href: "/register?sector=procurement",
    cta: "Become a Supplier",
    color: "var(--accent-base)",
  },
  {
    icon: Landmark,
    title: "For Factoring Companies",
    desc: "Access a curated pool of pre-verified hospitality invoices. Competitive bidding, non-recourse settlement, and bank-direct payment flows. Egypt's hospitality sector is an EGP 12B market.",
    features: ["Pre-verified invoices", "Competitive bidding", "Non-recourse", "Bank-direct settlement", "Risk scoring"],
    href: "/register?sector=cashflow",
    cta: "Register Grantor",
    color: "var(--orange-base)",
  },
  {
    icon: Truck,
    title: "For Logistics Providers",
    desc: "Fill your trucks with consolidated multi-supplier loads. Shared-route optimization, guaranteed volume, and on-time payment. Cover 6 governorates with AI-driven route planning.",
    features: ["Load consolidation", "Route optimization", "Guaranteed volume", "On-time payment", "GPS tracking"],
    href: "/register?sector=procurement",
    cta: "Register Carrier",
    color: "#64b5f6",
  },
];

export default function SolutionsPage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Solutions</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-white">
            One Platform.<br /><span className="text-white">Four Stakeholder Workflows.<br />Infinite Scale.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re a hotel procurement manager, a supplier, a funder, or a carrier — HotelsVendors has a tailored workflow for you. Every role. One operating system.
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: FileCheck, label: "ETA Compliant", desc: "Phase 1 & 2" },
              { icon: ShieldCheck, label: "FRA Aligned", desc: "Anti-fraud" },
              { icon: Banknote, label: "24hr Settlement", desc: "Bank-direct" },
              { icon: MapPin, label: "6 Governorates", desc: "Full coverage" },
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

      {/* Solutions Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 space-y-6">
          {solutions.map((s) => (
            <div key={s.title} className="rounded-2xl p-8 transition-all hover:border-accent-base/10" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <h2 className="text-[20px] font-medium text-white">{s.title}</h2>
                  </div>
                  <p className="text-[14px] text-white/40 leading-relaxed mb-5 max-w-xl">{s.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.features.map((f) => (
                      <span key={f} className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ backgroundColor: s.color + "10", color: s.color }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center lg:justify-end">
                  <Link href={s.href} className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
                    {s.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem Overview */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <BrainCircuit size={32} className="mx-auto mb-6" style={{ color: "var(--accent-base)" }} />
          <h2 className="text-[24px] font-medium mb-4 text-white">The Full Picture</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-xl mx-auto">
            All four stakeholders connect on one platform. Hotels order, suppliers fulfill, funders finance, and carriers deliver — with AI orchestrating every step.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Building2, label: "Hotels", color: "var(--accent-base)" },
              { icon: Store, label: "Suppliers", color: "var(--accent-base)" },
              { icon: Landmark, label: "Funders", color: "var(--orange-base)" },
              { icon: Truck, label: "Carriers", color: "#64b5f6" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-4 transition-all hover:border-accent-base/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <item.icon size={20} className="mx-auto mb-2" style={{ color: item.color }} />
                <p className="text-[12px] font-medium text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <ShieldCheck size={28} className="mx-auto mb-6" style={{ color: "var(--accent-base)" }} />
          <h2 className="text-[24px] font-medium mb-4 text-white">ETA Compliant. FRA Secure.</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">Every transaction on HotelsVendors meets Egyptian Tax Authority e-invoicing requirements and FRA anti-fraud standards.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Get Started <ArrowRight size={14} />
            </Link>
            <Link href="/compliance" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              View Compliance
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
