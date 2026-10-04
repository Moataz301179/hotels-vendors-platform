"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Building2, Check, CircleDollarSign, Network, PackageCheck, ScanSearch, Truck, Waves } from "lucide-react";
import "./home.css";

const actors = [
  { title: "Hotels", job: "Control demand, purchasing and approvals.", href: "/register", icon: Building2, access: "Hotel workspace" },
  { title: "Suppliers", job: "Reach relevant demand and respond to real needs.", href: "/register", icon: PackageCheck, access: "Supplier workspace" },
  { title: "Carriers", job: "Coordinate fulfillment, delivery and exceptions.", href: "/platform", icon: Truck, access: "Verified partner access" },
  { title: "Funders", job: "Review consented opportunities and make independent decisions.", href: "/platform", icon: CircleDollarSign, access: "Verified partner access" },
];

const signalSteps = [
  { title: "Source activity", tag: "HOTEL DEMAND", summary: "Recurring purchase pattern", detail: "A recurring purchasing pattern is observed in an authorized business workflow.", evidence: "Source record · time · business identity" },
  { title: "Connected context", tag: "SUPPLIER OFFER", summary: "Relevant supplier terms", detail: "Relevant supplier terms and comparable offers are brought into the same view where available.", evidence: "Offer source · item match · terms" },
  { title: "Potential finding", tag: "PRICE VARIANCE", summary: "Possible cost difference", detail: "A possible cost difference is surfaced for review—not presented as guaranteed savings.", evidence: "Comparison basis · confidence · limits" },
  { title: "Next action", tag: "REVIEW & DECIDE", summary: "Validate and record", detail: "The finding is routed to the authorized participant to validate and act on it.", evidence: "Owner · decision · outcome trail" },
];

const outcomes = [
  { title: "Money leaks", description: "Spot recurring price variance, avoidable cost and purchasing patterns worth checking.", result: "Evidence before action" },
  { title: "Network opportunities", description: "Connect hotel demand, supplier capacity and fulfillment context where a real fit exists.", result: "A relevant next connection" },
  { title: "Cash-flow signals", description: "Surface contextual signals that a business may choose to share with an external funding partner.", result: "The funder decides" },
];

function SignalFolio() {
  const [active, setActive] = useState(2);
  const step = signalSteps[active];
  return (
    <div className="hv-folio" aria-label="Illustrative Virtual Shadow signal path">
      <div className="hv-folio-head">
        <div className="hv-folio-brand"><span className="hv-folio-mark"><Waves size={16} /></span><div><strong>VIRTUAL SHADOW</strong><small>Signal folio / commercial context</small></div></div>
        <span className="hv-folio-stamp">ILLUSTRATIVE</span>
      </div>
      <div className="hv-folio-rule"><span /></div>
      <div className="hv-folio-route" aria-hidden="true">
        <svg viewBox="0 0 760 54" preserveAspectRatio="none">
          <path className="hv-route-base" d="M24 28 H736" />
          <path className="hv-route-active" d="M24 28 H736" />
          <path className="hv-route-tick" d="M24 18 V38 M261 18 V38 M499 18 V38 M736 18 V38" />
        </svg>
        {signalSteps.map((item, index) => <button type="button" key={item.title} className={'hv-route-point' + (active === index ? ' is-active' : '') + (index < active ? ' is-passed' : '')} style={{ left: (index / 3 * 100) + '%' }} aria-label={'Inspect ' + item.title} aria-pressed={active === index} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)}><span className="hv-route-dot">{index < active ? <Check size={11} /> : String(index + 1).padStart(2, "0")}</span></button>)}
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

function NetworkMap() {
  return <div className="hv-network-map" aria-label="Four actor hospitality network connected by Virtual Shadow">
    <svg className="hv-network-lines" viewBox="0 0 700 260" preserveAspectRatio="none" aria-hidden="true">
      <path d="M95 55 C220 55 220 130 350 130 S485 55 605 55" />
      <path d="M95 205 C220 205 220 130 350 130 S485 205 605 205" />
      <path d="M95 55 C145 100 145 160 95 205" />
      <path d="M605 55 C555 100 555 160 605 205" />
      <path className="hv-network-signal" d="M95 55 C220 55 220 130 350 130 S485 205 605 205" />
    </svg>
    <div className="hv-map-actor actor-hotel"><Building2 size={17}/><span>Hotel demand</span></div>
    <div className="hv-map-actor actor-supplier"><PackageCheck size={17}/><span>Supplier capacity</span></div>
    <div className="hv-map-actor actor-carrier"><Truck size={17}/><span>Fulfillment</span></div>
    <div className="hv-map-actor actor-funder"><CircleDollarSign size={17}/><span>External capital</span></div>
    <div className="hv-map-center"><span><Waves size={23}/></span><strong>Virtual Shadow</strong><small>Signals · evidence · next action</small></div>
    <div className="hv-map-caption"><span className="hv-map-key" />One connected network. Separate permissions and decisions.</div>
  </div>;
}

export default function MarketingPage() {
  return (
    <div className="hv-home">
      <section className="hv-hero">
        <div className="hv-shell hv-hero-shell">
          <div className="hv-hero-intro">
            <div className="hv-hero-copy">
              <h1>See where the <em>money moves.</em></h1>
            </div>
            <div className="hv-hero-context">
              <p className="hv-hero-lead">HotelsVendors connects hotels, suppliers, carriers and funders. The Virtual Shadow reads authorized business signals and turns them into evidence-backed savings and opportunities—with the next move routed to the right participant.</p>
              <div className="hv-hero-actions">
                <Link href="/register" className="hv-button hv-button-primary">Join the network <ArrowRight size={16} /></Link>
                <Link href="#virtual-shadow" className="hv-button hv-button-text">Explore Virtual Shadow <ArrowUpRight size={16} /></Link>
              </div>
            </div>
          </div>
          <div className="hv-hero-product"><SignalFolio /></div>
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

      <section className="hv-shadow-section" id="virtual-shadow">
        <div className="hv-shell hv-shadow-layout">
          <div className="hv-shadow-story"><h2>A shadow across the trade.<br /><em>Not another dashboard.</em></h2><p>The Virtual Shadow connects context that normally sits in separate workflows. It surfaces a finding with its source, reasoning, confidence and next action—so a person can validate it instead of trusting a black-box verdict.</p><Link href="/intelligence" className="hv-inline-link">Explore the intelligence workspace <ArrowRight size={16}/></Link><div className="hv-shadow-note"><span><BadgeCheck size={16}/></span><p><strong>Evidence before assertion.</strong> Observed facts, estimates and inferences must remain distinguishable.</p></div></div>
          <NetworkMap />
        </div>
      </section>

      <section className="hv-outcomes-section">
        <div className="hv-shell">
          <div className="hv-section-heading hv-outcomes-heading"><div><h2>Signals worth<br /><em>doing something about.</em></h2></div><p>A finding is useful when its evidence is clear, its limits are honest and a participant has a practical next step.</p></div>
          <div className="hv-outcome-ledger">
            {outcomes.map((item, index) => <article className="hv-outcome-row" key={item.title}><span className="hv-outcome-mark">{index === 0 ? <ScanSearch size={20}/> : index === 1 ? <Network size={20}/> : <CircleDollarSign size={20}/>}</span><div className="hv-outcome-title"><h3>{item.title}</h3><span>{item.result}</span></div><p>{item.description}</p><ArrowDownRight size={19} className="hv-outcome-arrow"/></article>)}
          </div>
        </div>
      </section>

      <section className="hv-final-section">
        <div className="hv-shell hv-final-panel"><div className="hv-final-rule"/><div className="hv-final-copy"><h2>Find the signal.<br /><em>Move the business.</em></h2><p>Join the network and give evidence-backed opportunities a clear path to action. Each organization keeps control; external funders make funding decisions.</p></div><div className="hv-final-actions"><Link href="/register" className="hv-button hv-button-primary">Join the network <ArrowRight size={16}/></Link><Link href="/login" className="hv-final-login">Already have an account? Sign in <ArrowUpRight size={15}/></Link></div><div className="hv-final-index">FOUR ACTORS / ONE NETWORK</div></div>
      </section>
    </div>
  );
}
