import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Banknote, Clock, Shield, TrendingUp, Check, Landmark, FileCheck, BarChart3, Users } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/factoring-service") },
  title: "Embedded Reverse Factoring for Hotels | Bank-Direct IBAN Settlement Egypt | HotelsVendors",
  description: "Hotel-initiated reverse factoring with competitive bidding among 4+ licensed grantors. Bank-direct IBAN settlement, suppliers paid in 24 hours, non-recourse by design.",
  keywords: ["B2B hospitality procurement Egypt", "automated factoring lines Cairo", "hotel supply chain management Egypt", "ETA e-invoicing compliance", "hospitality vendor marketplace", "digital invoice Egypt", "coastal hotel suppliers Red Sea", "تجهيزات الفنادق بالجملة", "منصة المشتريات الفندقية مصر", "الفوترة الإلكترونية هيئة الضرائب"],
  openGraph: {
    title: "Embedded Reverse Factoring for Hotels | Bank-Direct IBAN Settlement Egypt | HotelsVendors",
    description: "Hotel-initiated reverse factoring with competitive bidding among 4+ licensed grantors. Bank-direct IBAN settlement, suppliers paid in 24 hours, non-recourse by design.",
    type: "website",
  },
};

const flow = [
  { step: "01", title: "Invoice Cleared", desc: "Three-way match: PO + ETA UUID + Signed Digital Delivery Note verified automatically. No manual reconciliation.", icon: Check },
  { step: "02", title: "Enter Factoring Pool", desc: "Pre-cleared invoice enters competitive bidding pool visible to all licensed grantors. Full transparency.", icon: TrendingUp },
  { step: "03", title: "Grantors Bid", desc: "4+ licensed grantors compete on rate. Best offer selected automatically. Market-driven pricing every time.", icon: Banknote },
  { step: "04", title: "Settlement", desc: "Supplier paid in 24 hours via bank-direct transfer. Hotel settles at net-60. Zero recourse risk.", icon: Clock },
];

const funderFeatures = [
  { icon: FileCheck, title: "Pre-Verified Invoice Pool", desc: "Every invoice has passed three-way matching: PO + ETA UUID + Signed Digital Delivery Note. You buy cleared assets, not paper promises." },
  { icon: BarChart3, title: "Risk Scoring Engine", desc: "AI-driven risk scoring on every invoice. Hotel creditworthiness, repayment velocity, and sector concentration metrics in real-time." },
  { icon: TrendingUp, title: "Competitive Bidding", desc: "Bid on invoice pools with full visibility into competing rates. Transparent, fair, and optimized for your return targets." },
  { icon: Banknote, title: "24-Hour Settlement", desc: "Bank-direct settlement to supplier IBANs. Automated interest accrual and late repayment protocols. No intermediary accounts." },
  { icon: Shield, title: "Non-Recourse by Design", desc: "Once settled, the invoice is your risk — not the hotel&apos;s. Clean balance-sheet treatment for all parties." },
  { icon: Landmark, title: "$12B Market Access", desc: "Egypt&apos;s hospitality sector is a $12B industry with 480+ properties on our pipeline. High-velocity corporate deal flow." },
];

export default function FactoringServicePage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,126,26,0.04) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Factoring</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-white">
            Pre-Verified Hospitality<br />Invoices. Bank-Direct<br />Settlement. <span className="text-white">Non-Recourse<br />by Design.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl leading-relaxed mb-8">
            Access a curated pool of pre-cleared, three-way-matched invoices from Egypt&apos;s coastal hotel sector. Competitive bidding. 24-hour settlement. Zero paper chase. Built for licensed grantors who want corporate deal flow without SME risk.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?sector=cashflow" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Register as Grantor <ArrowRight size={14} />
            </Link>
            <Link href="/platform" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: "Non-Recourse", desc: "Clean risk transfer" },
              { icon: Banknote, label: "Bank-Direct Settlement", desc: "No intermediary accounts" },
              { icon: FileCheck, label: "Three-Way Matched", desc: "Pre-cleared invoices" },
              { icon: Clock, label: "24-Hour Payment", desc: "Programmatic settlement" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "var(--orange-base)" }} />
                <div>
                  <p className="text-[11px] font-medium text-white/60">{b.label}</p>
                  <p className="text-[9px] text-white/25">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-8 text-center">The Factoring Flow</h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {flow.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(255,126,26,0.1)" }}>
                  <item.icon size={20} style={{ color: "var(--orange-base)" }} />
                </div>
                <span className="text-[10px] font-medium text-white/25 uppercase tracking-wider">Step {item.step}</span>
                <h3 className="text-[13px] font-medium text-white mt-1 mb-1.5">{item.title}</h3>
                <p className="text-[11px] text-white/30 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funder Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-8">Why Funders Choose HotelsVendors</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {funderFeatures.map((f) => (
              <div key={f.title} className="rounded-xl p-6 transition-all hover:border-orange-base/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <f.icon size={20} className="mb-3" style={{ color: "var(--orange-base)" }} />
                <h3 className="text-[14px] font-medium text-white mb-2">{f.title}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Oliv Partner Section */}
      <section className="py-16 border-y" style={{ borderColor: "rgba(var(--success-rgb),0.18)" }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(var(--success-rgb),0.22)", backgroundColor: "rgba(var(--success-rgb),0.06)" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4" style={{ borderColor: "rgba(var(--success-rgb),0.33)", backgroundColor: "rgba(var(--success-rgb),0.10)" }}>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--success)" }}>Oliv Partnership</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">Supplier Invoice Financing</h2>
            <p className="text-[13px] text-white/40 max-w-lg mx-auto mb-6">
              HotelsVendors partners with Oliv — Egypt&apos;s first FRA-licensed digital factoring platform — to give suppliers instant access to working capital against verified invoices.
            </p>
            <Link href="/financing/oliv" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(var(--success-rgb),0.2)]" style={{ backgroundColor: "var(--success)", color: "#ffffff" }}>
              Learn More <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Users size={28} className="mx-auto mb-6" style={{ color: "var(--orange-base)" }} />
          <h2 className="text-[24px] font-medium mb-4 text-white">Access Egypt&apos;s Hospitality Invoice Market</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">4+ licensed grantors already bidding on pre-verified invoices. High-velocity corporate deal flow with cryptographic verification.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register?sector=cashflow" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Register as Grantor <ArrowRight size={14} />
            </Link>
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Register Your Hotel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
