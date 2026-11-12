import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Network, ScanSearch, Truck } from 'lucide-react';
import { publicPageMetadata } from '@/lib/seo';
import { PROCUREMENT_JOURNEY } from '@/lib/marketing/procurement-journey';

export const metadata = publicPageMetadata(
  'Hospitality Procurement Network Solutions',
  'See how Hotels, Vendors, Carriers and independent funding partners use HOTELSVENDORS to connect controlled sourcing, authority and receiving evidence.',
  '/solutions',
);

const solutions = [
  {
    href: '/solutions/hotels',
    action: 'Hotel solution',
    title: 'Hotel purchasing control',
    text: 'Bring property demand, sealed requests and approval authority into one protected hotel workspace.',
    icon: ScanSearch,
    result: 'A governed requirement',
  },
  {
    href: '/solutions/suppliers',
    action: 'Vendor solution',
    title: 'Controlled sourcing',
    text: 'Connect a verified Vendor to an authorized requirement without exposing private terms prematurely.',
    icon: Network,
    result: 'A governed response',
  },
  {
    href: '/solutions/carriers',
    action: 'Carrier solution',
    title: 'Delivery handoff',
    text: 'Link assigned transport plans and exceptions to the same commercial record the hotel receives against.',
    icon: Truck,
    result: 'An accountable handoff',
  },
  {
    href: '/solutions/funders',
    action: 'Funder solution',
    title: 'Provider referrals',
    text: 'Record a consented referral and reconciliation status while the independent provider controls every financial decision.',
    icon: CircleDollarSign,
    result: 'Provider-controlled outcome',
  },
];

export default function Solutions() {
  return (
    <div className="hv-public-page hv-solutions">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <h1>From a hotel requirement to an accountable handoff.</h1>
          <p>
            Technology reimagined for the work that keeps a property operating: controlled sourcing, explicit
            authority and receiving evidence connected in one protected network record.
          </p>
          <div className="hv-public-actions">
            <Link href="/register" className="btn btn-blue">
              Join the network <ArrowRight size={15} />
            </Link>
            <Link href={PROCUREMENT_JOURNEY.catalogue.href} className="hv-public-text-link">
              Explore reviewed references <ArrowRight size={15} />
            </Link>
            <Link href={PROCUREMENT_JOURNEY.hovin.href} className="hv-public-text-link">
              See HOVIN receiving <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Resolve the handoff.
                <br />
                <em>Keep the authority.</em>
              </h2>
            </div>
            <p>
              Every product surface is anchored to a real workflow, a permission boundary and an outcome that can
              be evidenced—not a generic marketplace promise.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {solutions.map(({ title, text, icon: Icon, result, href, action }) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon">
                  <Icon size={20} />
                </span>
                <div className="hv-solution-main">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <div>
                  <p className="hv-solution-result">{result}</p>
                  <Link href={href} className="hv-public-text-link">
                    {action} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="hv-public-alt-section">
        <div className="shell hv-solutions-note">
          <h2>
            HV connects the record.
            <br />
            <em>The responsible party decides.</em>
          </h2>
          <p>
            HOTELSVENDORS does not approve financing, execute a payout, guarantee a saving or turn a directory
            reference into a binding offer. It makes the evidence and next accountable action easier to see.
          </p>
        </div>
      </section>
    </div>
  );
}
