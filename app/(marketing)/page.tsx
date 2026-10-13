"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Building2, FileCheck2, PackageCheck, ScanSearch, Target } from "lucide-react";
import styles from "./public-home.module.css";

const actors = [
  { title: "Hotels", text: "Find products, compare terms and follow purchasing approvals.", href: "/register", action: "Start registration", icon: Building2, image: "/IMG_9945.PNG", imageAlt: "Hotel lobby and guest property operations" },
  { title: "Suppliers", text: "Present your products and respond to hotel purchasing needs.", href: "/register", action: "Start registration", icon: PackageCheck, image: "/IMG_9942.PNG", imageAlt: "Hotel guest amenity supplies" },
];

const signalSteps = [
  { title: "Purchase records", tag: "START WITH THE ORDER", text: "Check that products have the same size, grade and pack quantity before comparing their prices.", evidence: "Example: equivalent 5-litre cleaning products" },
  { title: "Purchasing volume", tag: "YOUR HOTEL GROUP", text: "Review quantities bought across properties in your own organization before discussing terms with a supplier.", evidence: "Example: 20 units at one property + 30 at another" },
  { title: "Price difference", tag: "COMPARE LIKE FOR LIKE", text: "A price difference is a reason to review the terms, not proof of a saving. Include delivery charges, taxes and payment terms.", evidence: "Example: EGP 240 versus EGP 264 per equivalent unit" },
  { title: "Review and decide", tag: "CHECK THE RESULT", text: "The responsible person reviews the comparison and records the decision. Check the received quantity against the order.", evidence: "Example: 50 ordered, 48 received — review the difference" },
];

const engineOutputs = [
  { title: "AI market discovery", text: "Ask for a product, pack and quantity. ScrapeGraphAI checks permitted public supplier sources and returns observable prices, alternatives, pack sizes and lead times with source evidence.", status: "Layer 01 · source", icon: ScanSearch },
  { title: "RFQ and commercial review", text: "Turn the requirement into an RFQ, invite eligible suppliers, compare like-for-like landed cost and keep tax, delivery and validity visible before anyone accepts terms.", status: "Layer 02 · negotiate", icon: FileCheck2 },
  { title: "Verified B2B matching", text: "Match against the HotelsVendors catalogue as it grows toward 5,000 products and 200+ verified suppliers across every hotel purchasing category.", status: "Layer 03 · transact", icon: Target },
];

const operatingOutcomes = [
  { title: "Concentrate volume", text: "Combine repeat demand across properties, expose the quantity signal and create a better starting point for supplier terms." },
  { title: "Reduce operating cost", text: "Replace spreadsheet handoffs with one controlled path for search, approval, ordering, receipt and settlement." },
  { title: "Lower logistics waste", text: "Use purchasing history, delivery commitments and receipt evidence to improve forecasting, replenishment and ETA control." },
  { title: "Specialize the team", text: "Consolidate non-specialized items while procurement focuses attention on the categories and suppliers that need judgment." },
];

const supplyCategories = [
  { title: "Guest-room supplies", text: "Linen, amenities and in-room essentials.", image: "/IMG_9942.PNG" },
  { title: "Housekeeping & operations", text: "Cleaning, carts and property consumables.", image: "/IMG_9946.PNG" },
  { title: "Food & beverage", text: "Kitchen equipment and service operations.", image: "/IMG_9944.PNG" },
  { title: "Supplier catalogue", text: "Verified active listings, specifications and terms.", image: "/IMG_9947.PNG" },
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
      <div><p className={styles.eyebrow}>Hospitality sourcing network · Egypt</p><h1>Every category.<br/>Every supplier.<br/><em>One buying view.</em></h1><p className={styles.lead}>Ask for a product and quantity. HotelsVendors searches permitted market sources, sends an RFQ when the terms need confirmation, then matches the request to verified B2B supply and carries it through approval, order, delivery and settlement.</p>
        <div className={styles.actions}><Link href="/register" className={styles.primary}>Join the network <ArrowRight size={17}/></Link><Link href="#market-compass" className={styles.textLink}>See a purchasing example <ArrowUpRight size={17}/></Link></div>
      </div>
      <figure className={styles.photo}><Image src="/hero-clean.jpeg" alt="A hotel suite overlooking the sea" fill sizes="(max-width: 900px) 100vw, 48vw" preload/><figcaption>The work behind every hotel stay.</figcaption></figure>
    </div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><h2>One purchasing network.<br/>Two public workspaces.</h2><p>Hotels buy and suppliers offer products. Carriers and funders join as provisioned partners through the footer portal, with no public role signup.</p></div>
      <div className={styles.ledger}>{actors.map(({title,text,href,action,icon:Icon,image,imageAlt}) => <Link key={title} href={href} className={styles.actor}><Image className={styles.actorImage} src={image} alt={imageAlt} width={96} height={72}/><div className={styles.actorTitle}><Icon size={19} aria-hidden="true"/><strong>{title}</strong></div><span>{text}</span><small>{action} <ArrowUpRight size={15} aria-hidden="true"/></small></Link>)}</div>
    </div></section>

    <section className={styles.sourcingStack} aria-labelledby="sourcing-stack-title"><div className={styles.shell}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Three sourcing layers</p><h2 id="sourcing-stack-title">Search the market.<br/>Prove the terms.<br/>Place the order.</h2></div><p>This is the product: a repeatable sourcing decision loop, not a static catalogue. Each layer hands evidence to the next one.</p></div><div className={styles.layerGrid}><div className={styles.layerSignal}><span>01</span><strong>Market signal</strong><p>AI discovery finds permitted public offers and alternatives for the inquiry.</p><small>Product · pack · price · availability · ETA</small></div><div className={styles.layerRfq}><span>02</span><strong>RFQ control</strong><p>Suppliers respond to the same requirement with comparable commercial fields.</p><small>Quantity · tax · delivery · validity · approval</small></div><div className={styles.layerMatch}><span>03</span><strong>B2B match</strong><p>Verified catalogue records become the trusted route to purchase.</p><small>Supplier · specification · order · receipt</small></div></div></div></section>

    <section className={styles.categoryRail} aria-labelledby="category-title"><div className={styles.shell}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Supply coverage</p><h2 id="category-title">Start with the category behind the request.</h2></div><p>Explore the operating categories that shape a hotel purchase. Listings are shown only when verified supplier records are available.</p></div><div className={styles.categoryGrid}>{supplyCategories.map(({title,text,image}) => <Link key={title} href="/marketplace" className={styles.categoryCard}><Image src={image} alt={`${title} supplier records`} fill sizes="(max-width: 700px) 50vw, 25vw"/><div><strong>{title}</strong><span>{text}</span></div></Link>)}</div></div></section>

    <section className={styles.volume} id="volume-deals"><div className={styles.shell}><div className={styles.sectionHeading}><h2>Review purchasing volume.<br/>Across your own properties.</h2><p>Compare purchases of equivalent products across your hotel group before discussing volume and commercial terms with suppliers.</p></div><p>This is not an advertised group-buying offer. Cross-organization buying rounds and negotiated group deals are not currently available.</p><Link href="/login?redirect_url=%2Fintelligence" className={styles.textLink}>Sign in to review purchasing records <ArrowRight size={17}/></Link></div></section>

    <section className={styles.compass} id="market-compass"><div className={styles.shell + " " + styles.compassGrid}><div><h2>See the difference.<br/>Check the whole purchase.</h2><p>Explore this purchasing review to see how product comparisons, quantities and receiving records become a decision trail. Check the basis of each comparison before acting.</p><Link href="/login?redirect_url=%2Fintelligence" className={styles.textLink}>Open Market Compass <ArrowRight size={17}/></Link><p className={styles.disclaimer}>Your organization’s purchasing records stay in its protected workspace. No public listing or funding approval is implied by an analysis.</p></div><SignalFolio/></div></section>

    <section className={styles.engineSection}><div className={styles.shell}><div className={styles.sectionHeading}><h2>From inquiry to<br/>commercial action.</h2><p>Every engine states what it can observe, what still needs an RFQ and which person owns the next decision.</p></div><div className={styles.engineGrid}>{engineOutputs.map(({title,text,status,icon:Icon}) => <article key={title} className={styles.engineCard}><Icon size={22} aria-hidden="true"/><span className={styles.eyebrow}>{status}</span><h3>{title}</h3><p>{text}</p><Link href="/workspace/marketplace" className={styles.cardLink}>Open procurement <ArrowRight size={15}/></Link></article>)}</div></div></section>

    <section className={styles.outcomes} aria-labelledby="outcomes-title"><div className={styles.shell}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Why the network compounds</p><h2 id="outcomes-title">More volume. Less friction.<br/>Better operating control.</h2></div><p>The network gets more useful as hotel demand, supplier capacity, spend history and delivery outcomes become connected records.</p></div><div className={styles.outcomeGrid}>{operatingOutcomes.map((outcome, index) => <article key={outcome.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{outcome.title}</h3><p>{outcome.text}</p></article>)}</div></div></section>

    <section className={styles.emptyState}><div className={styles.shell + " " + styles.emptyGrid}><div><p className={styles.eyebrow}>No verified offer yet?</p><h2>Start with a requirement.<br/>Do not fill the gap with invented data.</h2></div><div><p>When a matching product or supplier is not verified, HotelsVendors keeps the request open, records the criteria and routes it for sourcing. The hotel sees the status; it does not see fake stock, balances or logos.</p><div className={styles.actions}><Link href="/rfq" className={styles.primary}>Submit a requirement <ArrowRight size={17}/></Link><Link href="/contact" className={styles.textLink}>Talk to sourcing</Link></div></div></div></section>

    <section className={styles.mobileDownload} aria-labelledby="mobile-download-title"><div className={styles.shell + " " + styles.mobileDownloadGrid}><div><p className={styles.eyebrow}>HOVIN mobile workspace</p><h2 id="mobile-download-title">Take the receiving work with you.</h2><p>The mobile workflows are being prepared for signed distribution. Until an App Store, TestFlight or Android package is verified, use the protected web workspace—no dead QR codes or access-request loops.</p><div className={styles.actions}><Link href="/login" className={styles.primary}>Use the web workspace <ArrowRight size={17}/></Link></div></div><div className={styles.mobileStatus} aria-label="Mobile release status"><span>Release status</span><strong>Signed mobile package not published</strong><small>Install links will appear here after device testing and store verification.</small></div></div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Operating workflow</p><h2>Request to settlement.<br/>One accountable record.</h2></div><p>Built around the real handoffs between a hotel requesting department, its order department and the supplier.</p></div><ol className={styles.steps}>
      <li><span>01</span><h3>Search or request</h3><p>Find the item in the catalogue, or submit a new product request when it is not registered.</p></li><li><span>02</span><h3>Cart and approval</h3><p>Check quantity and delivery details, then route the purchase request to the authorized approver.</p></li><li><span>03</span><h3>Order and ETA</h3><p>Purchasing accepts the request; the supplier confirms quantity, expected delivery date and delivery plan.</p></li><li><span>04</span><h3>Receipt and settlement</h3><p>Record what arrived, manage due dates, reconcile the period and issue the transaction documents.</p></li>
    </ol></div></section>

    <section className={styles.section}><div className={styles.shell}><div className={styles.sectionHeading}><h2>Before you get started.</h2><p>Understand the next step without promises we cannot verify.</p></div><div className={styles.faq}>
      <details><summary>What happens after registration?</summary><p>Create an account, verify your email and complete your organization details. Access depends on the applicable onboarding and verification requirements.</p></details>
      <details><summary>What does the platform cost?</summary><p>Request written pricing for your organization before activation. Confirm platform fees and any separate delivery or funding charges. Published plan limits and service commitments must be confirmed with our team.</p><Link href="/pricing">Read pricing information</Link></details>
      <details><summary>How long does onboarding take?</summary><p>Timing depends on your organization details and any verification needed. Contact our team to confirm the requirements and timing for your case.</p></details>
      <details><summary>Does joining guarantee funding or savings?</summary><p>No. External funders decide eligibility, pricing and approval. A purchasing comparison is not a guaranteed saving.</p></details>
      <details><summary>Where can I get help?</summary><p>Use our contact page for sourcing, onboarding and partnership enquiries.</p><Link href="/contact">Contact HotelsVendors</Link></details>
    </div></div></section>

    <section className={styles.final} aria-labelledby="walkthrough-title"><div className={styles.shell + " " + styles.finalPanel}><div><p className={styles.eyebrow}>Product walkthrough · illustrative preview</p><h2 id="walkthrough-title">See the work before you join.</h2><p>From an incomplete requirement to a comparable option, an approval trail and a receiving check. This preview is a UI explanation; it does not execute a live transaction or invent a supplier result.</p></div><div className={styles.actions}><Link href="/marketplace" className={styles.primary}>Open supplier catalogue <ArrowRight size={17}/></Link><Link href="/register" className={styles.textLink}>Choose a workspace</Link></div></div></section>
  </div>;
}

