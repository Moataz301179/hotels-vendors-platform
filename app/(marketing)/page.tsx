import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { HeroCarousel } from "@/components/marketing/hero-carousel";
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

const joinPaths = [
  {
    icon: Building2,
    eyebrow: "Hotels",
    title: "Buy with one accountable record",
    detail: "Bring demand, approvals, purchase orders and receipt evidence into a single protected workspace for your properties.",
    href: "/hotels/signup",
    action: "Register your hotel",
  },
  {
    icon: PackageSearch,
    eyebrow: "Vendors",
    title: "Serve qualified hospitality demand",
    detail: "Maintain catalogue evidence and respond when work is allocated to you. Vendor identity stays sealed until the authorized stage.",
    href: "/suppliers/signup",
    action: "Register as a vendor",
  },
  {
    icon: ScanLine,
    eyebrow: "Receiving",
    title: "Prove the delivery handoff",
    detail: "HOVIN is the field path for delivery codes and goods-receipt evidence—used when a shipment is ready to confirm, not to place orders.",
    href: "/hovin",
    action: "See how HOVIN works",
  },
];

export default function MarketingPage() {
  return (
    <main className={styles.home}>
      <section className={heroStyles.hero} aria-label="HotelsVendors platform introduction">
        <div className={heroStyles.stage}>
          <div className={heroStyles.media} aria-hidden="true">
            <figure className={heroStyles.mediaImage}>
              <Image
                src="/hero-clean.jpeg"
                alt=""
                fill
                priority
                sizes="100vw"
              />
            </figure>
            <div className={heroStyles.oled} />
            <div className={heroStyles.oledTexture} />
            <div className={heroStyles.oledSheen} />
            <div className={heroStyles.fade} />
          </div>
          <div className={heroStyles.shell}>
            <div className={heroStyles.copy}>
              <p className={heroStyles.eyebrow}>Hospitality operating network · Egypt</p>
              <h1>
                Technology reimagined for hotel procurement.
                <em> Every decision connected. Every handoff accountable.</em>
              </h1>
              <p className={heroStyles.lead}>
                One protected SaaS record for sourcing, approvals, delivery and receipt evidence—
                so Egyptian hotel teams control spend without losing the operating trail.
              </p>
              <div className={heroStyles.actions}>
                <Link href="/platform" className={heroStyles.primary}>
                  Explore the platform <ArrowRight size={17} />
                </Link>
                <Link href="/hotels/signup" className={heroStyles.secondary}>
                  Start a hotel workspace
                </Link>
              </div>
              <p className={heroStyles.signal}>
                <span className={heroStyles.signalDot} aria-hidden="true" />
                Built for operators — not a public product catalogue
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.carouselSection} aria-labelledby="journeys-title">
        <div className={styles.shell}>
          <Header eyebrow="Sourcing journeys" title="Every operating area, one accountable path." text="Move from a visual product reference to a controlled requirement, an authorized decision and a verified receiving handoff." />
          <HeroCarousel />
        </div>
      </section>

      <section className={`${styles.section} ${styles.categories}`} aria-labelledby="categories-title">
        <div className={styles.shell}>
          <Header eyebrow="Hospitality sourcing map" title="Begin with the operating area behind the request." text="Browse public product references by hotel use. Private Vendor identity, terms and availability stay protected until the authorized workflow permits disclosure." />
          <div className={styles.categoryGrid}>
            {categories.map(({ title, body, image, alt, group, icon: Icon }) => (
              <Link href={`/marketplace?category=${encodeURIComponent(group)}`} className={styles.categoryCard} key={title}>
                <figure><Image src={image} alt={alt} fill sizes="(max-width: 650px) calc(100vw - 68px), (max-width: 950px) calc((100vw - 88px) / 3), 230px" /></figure>
                <div className={styles.categoryBody}><span><Icon size={15} aria-hidden="true" /> Sourcing area</span><h3>{title}</h3><p>{body}</p><b>Open area <ArrowRight size={15} /></b></div>
              </Link>
            ))}
          </div>

          <aside className={styles.requirement} aria-label="Custom sourcing request">
            <div className={styles.requirementCopy}>
              <p className={styles.requirementEyebrow}>Custom demand</p>
              <h3>Can&apos;t find the right product yet?</h3>
              <p>Write the specification once. Quantity, delivery context and authority stay on the same sealed record—so your team never chases an informal request outside the network.</p>
            </div>
            <Link href="/login?redirect_url=%2Fworkspace%2Fmarketplace" className={styles.requirementCta}>
              Start a sealed requirement <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </section>

      <section className={styles.join} aria-labelledby="join-title">
        <div className={styles.shell}>
          <div className={styles.joinIntro}>
            <p className={styles.joinEyebrow}>Join the network</p>
            <h2 id="join-title">Built for hotels and vendors who need accountable procurement—not another inbox.</h2>
            <p>Register in minutes. Hotels control purchasing. Vendors serve qualified demand. Receiving teams prove the handoff when delivery evidence is ready.</p>
          </div>
          <div className={styles.joinPaths}>
            {joinPaths.map(({ icon: Icon, eyebrow, title, detail, href, action }) => (
              <Link href={href} className={styles.joinPath} key={eyebrow}>
                <span className={styles.joinPathIcon} aria-hidden="true"><Icon size={22} /></span>
                <div className={styles.joinPathCopy}>
                  <span>{eyebrow}</span>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
                <span className={styles.joinPathAction}>{action} <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
          <Link href="/getting-started" className={styles.joinGuide}>Prefer a guided walkthrough? Start here <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  );
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
    </div>
  );
}
