import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Barcode,
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

import { HovinReceivingPreview } from "@/components/marketing/hovin-receiving-preview";
import heroStyles from "./public-home-hero.module.css";
import styles from "./public-home.module.css";

const categories = [
  { title: "Restaurants & bars", body: "Ingredients, beverage operations, table service and kitchen needs.", image: "/category-food-beverage.png", alt: "Hotel food and beverage operating area", group: "Restaurants & bars", icon: ShoppingBag },
  { title: "Housekeeping & laundry", body: "Cleaning consumables, linen, textile care and daily turnover.", image: "/category-housekeeping.png", alt: "Hotel housekeeping room with linen and cleaning supplies", group: "Housekeeping & laundry", icon: Sparkles },
  { title: "Guest rooms & amenities", body: "In-room amenities, replenishment and guest-facing operating supplies.", image: "/category-guest-supplies.png", alt: "Hotel guest amenities prepared for operational use", group: "Guest rooms & amenities", icon: PackageCheck },
  { title: "Engineering & maintenance", body: "Property systems, replacement parts, tools and planned maintenance.", image: "/category-engineering-ffe.png", alt: "Hotel engineering components on a workbench", group: "Engineering & maintenance", icon: Truck },
  { title: "Furniture, fixtures & outdoor", body: "Rooms, lobby, pool, beach and outdoor furnishing requirements.", image: "/category-supplier-catalogue.png", alt: "Hospitality furniture and fixtures selection", group: "Furniture, fixtures & outdoor", icon: PackageSearch },
  { title: "Hotel services", body: "Specialist scopes for maintenance, compliance and operating support.", image: "/hv-workspace-team.webp", alt: "Hotel operations team coordinating service requirements", group: "Hotel services", icon: ShieldCheck },
];

const actions = [
  { number: "01", icon: PackageSearch, title: "Browse sourcing areas", body: "Choose a category with visual filters already applied.", href: "/marketplace", cta: "Open catalogue" },
  { number: "02", icon: ClipboardCheck, title: "Build one requirement", body: "Select known items or add a controlled specification once.", href: "/login?redirect_url=%2Fworkspace%2Fmarketplace", cta: "Start a request" },
  { number: "03", icon: FileCheck2, title: "Track an approved order", body: "Follow approval, delivery and receiving on the same record.", href: "/login?redirect_url=%2Forders", cta: "Open orders" },
];

const lifecycle = [
  { icon: PackageSearch, label: "Discover", detail: "Visual category and product-reference selection", href: "/marketplace" },
  { icon: ClipboardCheck, label: "Request", detail: "One structured need with quantity and timing", href: "/login?redirect_url=%2Fworkspace%2Fmarketplace" },
  { icon: ShieldCheck, label: "Approve", detail: "Authority and budget controls", href: "/login?redirect_url=%2Fdashboard" },
  { icon: Truck, label: "Receive", detail: "Assigned handoff and receipt evidence", href: "/hovin" },
];

const roleStarts = [
  { icon: ShieldCheck, label: "Hotel team", detail: "Source, request, approve and receive in one operating record.", href: "/hotels/signup", action: "Register hotel" },
  { icon: PackageSearch, label: "Vendor", detail: "Manage your catalogue, opportunities and fulfilment handoffs.", href: "/suppliers/signup", action: "Register vendor" },
  { icon: ScanLine, label: "Field team", detail: "Open only assigned delivery handoffs on the mobile workflow.", href: "/hovin", action: "Explore HOVIN" },
];

export default function MarketingPage() {
  return (
    <main className={styles.home}>
      <section className={`${styles.hero} ${heroStyles.hero}`}>
        <div className={`${styles.shell} ${heroStyles.heroShell}`}>
          <div>
            <p className={styles.eyebrow}>Hospitality sourcing network · Egypt</p>
            <h1>Every operating need, on one controlled path.</h1>
            <p className={styles.lead}>Move from a visual product reference to a controlled request, approval, delivery and receipt record without exposing private Vendor relationships at the discovery stage.</p>
            <div className={styles.actions}>
              <Link href="/marketplace" className={styles.primary}>Explore sourcing areas <ArrowRight size={17} /></Link>
              <Link href="/hotels/signup" className={styles.secondary}>Register a hotel</Link>
            </div>
            <div className={styles.taskDock} aria-label="Start a procurement task">
              {actions.map(({ number, icon: Icon, title, body, href, cta }) => <Link href={href} key={title} className={styles.taskTile}>
                <span>{number}</span><Icon size={21} aria-hidden="true" /><div><strong>{title}</strong><small>{body}</small></div><b>{cta}<ArrowRight size={14} /></b>
              </Link>)}
            </div>
          </div>
          <figure className={`${styles.heroVisual} ${heroStyles.heroVisual}`}>
            <Image src="/hv-procurement-team.webp" alt="Hospitality procurement team reviewing supplies and requirements in a hotel back-of-house area" fill sizes="(max-width: 950px) calc(100vw - 64px), 57vw" preload />
            <figcaption><span>One shared record for the people who source, approve and receive.</span><small>Hotel teams · Vendors · evidence</small></figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="operating-title">
        <div className={styles.shell}>
          <Header eyebrow="How it moves" title="See the work at a glance, then enter at the right point." text="A visual operating path, with a direct action at every handoff." />
          <div className={styles.journeyBoard}>
            <figure className={styles.sceneImage}>
              <Image src="/hv-workspace-team.webp" alt="Hotel operations team using purchasing data while preparing hospitality supplies" fill sizes="(max-width: 850px) calc(100vw - 34px), 52vw" />
              <figcaption>Source with operational context—not an empty form.</figcaption>
            </figure>
            <div className={styles.journeySteps}>
              {lifecycle.slice(0, 3).map(({ icon: Icon, label, detail, href }, index) => <Link href={href} className={styles.journeyStep} key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span><Icon size={23} aria-hidden="true" /><div><strong>{label}</strong><small>{detail}</small></div><ArrowRight size={16} aria-hidden="true" />
              </Link>)}
              <div className={styles.journeySignal}><CheckCircle2 size={18} aria-hidden="true" /><span>Every next step belongs to an accountable role.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.categories}`} aria-labelledby="categories-title">
        <div className={styles.shell}>
          <Header eyebrow="Sourcing areas" title="Start where the property operates." text="Every card opens the Marketplace with that exact sourcing area selected." />
          <div className={styles.categoryGrid}>
            {categories.map(({ title, body, image, alt, group, icon: Icon }) => <Link href={`/marketplace?category=${encodeURIComponent(group)}`} className={styles.categoryCard} key={title}>
              <figure><Image src={image} alt={alt} fill sizes="(max-width: 650px) calc(100vw - 68px), (max-width: 950px) calc((100vw - 88px) / 3), 230px" /></figure>
              <div className={styles.categoryBody}><span><Icon size={15} aria-hidden="true" /> Sourcing area</span><h3>{title}</h3><p>{body}</p><b>Open area <ArrowRight size={15} /></b></div>
            </Link>)}
          </div>
          <div className={styles.requirement}><div><strong>Can’t find the exact item?</strong><p>Create a controlled requirement from the hotel workspace. Your specification, quantity and delivery context stay on one sourcing record.</p></div><Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace">Create a requirement <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section className={styles.controlSection} aria-labelledby="control-title">
        <div className={styles.shell}>
          <Header eyebrow="Commercial control" title="A decision workspace, not another spreadsheet." text="The record carries the signals a team needs before an order moves forward." />
          <div className={styles.controlBoard}>
            <div className={styles.controlNav}><span className={styles.navActive}><PackageSearch size={17} /> Requirement</span><span><ClipboardCheck size={17} /> Terms</span><span><ShieldCheck size={17} /> Approval</span><span><Truck size={17} /> Receipt</span></div>
            <div className={styles.controlCanvas}>
              <div className={styles.controlSummary}><p>Current decision</p><strong>Review a controlled purchase requirement</strong><span>Product reference · quantity · delivery context</span></div>
              <div className={styles.controlChecks}><article><span>Specification</span><b>Complete</b></article><article><span>Response window</span><b>Selected</b></article><article><span>Authority</span><b>Required</b></article></div>
              <Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace" className={styles.controlAction}>Open the secure workspace <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.engine}`} aria-labelledby="engine-title">
        <div className={styles.shell}>
          <Header eyebrow="Connected workflow" title="Choose a handoff. Open the correct tool." text="The interface should lead the operation forward rather than explain it in long text." />
          <div className={styles.flowGrid}>
            {lifecycle.map(({ icon: Icon, label, detail, href }, index) => <Link href={href} className={styles.flowCard} key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span><Icon size={25} aria-hidden="true" /><h3>{label}</h3><p>{detail}</p><b>Open <ArrowRight size={15} /></b>
            </Link>)}
          </div>
        </div>
      </section>

      <section className={styles.outcomeSection} aria-labelledby="outcomes-title">
        <div className={styles.shell}>
          <Header eyebrow="Your next action" title="Enter the network through the work you need to do." text="No blank dashboard or confusing form is needed before the task is clear." />
          <div className={styles.outcomeBoard}>
            <div><PackageSearch size={24} aria-hidden="true" /><strong>Find a product reference</strong><span>Browse by sourcing area, image and product details.</span><Link href="/marketplace">Browse catalogue <ArrowRight size={16} /></Link></div>
            <div><ClipboardCheck size={24} aria-hidden="true" /><strong>Send one controlled requirement</strong><span>Use the secure workspace for quantity, timing and delivery context.</span><Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace">Open workspace <ArrowRight size={16} /></Link></div>
            <div><Barcode size={24} aria-hidden="true" /><strong>Record a receiving handoff</strong><span>HOVIN opens only an assigned handoff for the responsible field role.</span><Link href="/hovin">Explore HOVIN <ArrowRight size={16} /></Link></div>
          </div>
        </div>
      </section>

      <section className={styles.mobile} aria-labelledby="mobile-title"><div className={`${styles.shell} ${styles.mobileShell}`}>
        <div className={styles.mobileIntro}><p className={styles.eyebrow}>HOVIN mobile workspace</p><h2 id="mobile-title">A field workflow built for taps, scans and explicit confirmation.</h2><p>HOVIN gives the receiving team a visual, assigned-handoff interface. The camera can identify an item; an authorized person still confirms the quantity and condition.</p><Link href="/hovin" className={styles.textLink}>Open the HOVIN overview <ArrowRight size={16} /></Link></div>
        <HovinReceivingPreview />
      </div></section>

      <section className={styles.close}><div className={styles.shell}><div className={styles.closeHeading}><p className={styles.eyebrow}>Start in the right place</p><h2>Choose your role. Start with a guided action.</h2><p>Hotels and Vendors can register directly. Carrier and funder access is controlled through partner onboarding.</p></div><div className={styles.roleStartGrid}>{roleStarts.map(({ icon: Icon, label, detail, href, action }) => <Link href={href} className={styles.roleStart} key={label}><Icon size={22} aria-hidden="true"/><div><span>{label}</span><p>{detail}</p></div><strong>{action}<ArrowRight size={15}/></strong></Link>)}</div><Link href="/getting-started" className={styles.textLink}>See guided onboarding <ArrowRight size={16} /></Link></div></section>
    </main>
  );
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>;
}
