import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Privacy | HOTELSVENDORS",
  description: "How HOTELSVENDORS separates public catalogue information from organization purchasing records.",
};

const sections = [
  ["Public pages", "The catalogue, company pages and sign-in screens are public. A catalogue row shows a specification. It does not show a vendor name, a source address, a price, stock, or a binding offer."],
  ["Workspace records", "Requirements, quotes, approvals, invoices and receipts belong to the organization that created them. Another hotel, vendor, carrier or funder does not receive that record unless the workflow assigns them a specific handoff."],
  ["Account data", "Sign-in is handled by Clerk. The workspace stores the verified email, the organization profile submitted during setup, and the role required to authorize an action. A new public account stays pending until an administrator verifies it."],
  ["What is not sold", "HOTELSVENDORS does not sell organization purchasing records, and it does not publish a hotel's commercial terms on the public site. Support email should not include passwords or another company's terms."],
];

export default function PrivacyPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">Privacy</p>
            <h1>Organization records stay with the organization.</h1>
            <p>Public discovery and a signed-in workspace are different surfaces. Seeing a specification does not grant access to another company's purchasing record.</p>
            <div className="hv-public-actions">
              <Link className="btn btn-blue" href="/security-overview">Review access boundaries <ArrowRight size={16} /></Link>
              <a className="hv-public-text-link" href="mailto:support@hotelsvendors.com">Ask a privacy question</a>
            </div>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div><h2>What each surface holds.</h2></div>
            <p>This page describes the product boundary. It is not a certification, and it does not replace the access rules enforced on each workspace action.</p>
          </div>
          <div className="hv-solution-ledger">
            {sections.map(([title, body]) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon" aria-hidden="true">→</span>
                <div className="hv-solution-main"><h3>{title}</h3><p>{body}</p></div>
                <div />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
