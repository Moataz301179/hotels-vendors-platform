import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const metadata = {
  title: "About HOTELSVENDORS",
  description:
    "HotelsVendors is the Egyptian hospitality procurement network founded by Moataz Mohamed Abdel Ghani—connecting hotels, vendors, carriers, and independent funders around one accountable commercial record.",
};

const roles = [
  {
    title: "Hotels",
    text: "Frame a requirement, keep approval inside the property, and record what was actually received.",
    href: "/solutions/hotels",
    icon: Building2,
  },
  {
    title: "Vendors",
    text: "Publish a reviewed specification, then respond only to requests allocated to the business.",
    href: "/solutions/suppliers",
    icon: ClipboardCheck,
  },
  {
    title: "Carriers",
    text: "See the assigned movement and record the handoff. Another organization's commercial terms stay closed.",
    href: "/solutions/carriers",
    icon: Truck,
  },
  {
    title: "External funders",
    text: "Review evidence a hotel has released. The funding decision, terms and disbursement stay with the funder.",
    href: "/solutions/funders",
    icon: ShieldCheck,
  },
];

const credentials = [
  {
    label: "Education",
    title: "Bachelor of Accounting",
    detail: "Faculty of English Commerce, Alexandria University (1999–2003).",
  },
  {
    label: "Audit foundation",
    title: "Senior Auditor, Deloitte",
    detail: "External audit discipline that shaped how HotelsVendors treats evidence, controls, and fail-closed handoffs.",
  },
  {
    label: "Hospitality finance",
    title: "Financial Controller, Better Homes Qatar",
    detail: "Financial oversight and internal audit for a leading regional property brand (2014–2019).",
  },
  {
    label: "Strategic partnerships",
    title: "Business Development, Al Manna Group",
    detail: "Advisory across digital transformation and commercial optimization for a diversified Qatar conglomerate (2019–present).",
  },
];

export default function AboutPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner">
          <div>
            <p className="eyebrow">About HOTELSVENDORS</p>
            <h1>
              Built in Egypt for the way hotels actually buy.
              <em> One record. Four responsibilities.</em>
            </h1>
            <p>
              HotelsVendors is a hospitality procurement network for Egyptian properties and the vendors,
              carriers, and independent funders who serve them. It was founded to replace fragmented
              messages, informal quotes, and missing receiving evidence with one protected commercial record.
            </p>
            <div className="hv-public-actions">
              <Link className="btn btn-blue" href="/register">
                Open a workspace <ArrowRight size={16} />
              </Link>
              <Link className="hv-public-text-link" href="/marketplace">
                Review the catalogue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Our story.
                <br />
                <em>From control rooms to a network.</em>
              </h2>
            </div>
            <p>
              Hotel procurement fails in the gaps: a specification living in chat, a vendor named too early,
              a delivery that never becomes a receipt, a financing conversation with no evidence trail.
            </p>
          </div>
          <div className="hv-platform-principles">
            <div>
              <span>01</span>
              <strong>See the operating pain</strong>
              <p>
                Egyptian hotel teams already manage high-velocity supply across food, housekeeping, engineering,
                and guest amenities—usually across disconnected tools and informal channels.
              </p>
            </div>
            <div>
              <span>02</span>
              <strong>Protect commercial boundaries</strong>
              <p>
                HotelsVendors keeps vendor identity, private terms, and binding offers sealed until the
                authorized stage. Public discovery is not a public price list.
              </p>
            </div>
            <div>
              <span>03</span>
              <strong>Connect every handoff</strong>
              <p>
                Requirement, response, approval, delivery, receipt, and optional funding referral share one
                record—so each organization owns its step without inheriting another party&apos;s secrets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-alt-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Who works here.
                <br />
                <em>Four roles. Clear authority.</em>
              </h2>
            </div>
            <p>
              Shared context does not mean shared access. Each participant opens only the workspace that
              matches its responsibility.
            </p>
          </div>
          <div className="hv-public-actor-list">
            {roles.map(({ title, text, href, icon: Icon }) => (
              <Link className="hv-public-actor" href={href} key={title}>
                <span className="hv-public-actor-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="hv-public-actor-name">{title}</span>
                <span className="hv-public-actor-text">{text}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Founder.
                <br />
                <em>Moataz Mohamed Abdel Ghani</em>
              </h2>
            </div>
            <p>
              CEO &amp; Founder of HotelsVendors. Based in Cairo. More than seventeen years across audit,
              hospitality finance, and digital commercial platforms—and an Oliv Finance partner for
              independent supplier-financing referrals.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {credentials.map((item) => (
              <article className="hv-solution-row" key={item.title}>
                <span className="hv-public-actor-icon" aria-hidden="true">
                  <GraduationCap size={18} />
                </span>
                <div className="hv-solution-main">
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <span className="hv-solution-result">{item.label}</span>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 28, maxWidth: 720, color: "var(--muted)", lineHeight: 1.8 }}>
            Moataz built HotelsVendors around the work a property already does: specify the need, assign
            authority, and prove what arrived. The company does not lend, hold hotel funds, or publish a
            binding public offer. He also founded MozixWatt, a renewable-energy venture, reflecting the same
            bias toward accountable operating infrastructure.
          </p>
          <div className="hv-public-actions" style={{ marginTop: 24 }}>
            <a
              className="hv-public-text-link"
              href="https://www.linkedin.com/in/moatazabdelghani"
              target="_blank"
              rel="noopener noreferrer"
            >
              View founder profile on LinkedIn <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="hv-public-close">
        <div className="shell">
          <div>
            <h2>Ready to work inside the network?</h2>
            <p>
              Hotels and vendors can register directly. Logistics and finance partners join through a
              controlled review so every workspace stays honest about what is live today.
            </p>
          </div>
          <Link className="btn btn-blue" href="/contact">
            Talk to the team <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
