import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CircleDollarSign, PackageCheck, Truck } from "lucide-react";
import { canonicalUrl } from "@/lib/seo";
import "@/components/marketing/public-pages.css";

export const metadata: Metadata = {
  title: "Hotel Procurement Platform in Egypt | HotelsVendors",
  description: "Explore hotel purchasing, supplier discovery, delivery coordination and Market Compass purchasing insights.",
  alternates: { canonical: canonicalUrl("/platform") },
};

const actors = [
  { title: "Hotels", text: "Find suppliers, compare fixed prices and review purchases before ordering.", href: "/register", action: "Choose hotel registration", icon: Building2 },
  { title: "Suppliers", text: "Introduce your catalogue and available quantities to hotel buyers.", href: "/register", action: "Choose supplier registration", icon: PackageCheck },
  { title: "Logistics partners", text: "Discuss delivery coverage and partner participation with our team.", href: "/contact", action: "Discuss logistics access", icon: Truck },
  { title: "Funding partners", text: "Discuss participation and eligibility. Financing remains subject to the partner’s assessment and terms.", href: "/contact", action: "Discuss funding access", icon: CircleDollarSign },
];

export default function PlatformPage() {
  return (
    <div className="hv-public-page hv-platform hv-maintenance-public">
      <section className="hv-maintenance-hero">
        <div className="hv-maintenance-shell hv-maintenance-split">
          <div>
            <span className="hv-maintenance-eyebrow">Platform · Egyptian hospitality</span>
            <h1>One network for hotel purchasing.</h1>
            <p>Discover suppliers, compare purchasing terms and coordinate the work from order review to delivery. HotelsVendors brings hotel buyers, suppliers and partners together without replacing their decisions.</p>
            <div className="hv-maintenance-actions">
              <Link href="/register" className="hv-maintenance-button">Join the network <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/#market-compass" className="hv-maintenance-link">See Market Compass <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
          <aside className="hv-maintenance-example" aria-labelledby="purchasing-example-title">
            <span className="hv-maintenance-eyebrow">Operational entry points</span>
            <h2 id="purchasing-example-title">Start with a real requirement.</h2>
            <p className="hv-maintenance-caption">Use the live catalog when a verified listing exists. If it does not, submit the requirement and the sourcing desk can route an RFQ to eligible suppliers.</p>
            <div className="hv-maintenance-actions">
              <Link href="/marketplace" className="hv-maintenance-button">Open catalog <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/rfq" className="hv-maintenance-link">Request a product <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="hv-maintenance-section" aria-labelledby="participants-title">
        <div className="hv-maintenance-shell">
          <div className="hv-maintenance-section-head">
            <h2 id="participants-title">Choose your part of the network.</h2>
            <p>Hotels and suppliers can create workspaces and transact through the same network. Logistics and funding access is permissioned and activated only after verification.</p>
          </div>
          <div className="hv-maintenance-actor-list">
            {actors.map(({ title, text, href, action, icon: Icon }) => (
              <Link className="hv-maintenance-actor" href={href} key={title}>
                <span className="hv-maintenance-icon"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="hv-maintenance-actor-action">{action} <ArrowUpRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-maintenance-section hv-maintenance-alt" aria-labelledby="compass-title">
        <div className="hv-maintenance-shell hv-maintenance-split">
          <div>
            <h2 id="compass-title">Understand a purchase before the next one.</h2>
            <p>Market Compass helps you review price differences, purchasing volume and delivery exceptions. Check the source and context before deciding what to change.</p>
            <Link href="/marketplace" className="hv-maintenance-link">Browse verified catalog <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/intelligence" className="hv-maintenance-link hv-maintenance-private">Open intelligence workspace <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <ol className="hv-maintenance-principles">
            <li><strong>Compare prices</strong><span>Check whether pack sizes and purchasing terms are comparable.</span></li>
            <li><strong>Review volume</strong><span>Understand what your properties buy before approaching a supplier.</span></li>
            <li><strong>Check delivery</strong><span>Review differences between the order and what was received.</span></li>
            <li><strong>Choose the next action</strong><span>Your team reviews the evidence and makes the decision.</span></li>
          </ol>
        </div>
      </section>

      <section className="hv-maintenance-close">
        <div className="hv-maintenance-shell">
          <h2>Start with your purchasing needs.</h2>
          <Link href="/contact" className="hv-maintenance-button">Talk to the team <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
