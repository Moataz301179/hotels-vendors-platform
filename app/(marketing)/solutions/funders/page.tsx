import Link from "next/link";
import { ArrowRight, FileCheck2, Landmark, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "Independent Funding Partners for Hospitality Procurement",
  "HotelsVendors refers consented operational evidence to independent funders. Underwriting, terms, and disbursement stay with the funder. HotelsVendors is not a lender.",
  "/solutions/funders",
);

const builtToday = [
  {
    icon: FileCheck2,
    title: "Hard-gated funding referrals",
    body: "A supplier can open a referral only after delivery, a recorded payment guarantee, an accepted goods receipt, and an ETA-accepted signed invoice. HotelsVendors still records moneyMoved as false.",
  },
  {
    icon: Landmark,
    title: "Funder workspace for status",
    body: "Assigned funder organizations review the referral packet and record independent outcomes—under review, approved, rejected, disbursed, settled, or defaulted—with an external provider reference when money moves outside the platform.",
  },
  {
    icon: LockKeyhole,
    title: "Consented evidence only",
    body: "Institutional data-sharing feeds require a verified connection and an explicit organization grant. Choosing the funder portal does not enable a live bank or factoring API by itself.",
  },
  {
    icon: Scale,
    title: "Clear decision boundary",
    body: "HotelsVendors is not a lender. It does not underwrite, price credit, hold hotel funds, or disburse supplier payouts. External funders own those decisions and contracts.",
  },
];

const partnerTargets = [
  {
    name: "Oliv Finance",
    status: "Referral partner path",
    body: "Marketing referral CTAs and adapter scaffolding exist for Oliv. Live API keys, webhooks, and production routes are not provisioned in this release. Oliv remains an independent FRA-facing finance partner when credentials and contracts are complete.",
  },
  {
    name: "Institutional funders & banks",
    status: "Gateway designed",
    body: "The funder gateway architecture supports registered adapters and consented snapshots. No institutional connections are registered in production today—the availability probe returns an empty connected set.",
  },
];

export default function FunderSolutionPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell">
          <div className="eyebrow">Finance</div>
          <h1>Independent institutions. Consented evidence.</h1>
          <p>
            HotelsVendors surfaces the procurement record a hotel has already authorized—so an external
            funder can underwrite with context, not with a platform that pretends to be a bank.
            Financing decisions, terms, and disbursement stay with the funder.
          </p>
          <div className="hv-public-actions">
            <Link className="btn btn-blue" href="/funders/portal">
              Open funder portal <ArrowRight size={16} />
            </Link>
            <Link className="hv-public-text-link" href="/contact">
              Partner enquiry
            </Link>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Built today.
                <br />
                <em>Referral, not lending.</em>
              </h2>
            </div>
            <p>
              These workflows are implemented in the funding workspace and APIs. They record evidence and
              partner status. They do not move money inside HotelsVendors.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {builtToday.map(({ icon: Icon, title, body }) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="hv-solution-main">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <span className="hv-solution-result">Available now</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-public-alt-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Who finances.
                <br />
                <em>And what is not live yet.</em>
              </h2>
            </div>
            <p>
              Partner names describe intended integration paths. A name on this page is not a claim that a
              production API session is active.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {partnerTargets.map((partner) => (
              <article className="hv-solution-row" key={partner.name}>
                <span className="hv-public-actor-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </span>
                <div className="hv-solution-main">
                  <h3>{partner.name}</h3>
                  <p>{partner.body}</p>
                </div>
                <span className="hv-solution-result">{partner.status}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell hv-solutions-note">
          <h2>Regulatory honesty</h2>
          <p>
            HotelsVendors operates as a hospitality procurement and digital-marketing network. Factoring,
            lending, and payment processing remain with licensed external parties. FRA licence verification
            and signed factoring-provider contracts are owner-controlled release gates—not assumed by this
            page.
          </p>
          <div className="hv-public-actions" style={{ marginTop: 24 }}>
            <Link className="hv-public-text-link" href="/security-overview">
              Understand access boundaries <ArrowRight size={16} />
            </Link>
            <Link className="hv-public-text-link" href="/investors">
              Investors overview <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="hv-public-close">
        <div className="shell">
          <div>
            <h2>Engage as an independent finance partner.</h2>
            <p>
              Funder organizations are onboarded through controlled partner review. Once connected, they
              work from consented packets—never from fabricated eligibility or invented credit balances.
            </p>
          </div>
          <Link className="btn btn-blue" href="/contact">
            Request partner review <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
