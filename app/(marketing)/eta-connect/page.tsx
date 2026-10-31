import Link from "next/link";
import { ShieldCheck, ArrowRight, FileText, TrendingUp, CheckCircle2, Zap } from "lucide-react";

export const metadata = {
  title: "Connect ETA E-Invoices | HOTELSVENDORS",
  description: "Connect your Egyptian Tax Authority e-invoice feed to unlock AI-powered procurement analysis, spend categorization, and provable savings.",
};

const steps = [
  {
    step: "01",
    title: "Grant read-only access",
    description: "Connect your official ETA e-invoice feed through a guided flow. The connection is read-only — we read the invoices you have already filed with the Tax Authority, and nothing more. No software to install, no firewall changes.",
    icon: ShieldCheck,
  },
  {
    step: "02",
    title: "AI categorizes every line",
    description: "Every invoice line is AI-categorized by department, supplier, and product class. Your entire year of procurement becomes an interactive, drillable spend dashboard.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Prove the savings",
    description: "Every saving is (your current price − market benchmark) × your actual annual quantity, using prices you genuinely paid on government-validated invoices. Check each figure against your own records, line by line.",
    icon: TrendingUp,
  },
  {
    step: "04",
    title: "Source with sealed RFQs",
    description: "Turn proven savings into action. Launch sealed-bid RFQs, run live reverse auctions, and award purchase orders — every action is logged and audited.",
    icon: Zap,
  },
];

export default function EtaConnectPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell">
          <span className="eyebrow">ETA E-Invoice Intelligence</span>
          <h1>Your e-invoice feed <em>is</em> your price list.</h1>
          <p className="lead">Connect your Egyptian Tax Authority e-invoice feed and turn every line item, invoice, and vendor into provable procurement savings. Government-validated data. Your data stays private to you.</p>
          <div className="hv-public-actions">
            <Link href="/login?redirect_url=%2Feta-compliance" className="btn btn-blue">Connect ETA feed <ArrowRight size={16} /></Link>
            <Link href="/solutions" className="btn btn-ghost">Learn more</Link>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Four steps from invoice to savings</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {steps.map((s) => (
              <article key={s.step} className="card p-6">
                <span className="text-3xl font-bold text-accent-base/20">{s.step}</span>
                <s.icon size={24} className="text-accent-base mt-3" />
                <h3 className="text-lg font-semibold mt-3">{s.title}</h3>
                <p className="text-sm text-foreground-muted mt-2">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-public-section bg-surface-raised">
        <div className="shell">
          <div className="hv-public-section-heading">
            <p className="eyebrow">What you get</p>
            <h2>Procurement intelligence from your own data</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <div className="card p-5">
              <CheckCircle2 size={20} className="text-success mb-3" />
              <h3 className="font-semibold">Spend categorization</h3>
              <p className="text-sm text-foreground-muted mt-1">Every line item auto-categorized by department, supplier, and product class — no manual tagging.</p>
            </div>
            <div className="card p-5">
              <CheckCircle2 size={20} className="text-success mb-3" />
              <h3 className="font-semibold">Price benchmarking</h3>
              <p className="text-sm text-foreground-muted mt-1">Compare what you pay against market averages, with provable EGP savings per line item.</p>
            </div>
            <div className="card p-5">
              <CheckCircle2 size={20} className="text-success mb-3" />
              <h3 className="font-semibold">Sealed sourcing</h3>
              <p className="text-sm text-foreground-muted mt-1">Turn savings findings into sealed-bid RFQs and live reverse auctions — no AI awards, every action logged.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell text-center max-w-2xl mx-auto">
          <p className="eyebrow">Privacy</p>
          <h2 className="text-2xl font-semibold mt-2">Your data never leaves your organization.</h2>
          <p className="text-foreground-muted mt-3">We never sell your data or share your cost and vendor information with anyone else. The ETA connection is read-only. You can revoke access at any time.</p>
          <Link href="/login?redirect_url=%2Feta-compliance" className="btn btn-blue mt-6 inline-flex items-center gap-2">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
