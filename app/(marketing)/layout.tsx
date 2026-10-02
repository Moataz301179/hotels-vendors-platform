import { Nav } from "@/components/v2/nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (<>
    <Nav />
    <div className="marketing-content">{children}</div>
    <SiteFooter />
  </>);
}
