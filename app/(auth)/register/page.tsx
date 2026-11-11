import Link from 'next/link';
import { ArrowRight, Building2, Handshake } from 'lucide-react';
import { SiteNav } from '@/components/marketing/site-nav';
import { WorkspaceChoice } from '@/components/v2/workspace-choice';

const workspaces = [
  {
    title: 'Hotels',
    description: 'Bring purchasing together, source supply, and manage approvals across your properties.',
    href: '/hotels/signup',
    action: 'Start hotel registration',
    icon: Building2,
  },
  {
    title: 'Vendors',
    description: 'Present eligible products and respond to hospitality procurement requests.',
    href: '/suppliers/signup',
    action: 'Start vendor registration',
    icon: Handshake,
  },
];

export default async function Register({ searchParams }: { searchParams: Promise<{ choose?: string; reason?: string }> }) {
  const params = await searchParams;
  const choosing = params.choose === '1';
  return (
    <>
      <SiteNav />
      <main className="hv-register-page">
        <section className="hv-register-intro" aria-labelledby="register-title">
          <div className="shell hv-register-intro-inner">
            <div className="hv-register-copy">
              <span className="hv-register-eyebrow">HotelsVendors · Egypt</span>
              <h1 id="register-title">Put the right organization on the right side of the commercial record.</h1>
              <p>Hotels create controlled demand and approvals. Vendors receive only the sourcing work they are eligible to fulfil.</p>
            </div>
            <div className="hv-register-photo" role="img" aria-label="A bright, premium hotel suite overlooking the sea" />
          </div>
        </section>

        <section className="hv-register-options" aria-labelledby="workspace-title">
          <div className="shell">
            <div className="hv-register-section-heading">
              <div>
                <span className="hv-register-eyebrow">Get started</span>
                <h2 id="workspace-title">Choose your operating workspace</h2>
              </div>
              <p>Public registration is limited to the two organizations that create and respond to procurement work.</p>
            </div>
            <div className="hv-register-layer" aria-labelledby="procurement-roles-title">
              <div className="hv-register-layer-heading">
                <span className="hv-register-layer-index">01</span>
                <div><h3 id="procurement-roles-title">Commercial workspaces</h3><p>One protected workflow connects the hotel requirement and the eligible Vendor response.</p></div>
              </div>
              <div className="hv-register-card-grid">
                {choosing ? <WorkspaceChoice reason={params.reason} /> : workspaces.slice(0, 2).map(({ title, description, href, action, icon: Icon }) => (
                  <Link className="card entry-card hv-register-card" href={href} key={title}>
                    <span className="hv-register-icon"><Icon size={21} aria-hidden="true" /></span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <span className="hv-register-action">{action}<ArrowRight size={16} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
