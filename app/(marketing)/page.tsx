"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BadgeCheck, Building2, Check, CircleDollarSign, Network, PackageCheck, ScanSearch, Truck, Waves } from "lucide-react";
import "./home.css";

const actors = [
  { title: "Hotels", job: "Control demand, purchasing and approvals.", href: "/register", icon: Building2, access: "Hotel workspace" },
  { title: "Suppliers", job: "Reach relevant demand and respond to real needs.", href: "/register", icon: PackageCheck, access: "Supplier workspace" },
  { title: "Carriers", job: "Coordinate fulfillment, delivery and exceptions.", href: "/platform", icon: Truck, access: "Verified partner access" },
  { title: "Funders", job: "Review consented opportunities and make independent decisions.", href: "/platform", icon: CircleDollarSign, access: "Verified partner access" },
];

const signalSteps = [
  { title: "Source activity", tag: "HOTEL DEMAND", summary: "Recurring purchase pattern", detail: "A recurring purchasing pattern is observed in an authorized business workflow.", evidence: "Source record · time · business identity" },
  { title: "Combined demand", tag: "HOTEL VOLUME", summary: "Shared purchasing volume", detail: "Review recorded purchases of the same product across hotels in your organization before negotiating supplier terms.", evidence: "Product · quantity · participating hotels" },
  { title: "Potential finding", tag: "PRICE VARIANCE", summary: "Possible cost difference", detail: "A possible cost difference is surfaced for review—not presented as guaranteed savings.", evidence: "Comparison basis · confidence · limits" },
  { title: "Next action", tag: "REVIEW & DECIDE", summary: "Validate and record", detail: "The finding is routed to the authorized participant to validate and act on it.", evidence: "Owner · decision · outcome trail" },
];

const outcomes = [
  { href: "/intelligence", action: "Review price signals", title: "Money leaks", description: "Spot recurring price variance, avoidable cost and purchasing patterns worth checking.", result: "Evidence before action" },
  { href: "/workspace/marketplace", action: "Request supplier quotes", title: "Network opportunities", description: "Connect hotel demand, supplier capacity and fulfillment context where a real fit exists.", result: "A relevant next connection" },
  { href: "/funding", action: "View funding records", title: "Cash-flow signals", description: "Review recorded funding requests and configured partners. External funders retain every lending decision.", result: "The funder decides" },
];

function SignalFolio() {
  const [active, setActive] = useState(2);
  const step = signalSteps[active];
  return (
    <div className="hv-folio" aria-label="Illustrative purchasing workflow">
      <div className="hv-folio-head">
        <div className="hv-folio-brand"><span className="hv-folio-mark"><Waves size={16} /></span><div><strong>MARKET COMPASS</strong><small>From purchasing records to action</small></div></div>
        <span className="hv-folio-stamp">ILLUSTRATIVE</span>
      </div>
      <div className="hv-folio-rule"><span /></div>
      <div className="hv-folio-route" aria-hidden="true">
        <svg viewBox="0 0 760 54" preserveAspectRatio="none">
          <path className="hv-route-base" d="M24 28 H736" />
          <path className="hv-route-active" d="M24 28 H736" />
          <path className="hv-route-tick" d="M24 18 V38 M261 18 V38 M499 18 V38 M736 18 V38" />
        </svg>
        {signalSteps.map((item, index) => <span key={item.title} className={'hv-route-point' + (active === index ? ' is-active' : '') + (index < active ? ' is-passed' : '')} style={{ left: (index / 3 * 100) + '%' }}><span className="hv-route-dot">{index < active ? <Check size={11} /> : String(index + 1).padStart(2, "0")}</span></span>)}
      </div>
      <div className="hv-folio-columns">
        {signalSteps.map((item, index) => <button type="button" key={item.title} className={'hv-folio-column' + (active === index ? ' is-active' : '')} onClick={() => setActive(index)} onFocus={() => setActive(index)} aria-pressed={active === index}>
          <span className="hv-folio-column-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="hv-folio-column-tag">{item.tag}</span>
          <strong>{item.title}</strong>
          <span className="hv-folio-column-summary">{item.summary}</span>
          <span className="hv-folio-column-line" />
          <span className="hv-folio-column-hint">{index === 0 ? "Observed" : index === 1 ? "Related" : index === 2 ? "To validate" : "Human decision"}</span>
        </button>)}
      </div>
      <div className="hv-folio-detail" aria-live="polite">
        <div className="hv-folio-detail-mark"><ScanSearch size={18} /></div>
        <div className="hv-folio-detail-copy"><span>{step.tag}</span><strong>{step.detail}</strong><small>{step.evidence}</small></div>
        <span className="hv-folio-confidence"><i /> Evidence-led<br />not a verdict</span>
      </div>
      <div className="hv-folio-foot"><span>01 / SIGNAL PATH</span><span>Illustrative scenario — not live customer data</span></div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <main className="hv-home">
      <section className="hv-hero">
        <div className="hv-shell hv-hero-shell">
          <div className="hv-hero-intro">
            <div className="hv-hero-copy"><span className="hv-hero-eyebrow">THE HOSPITALITY BUSINESS NETWORK</span>
              <h1>Source smarter. Buy stronger.</h1>
            </div>
            <div className="hv-hero-context">
              <p className="hv-hero-lead">Find verified suppliers, compare quotes and bring your hotel group’s purchasing volume together. Market Compass helps you identify price differences and verify savings after delivery.</p>
              <div className="hv-hero-actions">
                <Link href="/register" className="hv-button hv-button-primary">Join the network <ArrowRight size={16} /></Link>
                <Link href="#volume-deals" className="hv-button hv-button-text">Explore HV Volume Deals <ArrowUpRight size={16} /></Link>
              </div>
            </div>
          </div>
          <figure className="hv-hero-photograph"><Image src="/hero-clean.jpeg" alt="A light-filled hotel suite overlooking the sea" fill sizes="(max-width: 900px) 100vw, 48vw" preload /><figcaption>Behind every great stay, a better-connected business.</figcaption></figure>
        </div>
      </section>

      <section className="hv-actors-section" aria-labelledby="hv-actors-title">
        <div className="hv-shell">
          <div className="hv-section-heading"><div><h2 id="hv-actors-title">One commercial environment.<br /><em>Four distinct roles.</em></h2></div><p>Every organization gets the workflows and information it is authorized to see. The network connects the work without flattening permissions.</p></div>
          <div className="hv-actor-list">
            {actors.map(({title, job, href, icon: Icon, access}) => <Link className="hv-actor-row" href={href} key={title}><span className="hv-actor-icon"><Icon size={19} strokeWidth={1.7}/></span><span className="hv-actor-name">{title}</span><span className="hv-actor-job">{job}</span><span className="hv-actor-access">{access}</span><ArrowUpRight size={17} className="hv-actor-arrow"/></Link>)}
          </div>
        </div>
      </section>

      <section className="hv-outcomes-section" id="volume-deals">
        <div className="hv-shell"><div className="hv-section-heading"><div><h2>HV Volume Deals.<br/><em>Bring hotel demand together.</em></h2></div><p>Start with comparable purchases across hotels in your organization. Review combined volume before approaching suppliers for better terms.</p></div><div className="hv-volume-actions"><Link href="/demand-aggregation" className="hv-button hv-button-primary">Review combined demand <ArrowRight size={16}/></Link><Link href="/workspace/marketplace" className="hv-inline-link">Compare supplier quotes <ArrowRight size={16}/></Link></div><p className="hv-volume-note">Current scope: your organization’s recorded purchases. Cross-organization buying rounds, volume commitments and negotiated group offers are not yet available.</p></div>
      </section>
      <section className="hv-shadow-section" id="market-compass">
        <div className="hv-shell hv-shadow-layout">
          <div className="hv-shadow-story"><h2>Know what to buy.<br /><em>Know what to improve.</em></h2><p>Market Compass turns recorded purchases into practical recommendations: compare prices, find products bought by several hotels, request supplier quotes and verify the outcome against a received order.</p><Link href="/intelligence" className="hv-inline-link">Open Market Compass <ArrowRight size={16}/></Link><div className="hv-shadow-note"><span><BadgeCheck size={16}/></span><p><strong>Evidence before assertion.</strong> Observed facts, estimates and inferences must remain distinguishable.</p></div></div>
          <div className="hv-shadow-product"><SignalFolio /><Link href="/intelligence" className="hv-inline-link">Review purchasing opportunities <ArrowRight size={16}/></Link></div>
        </div>
      </section>

      <section className="hv-outcomes-section">
        <div className="hv-shell">
          <div className="hv-section-heading hv-outcomes-heading"><div><h2>From sourcing<br /><em>to verified savings.</em></h2></div><p>A finding is useful when its evidence is clear, its limits are honest and a participant has a practical next step.</p></div>
          <div className="hv-outcome-ledger">
            {outcomes.map((item, index) => <article className="hv-outcome-row" key={item.title}><span className="hv-outcome-mark">{index === 0 ? <ScanSearch size={20}/> : index === 1 ? <Network size={20}/> : <CircleDollarSign size={20}/>}</span><div className="hv-outcome-title"><h3>{item.title}</h3><span>{item.result}</span></div><p>{item.description}</p><Link href={item.href} className="hv-inline-link">{item.action}<ArrowUpRight size={15}/></Link></article>)}
          </div>
        </div>
      </section>

      <section className="hv-final-section">
        <div className="hv-shell hv-final-panel"><div className="hv-final-rule"/><div className="hv-final-copy"><h2>Better supply.<br /><em>Stronger buying power.</em></h2><p>Join the network and give evidence-backed opportunities a clear path to action. Each organization keeps control; external funders make funding decisions.</p></div><div className="hv-final-actions"><Link href="/register" className="hv-button hv-button-primary">Join the network <ArrowRight size={16}/></Link><Link href="/login" className="hv-final-login">Already have an account? Sign in <ArrowUpRight size={15}/></Link></div><div className="hv-final-index">FOUR ACTORS / ONE NETWORK</div></div>
      </section>
    </main>
  );
}
