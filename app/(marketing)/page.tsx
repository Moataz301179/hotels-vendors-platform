import Link from 'next/link';
import { ArrowRight, Building2, PackageCheck, ShieldCheck } from 'lucide-react';
import styles from './public-home.module.css';

const workspaces = [
  { title: 'Hotel procurement workspace', detail: 'Search verified supply, create an RFQ, compare supplier terms, route approval and record receiving.', href: '/login?redirect_url=%2Fworkspace%2Fmarketplace', icon: Building2, action: 'Open hotel workspace' },
  { title: 'Supplier response workspace', detail: 'Maintain your verified catalogue, respond to assigned RFQs and follow accepted purchase orders.', href: '/login?redirect_url=%2Fsuppliers', icon: PackageCheck, action: 'Open supplier workspace' },
];

const workflow = [
  ['01', 'Requirement', 'A hotel buyer selects a verified listing or records the exact item, quantity and delivery need.'],
  ['02', 'Commercial response', 'The assigned supplier submits stored commercial terms: unit price, tax, delivery and validity.'],
  ['03', 'Purchase approval', 'Acceptance creates a purchase order that follows the stored organization authority and financial controls.'],
  ['04', 'Receiving evidence', 'The receiving team records delivered quantities and discrepancies against the approved purchase order.'],
];

export default function MarketingPage() {
  return <div className={styles.home}>
    <section className={styles.hero}><div className={styles.shell}>
      <p className={styles.eyebrow}>Hospitality sourcing network · Egypt</p>
      <h1>Procurement work, carried through.</h1>
      <p className={styles.lead}>HotelsVendors connects a hotel requirement to an assigned supplier response, an approved purchase order and receiving evidence. Access, tax controls and audit records stay inside the protected workspace.</p>
      <div className={styles.actions}><Link href="/login" className={styles.primary}>Sign in <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/register" className={styles.secondary}>Register a hotel or supplier</Link></div>
    </div></section>

    <main className={styles.shell}>
      <section className={styles.workspaces} aria-labelledby="workspace-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Start with the work</p><h2 id="workspace-title">Choose the protected workspace for your organization.</h2></div><p>Public pages do not simulate orders, stock, approval or supplier terms. Those records require an authenticated organization account.</p></div><div className={styles.workspaceGrid}>{workspaces.map(({ title, detail, href, icon: Icon, action }) => <Link href={href} className={styles.workspaceCard} key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{detail}</p><span>{action} <ArrowRight size={15} aria-hidden="true" /></span></Link>)}</div></section>

      <section className={styles.flow} aria-labelledby="flow-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Connected transaction path</p><h2 id="flow-title">Requirement to receiving.</h2></div><p>Each handoff stays scoped to the organization and authorized commercial relationship that created it.</p></div><ol>{workflow.map(([number, title, detail]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></li>)}</ol></section>

      <section className={styles.guard} aria-labelledby="guard-title"><ShieldCheck size={25} aria-hidden="true" /><div><p className={styles.eyebrow}>Controlled access</p><h2 id="guard-title">Partner portals are provisioned, not open signups.</h2><p>Carriers and funders use controlled portal access. Funding eligibility, terms and disbursement remain decisions of the relevant funding organization.</p></div><div className={styles.guardLinks}><Link href="/carriers/portal">Carrier portal</Link><Link href="/funders/portal">Funder portal</Link><Link href="/about">About the network</Link><Link href="/founder">About the founder</Link></div></section>
    </main>
  </div>;
}
