import { AppHeader } from "@/components/v2/app-header";
import { Side } from "@/components/v2/side";
import { SiteFooter } from "@/components/marketing/site-footer";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="side-layout">
        <Side />
        <main className="app-body">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
