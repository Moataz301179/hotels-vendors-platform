import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import {
  Compass,
  Target,
  Hotel,
  Store,
  Truck,
  Landmark,
  FileCheck,
  ShieldCheck,
  Scale,
  Handshake,
  ArrowRight,
  Building2,
  BadgeCheck,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/about") },
  title: "About Us — HotelsVendors | The Operating System for Egyptian Hospitality Procurement",
  description:
    "HotelsVendors is a four-sided B2B marketplace built to digitize procurement for Egyptian hospitality — connecting hotels, verified suppliers, shared logistics, and factoring partners under ETA & FRA compliance.",
  keywords: [
    "B2B hospitality procurement Egypt",
    "hotel supply chain Egypt",
    "four-sided marketplace hospitality",
    "ETA e-invoicing compliance",
    "hospitality procurement platform",
    "منصة المشتريات الفندقية مصر",
    "تجهيزات الفنادق بالجملة",
  ],
  openGraph: {
    title: "About HotelsVendors — Egypt's Hospitality Procurement OS",
    description:
      "The four-sided marketplace connecting hotels, suppliers, logistics, and factoring — ETA & FRA compliant. Built from scratch for Egyptian hospitality.",
    type: "website",
  },
};

const MARKETPLACE_SIDES = [
  {
    icon: Hotel,
    title: "Hotels",
    desc: "Community-led purchasing, spend visibility, and ETA-compliant invoicing for independent properties and branded chains across Egypt.",
  },
  {
    icon: Store,
    title: "Verified Suppliers",
    desc: "Egyptian manufacturers and distributors list hospitality SKUs with fixed pricing, backed by onboarding verification and quality standards.",
  },
  {
    icon: Truck,
    title: "Shared Logistics",
    desc: "Route-consolidated delivery serving coastal and urban destinations, reducing the cost and friction of fragmented last-mile fulfillment.",
  },
  {
    icon: Landmark,
    title: "Factoring Partners",
    desc: "Licensed non-bank financiers provide embedded liquidity against approved invoices, shortening settlement in a historically slow cycle.",
  },
];

const VALUES = [
  {
    icon: BadgeCheck,
    title: "Honesty First",
    desc: "We publish what is true and verifiable — about our platform, our pricing, and our compliance. Trust is earned, not claimed.",
  },
  {
    icon: Scale,
    title: "Compliance as a Foundation",
    desc: "ETA e-invoicing and FRA-aligned operations are not add-ons. They are built into how every transaction moves through the platform.",
  },
  {
    icon: Handshake,
    title: "Built for Egypt",
    desc: "Procurement tools designed around Egyptian coastal logistics, regulatory reality, and the day-to-day realities of local hotel operations.",
  },
  {
    icon: ShieldCheck,
    title: "Every Transaction Governed",
    desc: "Authority matrices, audit trails, and role-based access ensure that every order is accountable and every invoice is traceable.",
  },
];

export default function AboutPage() {
  return (
    <main
      className="pt-28 pb-20"
      style={{ backgroundColor: "#ffffff", color: "#314B43", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* ── Hero ── */}
        <section className="max-w-3xl mb-20">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] mb-6"
            style={{ borderColor: "rgba(200,168,107,0.35)", backgroundColor: "rgba(200,168,107,0.08)", color: "#a8874a" }}
          >
            <Compass size={13} /> About HotelsVendors
          </span>
          <h1 className="text-[clamp(30px,5vw,46px)] font-semibold leading-[1.08] tracking-tight mb-6" style={{ color: "#c8a86b" }}>
            The Operating System for Egyptian Hospitality Procurement
          </h1>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: "#314B43" }}>
            HotelsVendors exists because the way Egyptian hotels buy was broken: fragmented supplier relationships, WhatsApp threads
            and spreadsheets, opaque pricing, slow settlement, and no national standard for tax-compliant invoicing. We set out to replace
            that chaos with a single, governed marketplace built for the way hospitality actually works in Egypt.
          </p>
          <p className="text-[16px] leading-relaxed" style={{ color: "rgba(49,75,67,0.72)" }}>
            We are a four-sided B2B platform connecting hotels, verified suppliers, shared logistics, and licensed factoring partners —
            all moving through ETA-compliant e-invoicing and governed by authority matrices designed for real-world procurement.
          </p>
        </section>

        {/* ── Mission & Vision ── */}
        <section className="grid md:grid-cols-2 gap-5 mb-20">
          <div className="p-8 rounded-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(200,168,107,0.35)" }}>
            <Target size={22} className="mb-4" style={{ color: "#c8a86b" }} />
            <h2 className="text-[16px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#a8874a" }}>
              Our Mission
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "#314B43" }}>
              To give every Egyptian hotel — from a boutique guesthouse to a 500-room Red Sea resort — a governed, transparent, and
              tax-compliant way to buy goods, manage spend, and get paid on time.
            </p>
          </div>
          <div className="p-8 rounded-2xl" style={{ backgroundColor: "rgba(171,162,148,0.10)", border: "1px solid rgba(171,162,148,0.35)" }}>
            <Compass size={22} className="mb-4" style={{ color: "#314B43" }} />
            <h2 className="text-[16px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#314B43" }}>
              Our Vision
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "#314B43" }}>
              To become the Amazon of Egyptian hospitality — the default operating system for how hotels buy, suppliers sell, logistics
              deliver, and financiers fund across Egypt and, in time, the wider MENA region.
            </p>
          </div>
        </section>

        {/* ── Why We Exist ── */}
        <section className="mb-20">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] block mb-2" style={{ color: "#a8874a" }}>
            Why We Exist
          </span>
          <h2 className="text-[22px] font-semibold mb-4" style={{ color: "#c8a86b" }}>
            A Problem Too Long Ignored
          </h2>
          <p className="text-[15px] leading-relaxed max-w-3xl mb-5" style={{ color: "#314B43" }}>
            Hospitality procurement in Egypt has long run on informal networks and paper. Coastal resorts depended on suppliers hundreds
            of kilometres away in Cairo or Alexandria, shipping goods with logistics costs that ate into every order. Invoices were
            manual, payment cycles stretched for months, and no single system gave management real visibility into what properties were
            buying — or from whom, and at what price.
          </p>
          <p className="text-[15px] leading-relaxed max-w-3xl" style={{ color: "rgba(49,75,67,0.72)" }}>
            Generic e-commerce and legacy ERP tools were built for other industries. They ignored Egyptian tax requirements, ignored the
            unique logistics of the Red Sea and Mediterranean coasts, and ignored how hospitality purchasing actually gets approved. So
            we built a platform that takes none of those realities for granted.
          </p>
        </section>

        {/* ── Four-Sided Marketplace ── */}
        <section className="mb-20">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] block mb-2" style={{ color: "#a8874a" }}>
            The Platform
          </span>
          <h2 className="text-[22px] font-semibold mb-6" style={{ color: "#c8a86b" }}>
            A Four-Sided Marketplace
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {MARKETPLACE_SIDES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="p-7 rounded-2xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(171,162,148,0.35)" }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#314B43", color: "#ffffff" }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: "#314B43" }}>
                    {s.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(49,75,67,0.72)" }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Compliance ── */}
        <section className="p-8 rounded-2xl mb-20" style={{ backgroundColor: "#314B43", color: "#ffffff" }}>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.14)", color: "#c8a86b" }}
            >
              <FileCheck size={22} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold mb-2">Compliance by Design</h2>
              <p className="text-[14px] leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                Every invoice produced on HotelsVendors is structured for submission to the Egyptian Tax Authority&apos;s e-invoicing
                system, and our factoring operations are aligned with the Financial Regulatory Authority (FRA) framework.
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(200,168,107,0.9)" }}>
                Legal Entity: Restaurants for E-Marketing · Cairo, Egypt · Unified Commercial Registry 105300900196948.
              </p>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="mb-20">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] block mb-2" style={{ color: "#a8874a" }}>
            Our Values
          </span>
          <h2 className="text-[22px] font-semibold mb-6" style={{ color: "#c8a86b" }}>
            How We Do Business
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="p-7 rounded-2xl" style={{ backgroundColor: "rgba(171,162,148,0.08)", border: "1px solid rgba(171,162,148,0.3)" }}>
                  <Icon size={20} className="mb-3" style={{ color: "#c8a86b" }} />
                  <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: "#314B43" }}>
                    {v.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(49,75,67,0.72)" }}>
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center max-w-2xl mx-auto">
          <Building2 size={26} className="mx-auto mb-4" style={{ color: "#c8a86b" }} />
          <h2 className="text-[22px] font-semibold mb-3" style={{ color: "#c8a86b" }}>
            See the Platform in Action
          </h2>
          <p className="text-[14px] mb-7" style={{ color: "rgba(49,75,67,0.72)" }}>
            Explore how HotelsVendors brings hotels, suppliers, logistics, and financing together on one governed marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "#314B43", color: "#ffffff" }}
            >
              Explore the Marketplace <ArrowRight size={15} />
            </Link>
            <Link
              href="/founder"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#314B43", border: "1px solid #ABA294" }}
            >
              A Word From Our Founder
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
