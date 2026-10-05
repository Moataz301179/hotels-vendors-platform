import Link from 'next/link';
import { ArrowRight, Building2, Handshake, Landmark, Truck } from 'lucide-react';
import { Nav } from '@/components/v2/nav';

const workspaces = [
  {
    title: 'Hotels',
    description: 'Bring purchasing together, source supply, and manage approvals across your properties.',
    href: '/hotels/signup',
    action: 'Start hotel registration',
    icon: Building2,
  },
  {
    title: 'Suppliers',
    description: 'Present eligible products and respond to hospitality procurement requests.',
    href: '/suppliers/signup',
    action: 'Start supplier registration',
    icon: Handshake,
  },
  {
    title: 'Carriers',
    description: 'Access transport assignments and share verified delivery milestones.',
    href: '/carriers/portal',
    action: 'Open carrier portal',
    icon: Truck,
  },
  {
    title: 'Funders',
    description: 'Review shared operational records through a secure partner workspace.',
    href: '/funders/portal',
    action: 'Open funder portal',
    icon: Landmark,
  },
];

export default function Register() {
  return (
    <>
      <Nav />
      <main className="hv-register-page">
        <section className="hv-register-intro" aria-labelledby="register-title">
          <div className="shell hv-register-intro-inner">
            <div className="hv-register-copy">
              <span className="hv-register-eyebrow">HotelsVendors Procurement Network</span>
              <h1 id="register-title">A better way to work across hospitality supply.</h1>
              <p>Choose your organization’s workspace to connect with verified demand, fulfill procurement, and coordinate the next step.</p>
            </div>
            <div className="hv-register-photo" role="img" aria-label="A bright, premium hotel suite overlooking the sea" />
          </div>
        </section>

        <section className="hv-register-options" aria-labelledby="workspace-title">
          <div className="shell">
            <div className="hv-register-section-heading">
              <div>
                <span className="hv-register-eyebrow">Get started</span>
                <h2 id="workspace-title">Start with your role in procurement</h2>
              </div>
              <p>Each workspace has role-specific onboarding and organization-scoped access.</p>
            </div>
            <div className="hv-register-layer" aria-labelledby="procurement-roles-title">
              <div className="hv-register-layer-heading">
                <span className="hv-register-layer-index">01</span>
                <div><h3 id="procurement-roles-title">Procurement workspaces</h3><p>For the buyers and suppliers who create and fulfill purchasing demand.</p></div>
              </div>
              <div className="hv-register-card-grid">
                {workspaces.slice(0, 2).map(({ title, description, href, action, icon: Icon }) => (
                  <Link className="card entry-card hv-register-card" href={href} key={title}>
                    <span className="hv-register-icon"><Icon size={21} aria-hidden="true" /></span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <span className="hv-register-action">{action}<ArrowRight size={16} aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="hv-register-layer hv-register-partner-layer" aria-labelledby="network-roles-title">
              <div className="hv-register-layer-heading">
                <span className="hv-register-layer-index">02</span>
                <div><h3 id="network-roles-title">Network partner portals</h3><p>For invited carriers and funders supporting verified procurement activity.</p></div>
              </div>
              <div className="hv-register-card-grid">
                {workspaces.slice(2).map(({ title, description, href, action, icon: Icon }) => (
                  <Link className="card entry-card hv-register-card hv-register-partner-card" href={href} key={title}>
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
