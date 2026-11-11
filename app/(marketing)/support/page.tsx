import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Support | HOTELSVENDORS",
  description: "How to open a HotelsVendors workspace, finish organization setup, and get help with access.",
};

const paths = [
  ["Create the right workspace", "Use Join the network and choose Hotel or Vendor. Carrier and funder access is provisioned by HOTELSVENDORS. It is not a public sign-up.", "Open the choice", "/register"],
  ["Finish organization setup", "After sign-up, the next screen is the organization profile. Submit the legal name, tax registration, city and governorate. Purchasing stays closed until that profile is verified.", "See the setup path", "/getting-started"],
  ["Return to an existing account", "Sign in with the same email. If the browser is already signed in, choose Open workspace. Do not create a second account for the same organization.", "Sign in", "/login?redirect_url=%2Fauth%2Fcontinue"],
  ["Use the catalogue", "The public catalogue is a specification list. Add quantities to the hotel list, then continue inside the hotel workspace. Prices, stock and vendor names are not shown there.", "Open the catalogue", "/marketplace"],
];

export default function SupportPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">Support</p>
            <h1>Get into the workspace, then stay on the record.</h1>
            <p>Support covers access, organization setup and where a task lives. It does not change an approval, a price, or another organization's data.</p>
            <div className="hv-public-actions">
              <Link className="btn btn-blue" href="/login?redirect_url=%2Fauth%2Fcontinue">Open workspace <ArrowRight size={16} /></Link>
              <a className="hv-public-text-link" href="mailto:support@hotelsvendors.com">Email support@hotelsvendors.com</a>
            </div>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div><h2>The usual paths.</h2></div>
            <p>Start with the step that matches where the account stopped. A second sign-up does not repair an account that already exists.</p>
          </div>
          <div className="hv-solution-ledger">
            {paths.map(([title, body, action, href]) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon" aria-hidden="true">→</span>
                <div className="hv-solution-main"><h3>{title}</h3><p>{body}</p></div>
                <div><Link className="hv-public-text-link" href={href}>{action} <ArrowRight size={15} aria-hidden="true" /></Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="hv-public-close">
        <div className="shell">
          <div>
            <h2>What to include in a support email.</h2>
            <p>Send the workspace email, whether the organization is a hotel or a vendor, and the page you were on. Do not send passwords, payment credentials, or another company's commercial terms.</p>
          </div>
          <Link className="btn btn-blue" href="/contact">Contact the team <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
