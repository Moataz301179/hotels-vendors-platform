import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, FileCheck, Shield, Lock, Globe, Mail, CreditCard, CheckCircle2, Fingerprint, Server, Eye } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/compliance") },
  title: "ETA E-Invoicing Compliance Egypt | Zero-Exposure Regulatory Shield | HotelsVendors",
  description: "Full ETA Phase 1 & 2 e-invoicing compliance with RSA-2048 digital signing, UUID tracking, and three-way matching. FRA anti-fraud aligned. Zero penalty exposure.",
  keywords: ["B2B hospitality procurement Egypt", "automated factoring lines Cairo", "hotel supply chain management Egypt", "ETA e-invoicing compliance", "hospitality vendor marketplace", "digital invoice Egypt", "coastal hotel suppliers Red Sea", "تجهيزات الفنادق بالجملة", "منصة المشتريات الفندقية مصر", "الفوترة الإلكترونية هيئة الضرائب"],
  openGraph: {
    title: "ETA E-Invoicing Compliance Egypt | Zero-Exposure Regulatory Shield | HotelsVendors",
    description: "Full ETA Phase 1 & 2 e-invoicing compliance with RSA-2048 digital signing, UUID tracking, and three-way matching. FRA anti-fraud aligned. Zero penalty exposure.",
    type: "website",
  },
};

const complianceAreas = [
  { icon: FileCheck, title: "ETA E-Invoicing", desc: "Full Egyptian Tax Authority Phase 1 & 2 e-invoicing compliance. RSA-2048 digital signing, UUID tracking, real-time submission.", color: "var(--accent-base)" },
  { icon: Shield, title: "FRA Anti-Fraud", desc: "Aligned with Egyptian Financial Regulatory Authority guidelines. Three-way matching gate: PO + ETA UUID + Signed Digital Delivery Note.", color: "var(--accent-base)" },
  { icon: Lock, title: "Data Protection", desc: "GDPR-aligned with encryption at rest and in transit, role-based access controls, and comprehensive audit trails.", color: "#64b5f6" },
  { icon: Fingerprint, title: "ISO/IEC 27001", desc: "Information Security Management alignment. Server-side sanitization proxies and stateless data processing architecture.", color: "var(--orange-base)" },
  { icon: Server, title: "SOC 2 Type II", desc: "Audit-ready posture for enterprise procurement. Independent third-party validation of security, availability, and confidentiality controls.", color: "var(--purple-base)" },
  { icon: Eye, title: "I-Score Readiness", desc: "Clean, real-time risk parameters and repayment velocity metrics fed into corporate credit assessment systems.", color: "var(--orange-base)" },
];

export default function CompliancePage() {
  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Compliance</span>
          <h1 className="text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] mb-5 text-white">
            ETA Phase 1 & 2.<br />SHA-256 Audit Trails.<br />FRA Anti-Fraud.<br /><span className="text-white">Your Compliance<br />Team Can Sleep.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl leading-relaxed mb-8">
            Every transaction on HotelsVendors is cryptographically signed, UUID-tracked, and ETA-submitted in real-time. Three-way matching is automated. Audit trails are immutable. Your compliance team reviews exceptions, not every invoice.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?sector=fintech" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
              Register for Compliance Access <ArrowRight size={14} />
            </Link>
            <Link href="/platform" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              View Platform Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: FileCheck, label: "ETA Phase 1 & 2", desc: "Full e-invoicing" },
              { icon: Shield, label: "FRA Aligned", desc: "Anti-fraud compliance" },
              { icon: Lock, label: "RSA-2048 + SHA-256", desc: "Cryptographic signing" },
              { icon: CheckCircle2, label: "Three-Way Match", desc: "Auto-verified" },
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

      {/* ETA Deep Dive */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-4">
              <FileCheck size={20} style={{ color: "var(--accent-base)" }} />
              <div>
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Primary Engine</span>
                <h2 className="text-[18px] font-medium text-white">ETA E-Invoicing Compliance</h2>
              </div>
            </div>
            <p className="text-[13px] text-white/40 max-w-2xl mb-6">
              Native integration with the Egyptian Tax Authority ensures all invoices meet Phase 1 and Phase 2 requirements. Our system handles document signing, UUID generation, and real-time portal submission automatically — the millisecond goods land on-site.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "RSA-2048-bit digital signing",
                "UUID-based invoice tracking",
                "Real-time ETA portal submission",
                "Phase 1 & 2 full compliance",
                "SHA-256 audit trail hashing",
                "Zero penalty exposure",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-[12px] text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--accent-base)" }} />{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Areas Grid */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Coverage</span>
          <h2 className="text-[20px] font-medium mb-8 text-white">Compliance Areas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceAreas.map((a) => (
              <div key={a.title} className="rounded-2xl p-6 transition-all hover:border-accent-base/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: a.color + "15" }}>
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <h3 className="text-[13px] font-medium mb-2 text-white">{a.title}</h3>
                <p className="text-[11px] text-white/40 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three-Way Matching */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-[16px] font-medium mb-4 text-white">Three-Way Matching Gate</h3>
            <p className="text-[13px] text-white/40 leading-relaxed mb-6">Every invoice must pass three independent verification checkpoints before entering the factoring pool. No exceptions. No manual overrides.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Purchase Order", desc: "Verified against approved budget blockade. Authority matrix confirmed. Department and property validated." },
                { step: "02", title: "ETA UUID", desc: "Cryptographic invoice signature verified. UUID cross-referenced with ETA portal. Real-time submission confirmed." },
                { step: "03", title: "Signed Delivery Note", desc: "Digital Goods Received Note signed by hotel receiving dock. Quantity and condition confirmed. Timestamp immutable." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[10px] font-medium text-white/25 uppercase tracking-wider">Checkpoint {item.step}</span>
                  <h4 className="text-[13px] font-medium text-white mt-1 mb-2">{item.title}</h4>
                  <p className="text-[11px] text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Services Disclaimer */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl p-6" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-[14px] font-medium mb-3 text-white">Financial Services Disclaimer</h3>
            <p className="text-[12px] text-white/40 leading-relaxed mb-3">HotelsVendors (Returants for E-Marketing, CR: 105300900196948) operates as an e-commerce aggregator and technology platform. We do NOT hold a financial services license.</p>
            <ul className="space-y-1.5 text-[11px] text-white/25 mb-3">
              <li>· We do NOT hold client funds or act as a payment intermediary</li>
              <li>· We do NOT approve, underwrite, or guarantee credit facilities</li>
              <li>· We do NOT assume credit risk or default liability</li>
            </ul>
            <p className="text-[11px] text-white/25 leading-relaxed">All factoring, credit lines, and financial facilities are provided exclusively by licensed third-party grantors (OLIV, ValU, CIB Factoring, Fawry). HotelsVendors facilitates document validation, coordination, and compliance auditing only.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Shield size={28} className="mx-auto mb-6" style={{ color: "var(--accent-base)" }} />
          <h2 className="text-[24px] font-medium mb-4 text-white">Compliance-Ready Procurement</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">Every invoice. Every delivery. Every payment. Fully auditable from day one.</p>
          <Link href="/register?sector=fintech" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
