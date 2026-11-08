import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  PackageCheck,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { researchedCatalogPreviews } from "@/lib/catalog/researched-preview";
import heroStyles from "./public-home-hero.module.css";
import styles from "./public-home.module.css";

const categories = [
  { title: "Restaurants & bars", body: "Ingredients, beverage operations, table service and kitchen needs.", image: "/category-food-beverage.png", alt: "Hotel food and beverage operating area", group: "Restaurants & bars", icon: ShoppingBag },
  { title: "Housekeeping & laundry", body: "Cleaning consumables, linen, textile care and daily turnover.", image: "/category-housekeeping.png", alt: "Hotel housekeeping room with linen and cleaning supplies", group: "Housekeeping & laundry", icon: Sparkles },
  { title: "Guest rooms & amenities", body: "In-room amenities, replenishment and guest-facing operating supplies.", image: "/category-guest-supplies.png", alt: "Hotel guest amenities prepared for operational use", group: "Guest rooms & amenities", icon: PackageCheck },
  { title: "Engineering & maintenance", body: "Property systems, replacement parts, tools and planned maintenance.", image: "/category-engineering-ffe.png", alt: "Hotel engineering components on a workbench", group: "Engineering & maintenance", icon: Truck },
  { title: "Furniture, fixtures & outdoor", body: "Rooms, lobby, pool, beach and outdoor furnishing requirements.", image: "/category-furniture-fixtures.jpg", alt: "Hotel lobby with sofa seating and fixtures", group: "Furniture, fixtures & outdoor", icon: PackageSearch },
  { title: "Hotel services", body: "Specialist scopes for maintenance, compliance and operating support.", image: "/hv-workspace-team.webp", alt: "Hotel operations team coordinating service requirements", group: "Hotel services", icon: ShieldCheck },
];

const actions = [
  { number: "01", icon: PackageSearch, title: "Identify the need", body: "Start with the property category, specification, quantity and timing.", href: "/marketplace", cta: "Explore sourcing areas" },
  { number: "02", icon: ClipboardCheck, title: "Own the decision", body: "Route the requirement, terms and authority checks through one record.", href: "/login?redirect_url=%2Fworkspace%2Fmarketplace", cta: "Open a workspace" },
  { number: "03", icon: FileCheck2, title: "Verify the handoff", body: "Keep order, delivery and receiving evidence connected after approval.", href: "/login?redirect_url=%2Forders", cta: "Follow an order" },
];

const lifecycle = [
  { icon: PackageSearch, label: "Define", detail: "A reusable product reference or a precise new requirement", href: "/marketplace" },
  { icon: ClipboardCheck, label: "Source", detail: "A sealed request with a clear commercial context", href: "/login?redirect_url=%2Fworkspace%2Fmarketplace" },
  { icon: ShieldCheck, label: "Authorize", detail: "The accountable decision before a purchase order moves", href: "/login?redirect_url=%2Fdashboard" },
  { icon: Truck, label: "Receive", detail: "Assigned delivery handoff and goods-receipt evidence", href: "/hovin" },
];

const roleStarts = [
  { icon: ShieldCheck, label: "Hotel team", detail: "Control requirements, approvals, orders and the evidence behind each purchase.", href: "/hotels/signup", action: "Create hotel workspace" },
  { icon: PackageSearch, label: "Vendor", detail: "Maintain owned catalogue evidence and respond to work allocated to your organization.", href: "/suppliers/signup", action: "Create vendor workspace" },
  { icon: ScanLine, label: "Receiving operator", detail: "Use the assigned field handoff only when delivery evidence is ready to record.", href: "/hovin", action: "View HOVIN workflow" },
];

export default function MarketingPage() {
  const previewCount = researchedCatalogPreviews().length;
  return (
    <main className={styles.home}>
      <section className={heroStyles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>One commercial record · Hospitality sourcing network · Egypt</p>
              <h1>Technology reimagined for hotel procurement.<em> Every decision connected. Every handoff accountable.</em></h1>
              <p className={styles.lead}>HotelsVendors turns fragmented sourcing, approval, delivery and receipt evidence into one protected operating record—so Egyptian hotel teams can control spend and qualify local supply with confidence.</p>
              <div className={styles.actions}>
                <Link href="/marketplace" className={styles.primary}>Search the catalogue <ArrowRight size={17} /></Link>
                <Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace" className={styles.secondary}>Create an RFQ</Link>
              </div>
              <div className={styles.taskDock} aria-label="Primary procurement actions">{actions.map(({number,icon:Icon,title,body,href,cta})=><Link key={number} href={href} className={styles.taskTile}><span>{number}</span><Icon size={18}/><div><strong>{title}</strong><small>{body}</small></div><b>{cta}<ArrowRight size={14}/></b></Link>)}</div>
            </div>
            <figure className={styles.heroVisual}>
              <Image src="/hero-clean.jpeg" alt="Luxury hotel suite with a private balcony opening onto the sea" fill sizes="(max-width: 950px) calc(100vw - 48px), 44vw" />
              <figcaption><span>Authorized hospitality imagery</span><small>HotelsVendors</small></figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.categories}`} aria-labelledby="operations-title">
        <div className={styles.shell}>
          <Header eyebrow="Operational entry point" title="Start work—not another presentation." text="The public surface now routes directly into catalogue discovery, controlled sourcing and receiving. Detailed explanations remain available under How it works." />
          <div className={styles.controlBoard}>
            <div className={styles.controlNav}><span className={styles.navActive}>Catalogue</span><span>RFQ</span><span>Approval</span><span>Receiving</span></div>
            <div className={styles.controlCanvas}><div className={styles.controlSummary}><p>Egyptian-market pilot</p><strong>{previewCount} sourced product references</strong><span>Food & beverage · Housekeeping & cleaning · Guest amenities</span></div><div className={styles.controlChecks}><article><span>Product evidence</span><b>Source recorded</b></article><article><span>Supplier status</span><b>Preview / unconfirmed</b></article><article><span>Transactions</span><b>Server blocked</b></article></div><Link href="/marketplace" className={styles.controlAction}>Open catalogue <ArrowRight size={15}/></Link></div>
          </div>
        </div>
      </section>

      <section className={styles.close}><div className={styles.shell}><div className={styles.closeHeading}><p className={styles.eyebrow}>Enter the operating network</p><h2>Open a workspace that matches your responsibility.</h2><p>Hotels and Vendors can register directly.</p></div><div className={styles.roleStartGrid}>{roleStarts.map(({ icon: Icon, label, detail, href, action }) => <Link href={href} className={styles.roleStart} key={label}><Icon size={22} aria-hidden="true" /><div><span>{label}</span><p>{detail}</p></div><strong>{action}<ArrowRight size={15}/></strong></Link>)}</div><Link href="/getting-started" className={styles.textLink}>See the guided onboarding path <ArrowRight size={16} /></Link></div></section>
    </main>
  );
}
function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>;
}
