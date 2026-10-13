import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign, Network, ScanSearch, Truck } from "lucide-react";
import { canonicalUrl } from "@/lib/seo";
import "@/components/marketing/public-pages.css";

export const metadata: Metadata = {
  title: "Hotel Procurement Solutions in Egypt | HotelsVendors",
  description: "Explore supplier discovery, purchasing insights, delivery coordination and funding partner participation for Egyptian hospitality.",
  alternates: { canonical: canonicalUrl("/solutions") },
};

const solutions = [
  { href: "/#market-compass", action: "See the public example", title: "Review purchasing costs", text: "Use Market Compass to compare purchasing prices, quantities and delivery exceptions. Check the underlying records before acting.", icon: ScanSearch, result: "Know what to investigate before the next purchase." },
  { href: "/marketplace", action: "Browse supplier listings", title: "Find relevant suppliers", text: "Explore published supplier listings. Confirm available quantity, pack size, delivery and payment terms directly before ordering.", icon: Network, result: "Build a shortlist that fits your hotel’s needs." },
  { href: "/contact", action: "Discuss logistics access", title: "Coordinate delivery", text: "Discuss coverage and partner participation with our team. Delivery arrangements depend on the supplier, route and agreed service.", icon: Truck, result: "Clarify who delivers, where and when." },
  { href: "/contact", action: "Discuss funding access", title: "Explore funding participation", text: "Funding partners assess applications and set their own terms. Ask our team about eligibility and participation before relying on financing.", icon: CircleDollarSign, result: "Understand the conditions before making a commitment." },
];

export default function SolutionsPage() {
  return (
    <div className="hv-public-page hv-solutions hv-maintenance-public">
      <section className="hv-maintenance-hero">
        <div className="hv-maintenance-shell hv-maintenance-hero-copy">
          <span className="hv-maintenance-eyebrow">Solutions · Egyptian hospitality</span>
          <h1>Practical steps for better hotel purchasing.</h1>
          <p>Find suitable suppliers, review purchase costs and clarify delivery and payment terms. Start with the task you need to complete—not another dashboard.</p>
          <div className="hv-maintenance-actions">
            <Link href="/register" className="hv-maintenance-button">Join the network <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/marketplace" className="hv-maintenance-link">Explore supplier listings <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="hv-maintenance-section" aria-labelledby="solutions-title">
        <div className="hv-maintenance-shell">
          <div className="hv-maintenance-section-head">
            <h2 id="solutions-title">Choose your next task.</h2>
            <p>Public examples explain the product before you join. Your organization’s purchasing records remain in the signed-in workspace.</p>
          </div>
          <div className="hv-maintenance-ledger">
            {solutions.map(({ title, text, icon: Icon, result, href, action }) => (
              <article className="hv-maintenance-solution-row" key={title}>
                <span className="hv-maintenance-icon"><Icon size={21} aria-hidden="true" /></span>
                <div className="hv-maintenance-solution-main"><h3>{title}</h3><p>{text}</p></div>
                <div className="hv-maintenance-solution-next">
                  <p>{result}</p>
                  <Link href={href} className="hv-maintenance-link">{action} <ArrowRight size={16} aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-maintenance-section hv-maintenance-alt" aria-labelledby="decisions-title">
        <div className="hv-maintenance-shell hv-maintenance-note">
          <h2 id="decisions-title">Your team keeps the decision.</h2>
          <p>HotelsVendors does not guarantee savings, available inventory, delivery times or financing approval. Suppliers confirm commercial terms, your organization approves its purchases, and external funding partners make their own financing decisions.</p>
          <Link href="/intelligence" className="hv-maintenance-link">Sign in to Market Compass <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
