import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, ClipboardCheck, ShieldCheck, Truck } from "lucide-react";

export const metadata = {
  title: "About HOTELSVENDORS",
  description: "HOTELSVENDORS is the hospitality procurement network for hotels, vendors, carriers and external funders in Egypt.",
};

const roles = [
  { title: "Hotels", text: "Frame a requirement, keep approval inside the property, and record what was actually received.", href: "/solutions/hotels", icon: Building2 },
  { title: "Vendors", text: "Publish a reviewed specification, then respond only to requests allocated to the business.", href: "/solutions/suppliers", icon: ClipboardCheck },
  { title: "Carriers", text: "See the assigned movement and record the handoff. Another organization's commercial terms stay closed.", href: "/solutions/carriers", icon: Truck },
  { title: "External funders", text: "Review evidence a hotel has released. The funding decision, terms and disbursement stay with the funder.", href: "/solutions/funders", icon: ShieldCheck },
];

const sequence = [
  ["01", "Specify", "A hotel selects a reviewed specification and a quantity. The public catalogue does not show a vendor, a price, or stock."],
  ["02", "Request", "The hotel list becomes a sealed request. Vendors see only the work allocated to them."],
  ["03", "Approve", "A purchase record exists after the hotel's own authority check and a recorded payment guarantee."],
  ["04", "Receive", "Goods receipt is recorded against the order. HOVIN is the field companion for that check."],
  ["05", "Settle", "An external funder can be referred only after delivery, the guarantee, an accepted receipt, and an accepted invoice."],
];

export default function AboutPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">About HOTELSVENDORS</p>
            <h1>The operating record for hotel supply.</h1>
            <p>HOTELSVENDORS is an Egyptian hospitality procurement network. It connects a hotel requirement to the vendor, carrier and funder actions that are actually authorized, and it keeps a record of each handoff.</p>
            <div className="hv-public-actions">
              <Link className="btn btn-blue" href="/register">Open a workspace <ArrowRight size={16} /></Link>
              <Link className="hv-public-text-link" href="/marketplace">Review the catalogue</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div><h2>One record.<br /><em>Four responsibilities.</em></h2></div>
            <p>Purchasing breaks when the requirement, the terms and the receipt live in different messages. Each participant owns a different handoff on the same order.</p>
          </div>
          <div className="hv-public-actor-list">
            {roles.map(({ title, text, href, icon: Icon }) => (
              <Link className="hv-public-actor" href={href} key={title}>
                <span className="hv-public-actor-icon"><Icon size={20} aria-hidden="true" /></span>
                <span className="hv-public-actor-name">{title}</span>
                <span className="hv-public-actor-text">{text}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="hv-public-alt-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div><h2>Five steps.<br /><em>One commercial record.</em></h2></div>
            <p>A directory row is not an order. An order is created only after the hotel approves a verified response.</p>
          </div>
          <div className="hv-platform-principles">
            {sequence.map(([index, title, body]) => (
              <div key={index}><span>{index}</span><strong>{title}</strong><p>{body}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="hv-public-close">
        <div className="shell">
          <div>
            <h2>Founded for hospitality operations.</h2>
            <p>Moataz A. Ghani built HOTELSVENDORS around the work a property already does: specify the need, assign the authority, and prove what arrived. The company does not lend, hold hotel funds, or publish a binding public offer.</p>
          </div>
          <Link className="btn btn-blue" href="/contact">Talk to the team <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
