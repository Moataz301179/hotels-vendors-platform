"use client";

import "./home.css";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Building2, Check, ChevronRight, CircleDollarSign, FileCheck2, GitBranch, Network, PackageCheck, ScanSearch, ShieldCheck, Truck, Waves, Zap } from "lucide-react";

const roles = [
  { icon: Building2, title: "Hotels", desc: "Control demand, purchasing and approvals." },
  { icon: PackageCheck, title: "Suppliers", desc: "Win qualified demand and manage orders." },
  { icon: Truck, title: "Carriers", desc: "Coordinate delivery, exceptions and proof." },
  { icon: CircleDollarSign, title: "Funders", desc: "Receive consented referrals with context." },
];

const stages = [
  { n: "01", title: "Observe", desc: "Read authorized business activity and trusted market signals." },
  { n: "02", title: "Detect", desc: "Find price variance, repeat demand, leakage and emerging opportunities." },
  { n: "03", title: "Decide", desc: "Show the evidence, confidence and next action to the right actor." },
  { n: "04", title: "Measure", desc: "Track action and outcome instead of counting alerts." },
];

export default function MarketingPage() {
  return (
    <div className="hv-home">
      <section className="hv-hero">
        <div className="hv-hero-grid" aria-hidden="true" />
        <div className="hv-shell hv-hero-layout">
          <div className="hv-hero-copy">
            <div className="hv-eyebrow"><span className="hv-live-dot" /> THE HOSPITALITY BUSINESS NETWORK</div>
            <h1>Find the leak.<br /><span>See the opportunity.</span><br />Move the business.</h1>
            <p className="hv-hero-lead">HotelsVendors connects hotels, suppliers, carriers and funders in one operating network — with a Virtual Shadow that watches authorized signals across the ecosystem and turns them into evidence-backed actions.</p>
            <div className="hv-hero-actions">
              <Link href="/register" className="hv-button hv-button-primary">Join the network <ArrowRight size={17} /></Link>
              <Link href="/intelligence" className="hv-button hv-button-secondary">Explore Virtual Shadow <ArrowUpRight size={17} /></Link>
            </div>
            <div className="hv-proofline">
              <span><ShieldCheck size={16} /> Tenant-scoped evidence</span>
              <span><FileCheck2 size={16} /> Auditable actions</span>
              <span><GitBranch size={16} /> Partner-owned decisions</span>
            </div>
          </div>

          <div className="hv-shadow-stage" aria-label="Virtual Shadow intelligence visualization">
            <div className="hv-stage-top"><span><span className="hv-live-dot" /> VIRTUAL SHADOW</span><span className="hv-stage-mode">SIGNAL WORKSPACE</span></div>
            <div className="hv-orbit hv-orbit-one" />
            <div className="hv-orbit hv-orbit-two" />
            <div className="hv-orbit hv-orbit-three" />
            <div className="hv-shadow-core">
              <div className="hv-core-mark"><Waves size={31} strokeWidth={1.5} /></div>
              <span className="hv-core-label">NETWORK SIGNAL</span>
              <span className="hv-core-sub">Observe · Connect · Act</span>
            </div>
            <div className="hv-node hv-node-hotel"><Building2 size={17}/><span>Hotel demand</span></div>
            <div className="hv-node hv-node-supplier"><PackageCheck size={17}/><span>Supplier offer</span></div>
            <div className="hv-node hv-node-carrier"><Truck size={17}/><span>Delivery signal</span></div>
            <div className="hv-node hv-node-funder"><CircleDollarSign size={17}/><span>Capital signal</span></div>
            <div className="hv-signal-card">
              <div className="hv-signal-card-head"><ScanSearch size={15} /> SIGNAL PATH <span className="hv-evidence-tag">EVIDENCE FIRST</span></div>
              <div className="hv-signal-line"><span className="hv-signal-index">01</span><div><strong>Pattern detected</strong><small>Price variance / repeat demand</small></div><ChevronRight size={15}/></div>
              <div className="hv-signal-line"><span className="hv-signal-index">02</span><div><strong>Context attached</strong><small>Source · time · confidence</small></div><ChevronRight size={15}/></div>
              <div className="hv-signal-line"><span className="hv-signal-index">03</span><div><strong>Action routed</strong><small>Relevant business workspace</small></div><ArrowUpRight size={15}/></div>
            </div>
            <div className="hv-stage-foot"><span>CONNECTED NETWORK</span><span>ACCESS-CONTROLLED BY DESIGN</span></div>
          </div>
        </div>
        <div className="hv-shell hv-hero-bottom">
          <span>ONE CONNECTED OPERATING LOOP</span>
          <div><i /> Procurement <b>→</b> Evidence <b>→</b> Opportunity <b>→</b> Measurable outcome</div>
        </div>
      </section>

      <section className="hv-roles-section">
        <div className="hv-shell">
          <div className="hv-section-intro hv-section-intro-row">
            <div><div className="hv-kicker">ONE NETWORK · FOUR ACTORS</div><h2>Every participant sees<br/>the work that belongs to them.</h2></div>
            <p>One shared commercial environment. Separate permissions, workflows and evidence for every organization.</p>
          </div>
          <div className="hv-roles-grid">
            {roles.map(({icon: Icon, title, desc}, i) => <article className="hv-role" key={title}><div className="hv-role-top"><span className="hv-role-icon"><Icon size={20}/></span><span className="hv-role-number">0{i+1}</span></div><h3>{title}</h3><p>{desc}</p><div className="hv-role-rule"/></article>)}
          </div>
        </div>
      </section>

      <section className="hv-shadow-section">
        <div className="hv-shell hv-shadow-content">
          <div className="hv-shadow-art">
            <div className="hv-art-label">FROM SIGNAL TO BUSINESS VALUE</div>
            <div className="hv-art-network">
              <div className="hv-art-ring ring-a"/><div className="hv-art-ring ring-b"/><div className="hv-art-ring ring-c"/>
              <div className="hv-art-center"><Waves size={36}/><span>VIRTUAL<br/>SHADOW</span></div>
              <span className="hv-art-point p-a"/><span className="hv-art-point p-b"/><span className="hv-art-point p-c"/><span className="hv-art-point p-d"/>
              <span className="hv-art-label-node l-a">DEMAND</span><span className="hv-art-label-node l-b">PRICE</span><span className="hv-art-label-node l-c">SUPPLY</span><span className="hv-art-label-node l-d">CASH FLOW</span>
            </div>
            <div className="hv-art-footer"><span><span className="hv-live-dot"/> SIGNAL ENGINE</span><span>NO BLACK-BOX VERDICTS</span></div>
          </div>
          <div className="hv-shadow-copy">
            <div className="hv-kicker">THE DIFFERENTIATOR</div>
            <h2>A Virtual Shadow<br/>that works across<br/><em>the business network.</em></h2>
            <p>Not another dashboard full of charts. The Virtual Shadow looks for patterns that matter to real operations, then shows the source, the reasoning and the next practical move.</p>
            <ul className="hv-check-list">
              <li><Check size={17}/> Money leaks and avoidable cost</li>
              <li><Check size={17}/> Supplier, demand and fulfillment opportunities</li>
              <li><Check size={17}/> Cash-flow signals and consented external referrals</li>
              <li><Check size={17}/> Findings linked to actions and measured outcomes</li>
            </ul>
            <Link href="/intelligence" className="hv-text-link">See how the Shadow works <ArrowRight size={17}/></Link>
          </div>
        </div>
      </section>

      <section className="hv-method-section">
        <div className="hv-shell">
          <div className="hv-section-intro hv-centered">
            <div className="hv-kicker">FROM OBSERVATION TO OUTCOME</div>
            <h2>Intelligence only matters<br/>when it changes what happens next.</h2>
            <p>Every signal should lead to a traceable business decision — or be clearly marked as informational.</p>
          </div>
          <div className="hv-stages">
            {stages.map((stage, i) => <article className="hv-stage" key={stage.n}><div className="hv-stage-number">{stage.n}<span>{i === 0 ? <ScanSearch size={18}/> : i === 1 ? <Zap size={18}/> : i === 2 ? <ArrowDownRight size={18}/> : <BadgeCheck size={18}/>}</span></div><h3>{stage.title}</h3><p>{stage.desc}</p>{i < stages.length-1 && <div className="hv-stage-connector"><ArrowRight size={16}/></div>}</article>)}
          </div>
        </div>
      </section>

      <section className="hv-control-section">
        <div className="hv-shell hv-control-grid">
          <div><div className="hv-kicker">TRUST IS PART OF THE PRODUCT</div><h2>Useful intelligence.<br/><span>Controlled access.</span></h2><p>Business information stays within authorized scopes. HotelsVendors connects commercial workflows and evidence; it does not become a lender or make funding decisions.</p><Link href="/platform" className="hv-text-link">Explore the operating model <ArrowRight size={17}/></Link></div>
          <div className="hv-controls">
            <div className="hv-control-row"><span className="hv-control-icon"><ShieldCheck size={20}/></span><div><strong>Tenant-level boundaries</strong><p>Organizations only access permitted records and workflows.</p></div><Check size={17} className="hv-control-check"/></div>
            <div className="hv-control-row"><span className="hv-control-icon"><FileCheck2 size={20}/></span><div><strong>Evidence and audit trail</strong><p>Findings and material actions should be explainable and traceable.</p></div><Check size={17} className="hv-control-check"/></div>
            <div className="hv-control-row"><span className="hv-control-icon"><Network size={20}/></span><div><strong>Clear partner boundaries</strong><p>External funders retain underwriting, approval and contracting decisions.</p></div><Check size={17} className="hv-control-check"/></div>
          </div>
        </div>
      </section>

      <section className="hv-cta-section">
        <div className="hv-shell hv-cta-panel"><div><div className="hv-kicker">MAKE THE NETWORK WORK FOR YOU</div><h2>Find the business.<br/><span>Close the loop.</span></h2><p>Start with your organization. Connect the right workflow. Turn the next signal into a decision you can act on.</p></div><div className="hv-cta-actions"><Link href="/register" className="hv-button hv-button-primary">Get started <ArrowRight size={17}/></Link><Link href="/login" className="hv-button hv-button-ghost">Already have an account</Link></div><div className="hv-cta-orb" aria-hidden="true"/></div>
      </section>
    </div>
  );
}
