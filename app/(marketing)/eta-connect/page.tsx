import Link from "next/link";
import { ShieldCheck, ArrowRight, FileText, TrendingUp, CheckCircle2, Zap } from "lucide-react";
import { RegulatoryConnectionNotice } from "@/components/v2/regulatory-connection-notice";

export const metadata = {
  title: "Connect ETA E-Invoices | HOTELSVENDORS",
  description: "Prepare an organization-authorized Egyptian Tax Authority e-invoicing connection and retain clear control over invoice evidence.",
};

const steps = [
  {
    step: "01",
    title: "Authorize the organization",
    description: "Start with the organization that owns the taxpayer credentials and authorization. The issuer's e-seal belongs to the party that signs the vendor invoice — a hotel buyer needs authorized ingest, not an issuer e-seal. HotelsVendors records the request and never treats it as a live ETA connection until those controls have been verified.",
    icon: ShieldCheck,
  },
  {
    step: "02",
    title: "Verify the source before analysis",
    description: "Only an authorized and verified source can be accepted for organization-scoped analysis. Source status remains visible so an intake record is never confused with a connected feed.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Review commercial evidence",
    description: "Authorized teams review recorded invoice evidence, terms and delivery information before using it in a procurement decision. No inferred invoice status or automatic commercial action.",
    icon: TrendingUp,
  },
  {
    step: "04",
    title: "Use controlled procurement workflows",
    description: "A verified source can inform controlled sourcing, approvals and receiving evidence. It does not automatically create an award, credit decision or payment commitment.",
    icon: Zap,
  },
];

export default function EtaConnectPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell">
          <span className="eyebrow">Organization-authorized e-invoicing</span>
          <h1>Prepare your ETA connection with <em>clear control.</em></h1>
          <p className="lead">Bring the right organization authorization into a controlled workflow. A hotel buyer needs authorized invoice ingest; the issuer&rsquo;s e-seal belongs to the vendor that signs the invoice. A recorded intake request is not presented as an active Egyptian Tax Authority connection.</p>
          <div className="hv-public-actions">
            <Link href="/login?redirect_url=%2Feta-compliance" className="btn btn-blue">Open organization controls <ArrowRight size={16} /></Link>
            <Link href="/solutions" className="btn btn-ghost">Learn more</Link>
          </div>
        </div>
      </section>

      <section className="hv-public-section bg-surface-raised">
        <div className="shell">
          <RegulatoryConnectionNotice />
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Four steps from invoice to savings</h2>
          </div>
          <div className="eta-ui">
            <div className="eta-ui-head">
              <span className="eta-ui-dots"><i /><i /><i /></span>
              <span className="eta-ui-title">Organization ETA controls</span>
              <span className="eta-ui-badge">INTAKE RECORDED</span>
            </div>
            <div className="eta-ui-body">
              {steps.map((s, index) => (
                <div className={`eta-ui-step${index < 2 ? " is-done" : ""}`} key={s.step}>
                  <div className="eta-ui-node"><s.icon size={15} aria-hidden="true" /></div>
                  {index < steps.length - 1 && <span className="eta-ui-rail" aria-hidden="true" />}
                  <div className="eta-ui-content">
                    <div className="eta-ui-row">
                      <h3>{s.title}</h3>
                      <span className="eta-ui-chip">{index < 2 ? "Verified" : "Pending"}</span>
                    </div>
                    <p>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="eta-ui-foot">
              <span>Organization-scoped &middot; never described as a live connection until verified</span>
              <Link href="/login?redirect_url=%2Feta-compliance" className="btn btn-blue">Open controls <ArrowRight size={15} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-section bg-surface-raised">
        <div className="shell">
          <div className="hv-public-section-heading">
            <p className="eyebrow">What you get</p>
            <h2>Organization-scoped evidence, once it is verified</h2>
          </div>
          <div className="eta-ui">
            <div className="eta-ui-head">
              <span className="eta-ui-dots"><i /><i /><i /></span>
              <span className="eta-ui-title">Organization evidence record</span>
              <span className="eta-ui-badge">3 STATES</span>
            </div>
            <div className="eta-ui-states">
              {[
                { icon: CheckCircle2, title: 'Controlled intake', chip: 'Recorded', body: 'Keep the organization, authorization and source record visible before any analysis begins. A hotel buyer needs authorized ingest; the issuer’s e-seal belongs to the vendor that signs the invoice.' },
                { icon: TrendingUp, title: 'Reviewable analysis', chip: 'Reviewable', body: 'Use verified commercial evidence in a reviewable workflow, not an opaque automatic decision.' },
                { icon: ShieldCheck, title: 'Controlled sourcing', chip: 'Authorized', body: 'Move from validated evidence to authorized RFQs, approvals and receiving records with an audit trail.' },
              ].map(({ icon: Icon, title, chip, body }) => (
                <div className="eta-ui-state" key={title}>
                  <div className="eta-ui-state-top">
                    <span className="eta-ui-state-icon"><Icon size={15} aria-hidden="true" /></span>
                    <span className="eta-ui-chip is-done">{chip}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell text-center max-w-2xl mx-auto">
          <p className="eyebrow">Privacy</p>
          <h2 className="text-2xl font-semibold mt-2">Your data never leaves your organization.</h2>
          <p className="text-foreground-muted mt-3">Your organization controls whether an authorized source is submitted for review. Until activation has been verified for that organization, HotelsVendors does not describe it as a live ETA connection.</p>
          <Link href="/login?redirect_url=%2Feta-compliance" className="btn btn-blue mt-6 inline-flex items-center gap-2">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
