import { Nav } from "@/components/v2/nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (<>
    <JsonLd />
    <Nav />
    <div className="marketing-content">{children}</div>
    <SiteFooter />
  </>);
}
