"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

const platformLinks = [
  { label: "Platform overview", href: "/platform" },
  { label: "Procurement network", href: "/marketplace" },
  { label: "Solutions", href: "/solutions" },
];

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Join the network", href: "/register" },
];

export function SiteFooter() {
  return (
    <footer className="hv-site-footer">
      <div className="hv-site-footer-inner">
        <div className="hv-footer-brand">
          <div className="hv-footer-logo" dir="ltr">
            <BrandLogo variant="light" size="md" showText={false} />
            <span>HotelsVendors</span>
          </div>
          <p>
            Your Virtual Shadow for smarter procurement — connecting Hotels,
            Suppliers, Carriers and Funders around evidence, action and measurable outcomes.
          </p>
        </div>
        <div>
          <h3>Platform</h3>
          <nav aria-label="Platform links">
            {platformLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
        </div>
        <div>
          <h3>Account</h3>
          <nav aria-label="Account links">
            {accountLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </div>
      <div className="hv-footer-bottom">
        <span>© {new Date().getFullYear()} HotelsVendors. Evidence over assumptions.</span>
        <span>Financing decisions remain with external funders.</span>
      </div>
    </footer>
  );
}
