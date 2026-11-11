import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, Handshake, LineChart, Truck } from "lucide-react";

export const metadata = {
  title: "Contact HOTELSVENDORS",
  description: "Contact HOTELSVENDORS about a hotel workspace, a vendor workspace, a partner enquiry, or an investor conversation.",
};

const routes = [
  { title: "Hotel purchasing", text: "A property or group that wants to specify demand, approve purchases and record receiving.", href: "/register", action: "Start a hotel workspace", icon: Building2 },
  { title: "Vendor supply", text: "A business that wants to respond to hospitality requests allocated to it.", href: "/suppliers/signup", action: "Start a vendor workspace", icon: Handshake },
  { title: "Carrier or funder", text: "A logistics or licensed finance partner. These accounts are provisioned. They are not created from the public form.", href: "mailto:support@hotelsvendors.com", action: "Email partner enquiries", icon: Truck },
  { title: "Investors", text: "A conversation about the operating model. Figures that are not in production are not presented as results.", href: "/investors", action: "Read the briefing", icon: LineChart },
];

export default function ContactPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">Contact</p>
            <h1>Start with the organization that owns the work.</h1>
            <p>HOTELSVENDORS is operated in Egypt for hospitality purchasing. Tell us which side of the record you represent, and use the path that matches it.</p>
            <div className="hv-public-actions">
              <a className="btn btn-blue" href="mailto:support@hotelsvendors.com">support@hotelsvendors.com <ArrowRight size={16} /></a>
              <Link className="hv-public-text-link" href="/about">About the company</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div><h2>Choose the enquiry.</h2></div>
            <p>A workspace request opens setup. A partner or investor enquiry is reviewed by the team. Writing to us does not create an order or a credit line.</p>
          </div>
          <div className="hv-public-actor-list">
            {routes.map(({ title, text, href, action, icon: Icon }) => {
              const inner = (
                <>
                  <span className="hv-public-actor-icon"><Icon size={20} aria-hidden="true" /></span>
                  <span className="hv-public-actor-name">{title}</span>
                  <span className="hv-public-actor-text">{text} {action}.</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </>
              );
              return href.startsWith("mailto:")
                ? <a className="hv-public-actor" href={href} key={title}>{inner}</a>
                : <Link className="hv-public-actor" href={href} key={title}>{inner}</Link>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
