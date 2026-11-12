import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  ClipboardCheck,
  PackageCheck,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  Wrench,
  Cpu,
} from "lucide-react";

import { HovinReceivingPreview } from "@/components/marketing/hovin-receiving-preview";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { APPROVED_COVERS, groupLabel } from "@/lib/directory/listing-visual";
import { OPERATING_GROUPS } from "@/lib/directory/operating-category";
import {
  marketplaceCategoryHref,
  PROCUREMENT_JOURNEY,
} from "@/lib/marketing/procurement-journey";
import heroStyles from "./public-home-hero.module.css";
import styles from "./public-home.module.css";

const CATEGORY_COPY: Record<string, { body: string; alt: string; icon: typeof ShoppingBag }> = {
  "Restaurants & bars": {
    body: "Ingredients, beverage operations, table service and kitchen needs.",
    alt: "Hotel food and beverage operating area",
    icon: ShoppingBag,
  },
  "Housekeeping & laundry": {
    body: "Cleaning consumables, linen, textile care and daily turnover.",
    alt: "Hotel housekeeping room with linen and cleaning supplies",
    icon: Sparkles,
  },
  "Guest rooms & amenities": {
    body: "In-room amenities, replenishment and guest-facing operating supplies.",
    alt: "Hotel guest amenities prepared for operational use",
    icon: BedDouble,
  },
  "Engineering & maintenance": {
    body: "Property systems, replacement parts, tools and planned maintenance.",
    alt: "Hotel engineering components on a workbench",
    icon: Wrench,
  },
  "Furniture, fixtures & outdoor": {
    body: "Rooms, lobby, pool, beach and outdoor furnishing requirements.",
    alt: "Hotel lobby with sofa seating and fixtures",
    icon: PackageSearch,
  },
  "Hotel services": {
    body: "Specialist scopes for maintenance, compliance and operating support.",
    alt: "Hotel operations team coordinating service requirements",
    icon: ShieldCheck,
  },
  "Safety & compliance": {
    body: "Detection, protection and response equipment for property safety teams.",
    alt: "Hotel safety and compliance equipment",
    icon: ShieldCheck,
  },
  "Hotel technology": {
    body: "Rooms, meetings and property systems that support guest operations.",
    alt: "Hotel technology and audiovisual systems",
    icon: Cpu,
  },
  "Uniforms & workwear": {
    body: "Kitchen, housekeeping and front-office clothing for hotel teams.",
    alt: "Hotel staff uniforms and workwear",
    icon: Shirt,
  },
};

const categories = OPERATING_GROUPS.filter((group) => APPROVED_COVERS[group]).map((group) => {
  const cover = APPROVED_COVERS[group];
  const copy = CATEGORY_COPY[group];
  return {
    title: group,
    body: copy.body,
    image: cover.image,
    alt: copy.alt,
    group,
    icon: copy.icon,
  };
});

const lifecycle = [
  {
    icon: PackageSearch,
    label: "Define",
    detail: PROCUREMENT_JOURNEY.catalogue.detail,
    href: PROCUREMENT_JOURNEY.catalogue.href,
  },
  {
    icon: ClipboardCheck,
    label: "Source",
    detail: PROCUREMENT_JOURNEY.hotelList.detail,
    href: `/login?redirect_url=${encodeURIComponent(PROCUREMENT_JOURNEY.hotelList.href)}`,
  },
  {
    icon: ShieldCheck,
    label: "Authorize",
    detail: PROCUREMENT_JOURNEY.authorize.detail,
    href: `/login?redirect_url=${encodeURIComponent(PROCUREMENT_JOURNEY.authorize.href)}`,
  },
  {
    icon: Truck,
    label: "Receive",
    detail: PROCUREMENT_JOURNEY.receivingWeb.detail,
    href: PROCUREMENT_JOURNEY.hovin.href,
  },
];

const roleStarts = [
  {
    icon: ShieldCheck,
    label: "Hotel team",
    detail: "Control requirements, approvals, orders and the evidence behind each purchase.",
    href: PROCUREMENT_JOURNEY.hotelSignup.href,
    action: PROCUREMENT_JOURNEY.hotelSignup.label,
  },
  {
    icon: PackageSearch,
    label: "Vendor",
    detail: "Maintain owned catalogue evidence and respond to work allocated to your organization.",
    href: PROCUREMENT_JOURNEY.vendorSignup.href,
    action: PROCUREMENT_JOURNEY.vendorSignup.label,
  },
  {
    icon: ScanLine,
    label: "Receiving operator",
    detail: "Use the assigned field handoff only when delivery evidence is ready to record.",
    href: PROCUREMENT_JOURNEY.hovin.href,
    action: "View HOVIN workflow",
  },
];

export default function MarketingPage() {
  return (
    <div className={styles.home}>
      <section className={heroStyles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>One commercial record · Hospitality sourcing network · Egypt</p>
              <h1>
                Technology reimagined for hotel procurement.
                <em> Every decision connected. Every handoff accountable.</em>
              </h1>
              <p className={styles.lead}>
                HotelsVendors turns fragmented sourcing, approval, delivery and receipt evidence into one
                protected operating record—so Egyptian hotel teams can control spend and qualify local supply
                with confidence.
              </p>
              <div className={styles.actions}>
                <Link href={PROCUREMENT_JOURNEY.catalogue.href} className={styles.primary}>
                  Open sourcing areas <ArrowRight size={17} />
                </Link>
                <Link href={PROCUREMENT_JOURNEY.hotelSignup.href} className={styles.secondary}>
                  Register a hotel
                </Link>
              </div>
            </div>
            <figure className={styles.heroVisual}>
              <Image
                src="/hero-clean.jpeg"
                alt="Luxury hotel suite with a private balcony opening onto the sea"
                fill
                sizes="(max-width: 950px) calc(100vw - 48px), 44vw"
              />
              <figcaption>
                <span>Authorized hospitality imagery</span>
                <small>HotelsVendors</small>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.carouselSection} aria-labelledby="journeys-title">
        <div className={styles.shell}>
          <Header
            eyebrow="Sourcing journeys"
            title="Every operating area, one accountable path."
            text="Move from a visual product reference to a controlled requirement, an authorized decision and a verified receiving handoff."
          />
          <HeroCarousel />
        </div>
      </section>

      <section className={`${styles.section} ${styles.engine}`} aria-labelledby="lifecycle-title">
        <div className={styles.shell}>
          <Header
            eyebrow="Connected operating record"
            title="Catalogue, request, approval and receipt stay on one path."
            text="Public discovery never discloses vendor identity or price. The hotel workspace carries the sealed request; HOVIN records what arrived."
          />
          <div className={styles.flowGrid}>
            {lifecycle.map(({ icon: Icon, label, detail, href }) => (
              <Link href={href} className={styles.flowCard} key={label}>
                <span aria-hidden="true">{String(lifecycle.findIndex((step) => step.label === label) + 1).padStart(2, "0")}</span>
                <Icon size={22} aria-hidden="true" />
                <h3>{label}</h3>
                <p>{detail}</p>
                <b>
                  Continue <ArrowRight size={15} />
                </b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.categories}`} aria-labelledby="categories-title">
        <div className={styles.shell}>
          <Header
            eyebrow="Hospitality sourcing map"
            title="Begin with the operating area behind the request."
            text="Browse public product references by hotel use. Private Vendor identity, terms and availability stay protected until the authorized workflow permits disclosure."
          />
          <div className={styles.categoryGrid}>
            {categories.map(({ title, body, image, alt, group, icon: Icon }) => (
              <Link href={marketplaceCategoryHref(group)} className={styles.categoryCard} key={title}>
                <figure>
                  <Image src={image} alt={alt} fill sizes="(max-width: 650px) calc(100vw - 68px), (max-width: 950px) calc((100vw - 88px) / 3), 230px" />
                </figure>
                <div className={styles.categoryBody}>
                  <span>
                    <Icon size={15} aria-hidden="true" /> Sourcing area
                  </span>
                  <h3>{groupLabel(title)}</h3>
                  <p>{body}</p>
                  <b>
                    Open area <ArrowRight size={15} />
                  </b>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.requirement}>
            <div>
              <strong>Nothing suitable in the directory?</strong>
              <p>
                Create a controlled requirement from the hotel workspace. Its specification, quantity and
                delivery context stay with the sourcing record rather than becoming an untracked request.
              </p>
            </div>
            <Link href={`/login?redirect_url=${encodeURIComponent(PROCUREMENT_JOURNEY.workspaceMarketplace.href)}`}>
              Create a requirement <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.mobile}`} aria-labelledby="hovin-home-title">
        <div className={styles.shell}>
          <div className={styles.mobileShell}>
            <div className={styles.mobileIntro}>
              <div>
                <p className={styles.eyebrow}>HOVIN · field receiving</p>
                <h2 id="hovin-home-title">Delivery evidence belongs on the same purchase record.</h2>
              </div>
              <p>
                After approval and dispatch, the hotel receiving team confirms what arrived. HOVIN is the
                phone companion for that handoff. Until a signed mobile release is published, use the web
                receiving workspace with a receiving-capable hotel role.
              </p>
              <Link href={PROCUREMENT_JOURNEY.hovin.href} className={styles.textLink}>
                Open the HOVIN release page <ArrowRight size={16} />
              </Link>
            </div>
            <HovinReceivingPreview />
          </div>
        </div>
      </section>

      <section className={styles.close}>
        <div className={styles.shell}>
          <div className={styles.closeHeading}>
            <p className={styles.eyebrow}>Enter the operating network</p>
            <h2>Open a workspace that matches your responsibility.</h2>
            <p>Hotels and Vendors can register directly. Receiving uses the hotel workspace and HOVIN.</p>
          </div>
          <div className={styles.roleStartGrid}>
            {roleStarts.map(({ icon: Icon, label, detail, href, action }) => (
              <Link href={href} className={styles.roleStart} key={label}>
                <Icon size={22} aria-hidden="true" />
                <div>
                  <span>{label}</span>
                  <p>{detail}</p>
                </div>
                <strong>
                  {action}
                  <ArrowRight size={15} />
                </strong>
              </Link>
            ))}
          </div>
          <Link href="/getting-started" className={styles.textLink}>
            See the guided onboarding path <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
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
