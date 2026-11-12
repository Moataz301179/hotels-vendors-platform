import { AppHeader } from "@/components/v2/app-header";
import { Side } from "@/components/v2/side";
import { getActor, getOnboardingActor } from '@/lib/v2-auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const actor = await getActor() ?? await getOnboardingActor();
  return (
    <div className="app-shell">
      <AppHeader role={actor?.platformRole ?? ''} />
      <div className="side-layout">
        <Side role={actor?.platformRole ?? ''} />
        <main className="app-body">{children}</main>
      </div>
    </div>
  );
}
