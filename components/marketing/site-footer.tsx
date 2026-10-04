import Link from "next/link";
import { Brand } from "@/components/v2/brand";

const platformLinks = [
  { label: "Platform overview", href: "/platform" },
  { label: "Procurement network", href: "/marketplace" },
  { label: "Virtual Shadow", href: "/intelligence" },
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
          <Link href="/" className="hv-footer-logo" aria-label="HotelsVendors home">
            <Brand />
          </Link>
          <p>A connected commercial network for hospitality. Virtual Shadow surfaces evidence-backed signals; each organization keeps control of its workflows, permissions and decisions.</p>
        </div>
        <div><h3>EXPLORE</h3><nav aria-label="Platform links">{platformLinks.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
        <div><h3>YOUR ACCOUNT</h3><nav aria-label="Account links">{accountLinks.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav></div>
      </div>
      <div className="hv-footer-bottom"><span>© {new Date().getFullYear()} HotelsVendors. Evidence over assumptions.</span><span>Financing decisions remain with external funders.</span></div>
    </footer>
  );
}
