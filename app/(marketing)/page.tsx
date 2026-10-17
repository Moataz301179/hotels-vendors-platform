import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { HovinReceivingPreview } from "@/components/marketing/hovin-receiving-preview";
import { ProcurementFlowVisualizer } from "@/components/marketing/procurement-flow-visualizer";
import heroStyles from "./public-home-hero.module.css";
import styles from "./public-home.module.css";

const categories = [
  { title: "Food & beverage", body: "Ingredients, beverage programs and kitchen operating supplies.", image: "/category-food-beverage.png", alt: "Hotel kitchen receiving fresh ingredients and beverage supplies" },
  { title: "Housekeeping", body: "Cleaning chemicals, linen care and room-turnover essentials.", image: "/category-housekeeping.png", alt: "Hotel housekeeping room with linen and cleaning supplies" },
  { title: "Guest supplies", body: "In-room amenities and front-of-house replenishment.", image: "/category-guest-supplies.png", alt: "Hotel guest amenities prepared for operational use" },
  { title: "Engineering & FF&E", body: "Maintenance, replacement parts and property equipment.", image: "/category-engineering-ffe.png", alt: "Hotel engineering components and finish samples on a workbench" },
  { title: "Supplier catalogue", body: "Supplier-managed listings published only after the required review.", image: "/category-supplier-catalogue.png", alt: "Hospitality supplier arranging material and product samples" },
];

const operatingSteps = [
  ["01", "Capture the operating need", "A property team records specification, quantity, timing and receiving context."],
  ["02", "Compare commercial reality", "The team reviews eligible supplier responses on price, tax, delivery and validity."],
  ["03", "Route accountable action", "Authority, approval and financial controls determine whether a purchase order can progress."],
];

const compassSteps = [
  ["Observe", "Recorded demand, source context and receiving evidence."],
  ["Assess", "Comparable terms, exceptions and uncertainty shown together."],
  ["Route", "A defined owner receives the next decision."],
];

const volumeSignals = [
  ["01", "Demand", "Compatible requirements"],
  ["02", "Terms", "Tax, price, ETA and validity"],
  ["03", "Authority", "Approval and spend controls"],
  ["04", "Receipt", "Quantity and evidence"],
];

const outcomes = [
  ["Connected record", "One trace from requirement to receipt."],
  ["Commercial clarity", "Terms remain comparable at review."],
  ["Actionable exceptions", "The next owner is visible when delivery changes."],
];

const flow = [
  ["Inquiry", "A hotel records item, quantity and delivery requirements."],
  ["Discovery", "Relevant verified supply and source evidence are reviewed."],
  ["RFQ", "The requirement is routed to eligible suppliers."],
  ["Comparison", "Commercial terms are compared on a consistent basis."],
  ["Approval", "The recorded authority and financial gates decide the next action."],
  ["Order", "An accepted response becomes a controlled purchase order."],
  ["Delivery", "The supplier records a committed delivery time before dispatch."],
  ["Receipt", "The property records accepted and rejected quantities."],
  ["Settlement", "External funders make their own underwriting and disbursement decisions."],
];

export default function MarketingPage() {
  return (
    <main className={styles.home}>
      <section className={`${styles.hero} ${heroStyles.hero}`}>
        <div className={`${styles.shell} ${heroStyles.heroShell}`}>
          <div>
            <p className={styles.eyebrow}>Hospitality procurement network · Egypt</p>
            <h1>Control hospitality purchasing from requirement to receipt.</h1>
            <p className={styles.lead}>Give hotel teams, suppliers and partners one evidence-backed operating path for requirements, comparable terms, approvals, delivery and receipt records.</p>
            <div className={styles.actions}>
              <Link href="/hotels/signup" className={styles.primary}>Join as a hotel <ArrowRight size={17} /></Link>
              <Link href="/suppliers/signup" className={styles.secondary}>Join as a supplier</Link>
              <Link href="/walkthrough" className={styles.textLink}>See how it works <ArrowRight size={16} /></Link>
            </div>
          </div>
          <figure className={`${styles.heroVisual} ${heroStyles.heroVisual}`}>
            <Image src="/hv-procurement-team.webp" alt="Hospitality procurement team reviewing supplies and requirements in a hotel back-of-house area" fill sizes="(max-width: 950px) calc(100vw - 64px), 57vw" preload />
            <figcaption><span>Procurement where the operation happens</span><small>Hotel teams · suppliers · evidence</small></figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="operating-title">
        <div className={styles.shell}>
          <Header eyebrow="The operating model" title="A purchasing decision should have context, controls and an owner." text="A compact operating view for the people who source, approve and receive." />
          <div className={styles.operatingScene}>
            <figure className={styles.sceneImage}>
              <Image src="/hv-workspace-team.webp" alt="Hotel operations team using purchasing data while preparing hospitality supplies" fill sizes="(max-width: 850px) calc(100vw - 34px), 52vw" />
              <figcaption>Operating signal · requirement, delivery context and source record</figcaption>
            </figure>
            <ol className={styles.operatingRail}>
              {operatingSteps.map(([number, title, detail]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.categories}`} aria-labelledby="categories-title">
        <div className={styles.shell}>
          <Header eyebrow="Hospitality categories" title="Built around the supplies a property actually operates." text="Start with the operating area, then turn a missing item into a controlled requirement." />
          <div className={styles.categoryGrid}>
            {categories.map(({ title, body, image, alt }) => <article key={title}><figure><Image src={image} alt={alt} fill sizes="(max-width: 650px) calc(100vw - 68px), (max-width: 950px) calc((100vw - 88px) / 3), 230px" /></figure><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <div className={styles.requirement}><div><strong>Need something not shown?</strong><p>Record the specification, quantity, delivery location and timing. Product Intelligence reviews the requirement and routes a response only when the commercial record is complete.</p></div><Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace">Submit a requirement <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section className={styles.compass} aria-labelledby="compass-title">
        <div className={styles.shell}>
          <figure className={styles.compassImage}><Image src="/hero-clean.jpeg" alt="Hotel room representing the property context behind a procurement decision" fill sizes="(max-width: 850px) calc(100vw - 34px), 46vw" /><figcaption>Property context matters before demand becomes an order.</figcaption></figure>
          <div className={styles.compassCopy}>
            <p className={styles.eyebrow}>Market Compass · product intelligence</p>
            <h2 id="compass-title">Turn a source record into the next accountable action.</h2>
            <p>Market Compass brings authorized purchasing history, supplier responses and source context into a reviewable workflow. It identifies a question worth investigating; it does not invent an offer, outcome or saving.</p>
            <ol>{compassSteps.map(([title, detail], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ol>
            <Link href="/login?redirect_url=%2Fintelligence" className={styles.textLink}>Open the intelligence workspace <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="volume-title">
        <div className={styles.shell}>
          <Header eyebrow="Commercial control" title="Bring the full operating signal into the negotiation." text="A decision view that keeps demand, terms, authority and receipt evidence together." />
          <div className={styles.signalRail} aria-label="Commercial decision signal">
            <div className={styles.signalTrack} aria-hidden="true"><i /><i /><i /></div>
            {volumeSignals.map(([number, title, detail]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.engine}`} aria-labelledby="engine-title"><div className={styles.shell}><Header eyebrow="The connected engine" title="One controlled decision path, from requirement to receipt." text="Inspect the evidence, authority and record required at every handoff. This surface illustrates operating logic; it never substitutes an actual order or external decision." /><ProcurementFlowVisualizer stages={flow} /></div></section>

      <section className={styles.section} aria-labelledby="outcomes-title">
        <div className={styles.shell}>
          <Header eyebrow="The operational result" title="Less searching. Clearer commercial action." text="Every organization keeps its role; each handoff keeps its accountable record." />
          <div className={styles.outcomeBand}>{outcomes.map(([title, detail], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div>
        </div>
      </section>

      <section className={styles.mobile} aria-labelledby="mobile-title"><div className={`${styles.shell} ${styles.mobileShell}`}><div className={styles.mobileIntro}><p className={styles.eyebrow}>HOVIN mobile workspace</p><h2 id="mobile-title">The field record, designed around the receiving handoff.</h2><p>HOVIN lets the people at the delivery point review the assigned purchase order, confirm quantities, record exceptions and attach receipt evidence—without creating a second procurement record.</p><Link href="/hovin" className={styles.textLink}>Explore the mobile role <ArrowRight size={16} /></Link></div><HovinReceivingPreview /></div></section>

      <section className={styles.close}><div className={styles.shell}><div><p className={styles.eyebrow}>Start in the right place</p><h2>Join the sourcing network with the role that does the work.</h2><p>Public registration is for hotels and suppliers. Carrier and funder access is provisioned through partner onboarding.</p></div><div className={styles.closeActions}><Link href="/register" className={styles.primary}>Register an organization <ArrowRight size={17} /></Link><Link href="/getting-started" className={styles.textLink}>Before you join</Link></div></div></section>
    </main>
  );
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>;
}
