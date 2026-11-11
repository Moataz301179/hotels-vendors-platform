import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Terms of use | HOTELSVENDORS",
  description: "The operating terms for using the HOTELSVENDORS hospitality procurement network.",
};

const sections = [
  ["Who may open an account", "A hotel or a vendor may start a public workspace and must submit the organization that will own it. Carrier and funder accounts are provisioned. An administrator, carrier or funder role cannot be self-assigned from the public form."],
  ["The catalogue is not an offer", "A public specification is a description a hotel can request. It is not a price, a stock promise, or a contract. A purchase record exists only after the hotel approves a verified response under its own authority."],
  ["Verification comes first", "A new public account remains pending until an administrator verifies the organization. Pending access can finish setup. It cannot approve a purchase, confirm a vendor response, or record a receipt."],
  ["Money stays with the responsible party", "HOTELSVENDORS does not hold hotel funds, extend credit, or decide a financing payout. A payment guarantee is recorded before approval. An external funder is referred only after delivery, that guarantee, an accepted receipt, and an accepted invoice."],
  ["Each organization is accountable", "The organization that submits a requirement, a quote, a receipt or an invoice is responsible for its accuracy. Access is limited to the role and the record that role is assigned. Sharing a password or another organization's commercial terms is outside these terms."],
];

export default function TermsPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">Terms of use</p>
            <h1>Use the network on the record you are authorized to own.</h1>
            <p>These terms describe how the service operates today. Commercial charges, if any, are confirmed in writing for the organization before activation. They are not implied by a public page.</p>
            <div className="hv-public-actions">
              <Link className="btn btn-blue" href="/register">Open a workspace <ArrowRight size={16} /></Link>
              <Link className="hv-public-text-link" href="/contact">Ask about your organization</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-solution-ledger">
            {sections.map(([title, body], index) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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
