import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleDollarSign, Network, ScanSearch, Truck } from "lucide-react";
import { publicPageMetadata } from "@/lib/seo";
import styles from "./solutions.module.css";

export const metadata = publicPageMetadata(
  "Hospitality Procurement Network Solutions",
  "See how Hotels, Vendors, Carriers and independent funding partners use HOTELSVENDORS to connect controlled sourcing, authority and receiving evidence.",
  "/solutions",
);

const solutions = [
  {
    href: "/intelligence",
    action: "Explore intelligence",
    title: "Decision briefs",
    text: "Organize permissioned operating context into a reviewable brief with its source and uncertainty intact.",
    icon: ScanSearch,
    result: "A signal to validate",
  },
  {
    href: "/suppliers",
    action: "Open Vendor workspace",
    title: "Controlled sourcing",
    text: "Connect a verified Vendor to an authorized requirement without exposing private terms prematurely.",
    icon: Network,
    result: "A governed response",
  },
  {
    href: "/carrier",
    action: "Open carrier workspace",
    title: "Receiving evidence",
    text: "Link assigned delivery handoffs, exceptions and proof of receipt to the same commercial record.",
    icon: Truck,
    result: "An accountable handoff",
  },
  {
    href: "/funding",
    action: "Review funding records",
    title: "Provider referrals",
    text: "Record a consented referral and reconciliation status while the independent provider controls every financial decision.",
    icon: CircleDollarSign,
    result: "Provider-controlled outcome",
  },
];

export default function Solutions() {
  return (
    <main className="hv-public-page hv-solutions">
      <section className="hv-public-hero">
        <div className="shell hv-public-hero-inner hv-public-photo-layout">
          <div>
            <h1>From a hotel requirement to an accountable handoff.</h1>
            <p>
              Technology reimagined for the work that keeps a property operating: controlled sourcing,
              explicit authority and receiving evidence connected in one protected network record.
            </p>
            <div className="hv-public-actions">
              <Link href="/register" className="btn btn-blue">
                Join the network <ArrowRight size={15} />
              </Link>
              <Link href="/marketplace" className="hv-public-text-link">
                Explore reviewed references <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <figure className="hv-public-photo">
            <Image
              src="/solutions-hero-handoff.jpg"
              alt="Hotel receiving desk with a sealed requirement clipboard, tablet review, and inbound hospitality supplies"
              fill
              sizes="(max-width: 900px) 100vw, 42vw"
              priority
            />
          </figure>
        </div>
      </section>
      <section className={styles.handoff} aria-labelledby="handoff-title">
        <div className="shell">
          <div className={styles.intro}>
            <h2 id="handoff-title">
              Resolve the handoff.
              <br />
              <em>Keep the authority.</em>
            </h2>
            <p>
              Every surface maps to a real workflow, a permission boundary, and an outcome you can evidence—
              not a generic marketplace promise.
            </p>
          </div>
          <div className={styles.grid}>
            {solutions.map(({ title, text, icon: Icon, result, href, action }, index) => (
              <Link
                href={href}
                className={styles.panel}
                key={title}
                style={{ ["--i" as string]: index }}
              >
                <div className={styles.panelTop}>
                  <span className={styles.mark} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className={styles.copy}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <div className={styles.meta}>
                  <span className={styles.result}>{result}</span>
                  <span className={styles.action}>
                    {action} <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
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
            HOTELSVENDORS does not approve financing, execute a payout, guarantee a saving or turn a
            directory reference into a binding offer. It makes the evidence and next accountable action
            easier to see.
          </p>
        </div>
      </section>
    </main>
  );
}
