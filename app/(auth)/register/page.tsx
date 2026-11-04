import Link from 'next/link';
import { ArrowRight, Building2, Handshake } from 'lucide-react';
import { SiteNav } from '@/components/marketing/site-nav';

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

export default function Register() {
  return (
    <>
      <SiteNav />
      <main className="hv-register-page">
        <section className="hv-register-intro" aria-labelledby="register-title">
          <div className="shell hv-register-intro-inner">
            <div className="hv-register-copy">
              <span className="hv-register-eyebrow">HOTELSVENDORS Procurement Network</span>
              <h1 id="register-title">A better way to work across hospitality supply.</h1>
              <p>Register a hotel to manage purchasing, or register a vendor to respond to approved sourcing requests.</p>
            </div>
            <div className="hv-register-photo" role="img" aria-label="A bright, premium hotel suite overlooking the sea" />
          </div>
        </section>

        <section className="hv-register-options" aria-labelledby="workspace-title">
          <div className="shell">
            <div className="hv-register-section-heading">
              <div>
                <span className="hv-register-eyebrow">Get started</span>
                <h2 id="workspace-title">Register your organization</h2>
              </div>
              <p>Choose the organization type that matches your business.</p>
            </div>
            <div className="hv-register-layer" aria-labelledby="procurement-roles-title">
              <div className="hv-register-layer-heading">
                <span className="hv-register-layer-index">01</span>
                <div><h3 id="procurement-roles-title">Procurement workspaces</h3><p>For the buyers and vendors who create and fulfil purchasing demand.</p></div>
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
          </div>
        </section>
      </main>
    </>
  );
}
