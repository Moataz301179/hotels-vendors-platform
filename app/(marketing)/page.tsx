"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Building2, CircleDollarSign, FileCheck2, PackageCheck, ScanSearch, Target, Truck } from "lucide-react";
import styles from "./public-home.module.css";

const actors = [
  { title: "Hotels", text: "Find products, compare terms and follow purchasing approvals.", href: "/register", action: "Start registration", icon: Building2 },
  { title: "Suppliers", text: "Present your products and respond to hotel purchasing needs.", href: "/register", action: "Start registration", icon: PackageCheck },
  { title: "Carriers", text: "Discuss delivery coverage and partner access with our team.", href: "/contact", action: "Discuss a partnership", icon: Truck },
  { title: "Funders", text: "Discuss eligible referrals; your organization makes funding decisions.", href: "/contact", action: "Discuss a partnership", icon: CircleDollarSign },
];

const signalSteps = [
  { title: "Purchase records", tag: "START WITH THE ORDER", text: "Check that products have the same size, grade and pack quantity before comparing their prices.", evidence: "Example: equivalent 5-litre cleaning products" },
  { title: "Purchasing volume", tag: "YOUR HOTEL GROUP", text: "Review quantities bought across properties in your own organization before discussing terms with a supplier.", evidence: "Example: 20 units at one property + 30 at another" },
  { title: "Price difference", tag: "COMPARE LIKE FOR LIKE", text: "A price difference is a reason to review the terms, not proof of a saving. Include delivery charges, taxes and payment terms.", evidence: "Example: EGP 240 versus EGP 264 per equivalent unit" },
  { title: "Review and decide", tag: "CHECK THE RESULT", text: "The responsible person reviews the comparison and records the decision. Check the received quantity against the order.", evidence: "Example: 50 ordered, 48 received — review the difference" },
];

const engineOutputs = [
  { title: "Demand Signal", text: "Turns your permitted purchasing records and verified market sources into traceable needs: what is needed, where, when and with what evidence.", icon: ScanSearch },
  { title: "Market Compass", text: "Maps each need to eligible suppliers, delivery options and next actions. It recommends a route; your authorized team decides.", icon: Target },
  { title: "Control record", text: "Keeps source, timestamp, confidence, approval and outcome together so a recommendation is reviewable—not a black-box promise.", icon: FileCheck2 },
];

// Reconciled from the deployed SignalFolio interaction, with practical sample copy.
// These are examples only; no customer data or live procurement action is used.
export function SignalFolio() {
  const [active, setActive] = useState(2);
  const step = signalSteps[active];
  return <div className={styles.folio} aria-label="Illustrative purchasing workflow">
    <div className={styles.folioHead}><div><strong>Market Compass</strong><p>From purchasing records to a decision</p></div><span>Illustrative example</span></div>
    <div className={styles.route} aria-hidden="true">{signalSteps.map((step, i) => <span key={step.title} className={i === active ? styles.activePoint : ""}>{String(i + 1).padStart(2, "0")}</span>)}</div>
    <div className={styles.folioColumns}>{signalSteps.map((step, i) => <button type="button" key={step.title} onClick={() => setActive(i)} aria-pressed={active === i} className={active === i ? styles.selected : ""}><small>{step.tag}</small><strong>{step.title}</strong><span>{i === 0 ? "Product and order" : i === 1 ? "Quantity by property" : i === 2 ? "Comparable terms" : "Decision and receipt"}</span></button>)}</div>
    <div className={styles.folioDetail} aria-live="polite" aria-atomic="true"><ScanSearch size={22} aria-hidden="true"/><div><strong>{step.title}</strong><p>{step.text}</p><small>{step.evidence}</small></div></div>
    <p className={styles.sampleNote}>Sample figures for explanation only — not live listings, customer records or guaranteed savings.</p>
  </div>;
}

export default function MarketingPage() {
  return <div className={styles.home}>
    <section className={styles.hero}><div className={styles.shell + " " + styles.heroGrid}>
      <div><p className={styles.eyebrow}>Hospitality supply network · Egypt</p><h1>One operating network.<br/>Every purchase in context.</h1><p className={styles.lead}>Hotel procurement teams use HotelsVendors to connect demand, supplier catalogues, commercial terms, delivery evidence and purchasing history. Bring the right product, price, specification and next action into one accountable record—without inventing a result.</p>
        <div className={styles.actions}><Link href="/register" className={styles.primary}>Join the network <ArrowRight size={17}/></Link><Link href="#market-compass" className={styles.textLink}>See a purchasing example <ArrowUpRight size={17}/></Link></div>
      </div>
      <figure className={styles.photo}><Image src="/hero-clean.jpeg" alt="A hotel suite overlooking the sea" fill sizes="(max-width: 900px) 100vw, 48vw" preload/><figcaption>The work behind every hotel stay.</figcaption></figure>
    </div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><h2>One network.<br/>Separate authority.</h2><p>Hotel demand, supplier capacity, logistics evidence and eligible funding signals meet in one connected operating record. Each organization keeps its own permissions and decisions.</p></div>
      <div className={styles.ledger}>{actors.map(({title,text,href,action,icon:Icon}) => <Link key={title} href={href} className={styles.actor}><Icon size={23} aria-hidden="true"/><strong>{title}</strong><span>{text}</span><small>{action} <ArrowUpRight size={15} aria-hidden="true"/></small></Link>)}</div>
    </div></section>

    <section className={styles.volume} id="volume-deals"><div className={styles.shell}><div className={styles.sectionHeading}><h2>Review purchasing volume.<br/>Across your own properties.</h2><p>Compare purchases of equivalent products across your hotel group before discussing volume and commercial terms with suppliers.</p></div><p>This is not an advertised group-buying offer. Cross-organization buying rounds and negotiated group deals are not currently available.</p><Link href="/login?redirect_url=%2Fintelligence" className={styles.textLink}>Sign in to review purchasing records <ArrowRight size={17}/></Link></div></section>

    <section className={styles.compass} id="market-compass"><div className={styles.shell + " " + styles.compassGrid}><div><h2>See the difference.<br/>Check the whole purchase.</h2><p>Explore this purchasing review to see how product comparisons, quantities and receiving records become a decision trail. Check the basis of each comparison before acting.</p><Link href="/login?redirect_url=%2Fintelligence" className={styles.textLink}>Open Market Compass <ArrowRight size={17}/></Link><p className={styles.disclaimer}>Your organization’s purchasing records stay in its protected workspace. No public listing or funding approval is implied by an analysis.</p></div><SignalFolio/></div></section>

    <section className={styles.engineSection}><div className={styles.shell}><div className={styles.sectionHeading}><h2>From demand to decision.<br/>With evidence at every step.</h2><p>Three connected engines turn permitted hotel data and verified external sources into work your team can review, negotiate and control.</p></div><div className={styles.engineGrid}>{engineOutputs.map(({title,text,icon:Icon}) => <article key={title} className={styles.engineCard}><Icon size={22} aria-hidden="true"/><h3>{title}</h3><p>{text}</p><Link href="/login?redirect_url=%2Fintelligence" className={styles.cardLink}>View the workspace <ArrowRight size={15}/></Link></article>)}</div></div></section>

    <section className={styles.emptyState}><div className={styles.shell + " " + styles.emptyGrid}><div><p className={styles.eyebrow}>No verified offer yet?</p><h2>Start with a requirement.<br/>Do not fill the gap with invented data.</h2></div><div><p>When a matching product or supplier is not verified, HotelsVendors keeps the request open, records the criteria and routes it for sourcing. The hotel sees the status; it does not see fake stock, balances or logos.</p><div className={styles.actions}><Link href="/rfq" className={styles.primary}>Submit a requirement <ArrowRight size={17}/></Link><Link href="/contact" className={styles.textLink}>Talk to sourcing</Link></div></div></div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><h2>Follow the purchase.<br/>From requirement to receipt.</h2><p>Keep the product, commercial terms and next action clear at each stage.</p></div><ol className={styles.steps}>
      <li><span>01</span><h3>Find supply</h3><p>Browse published products or contact us about your sourcing requirements.</p></li><li><span>02</span><h3>Compare terms</h3><p>Check quantities, equivalent specifications, prices and delivery charges.</p></li><li><span>03</span><h3>Review approvals</h3><p>Follow your organization’s purchasing policy before placing an order.</p></li><li><span>04</span><h3>Check receipt</h3><p>Compare what arrived with what was ordered and record any differences.</p></li>
    </ol></div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><h2>Before you get started.</h2><p>Understand the next step without promises we cannot verify.</p></div><div className={styles.faq}>
      <details><summary>What happens after registration?</summary><p>Create an account, verify your email and complete your organization details. Access depends on the applicable onboarding and verification requirements.</p></details>
      <details><summary>What does the platform cost?</summary><p>Request written pricing for your organization before activation. Confirm platform fees and any separate delivery or funding charges. Published plan limits and service commitments must be confirmed with our team.</p><Link href="/pricing">Read pricing information</Link></details>
      <details><summary>How long does onboarding take?</summary><p>Timing depends on your organization details and any verification needed. Contact our team to confirm the requirements and timing for your case.</p></details>
      <details><summary>Does joining guarantee funding or savings?</summary><p>No. External funders decide eligibility, pricing and approval. A purchasing comparison is not a guaranteed saving.</p></details>
      <details><summary>Where can I get help?</summary><p>Use our contact page for sourcing, onboarding and partnership enquiries.</p><Link href="/contact">Contact HotelsVendors</Link></details>
    </div></div></section>

    <section className={styles.final}><div className={styles.shell + " " + styles.finalPanel}><div><h2>Start with your next purchase.</h2><p>Choose your workspace or speak with us about sourcing and onboarding.</p></div><div className={styles.actions}><Link href="/register" className={styles.primary}>Join the network <ArrowRight size={17}/></Link><Link href="/contact" className={styles.textLink}>Contact our team</Link></div></div></section>
  </div>;
}
