import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import { Quote, ArrowRight, Compass, Target, PenLine, Eye } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/founder") },
  title: "Founder's Message — HotelsVendors | Moataz Abdel Ghani",
  description:
    "A letter from Moataz Abdel Ghani, Founder & CEO of HotelsVendors, on why we built Egypt's four-sided hospitality procurement marketplace — and the vision to become the Amazon of Egyptian hospitality.",
  keywords: [
    "HotelsVendors founder",
    "Egyptian hospitality procurement founder",
    "Moataz Abdel Ghani",
    "Amazon of Egyptian hospitality",
    "B2B hospitality vision",
  ],
  openGraph: {
    title: "A Word From Our Founder — HotelsVendors",
    description:
      "Moataz Abdel Ghani on the problem we set out to solve and the vision behind Egypt's four-sided hospitality procurement platform.",
    type: "website",
  },
};

const CHAPTERS = [
  {
    title: "The Problem I Kept Seeing",
    body: "Across Egyptian hospitality, the same story repeated itself. A property manager would buy linens or kitchen supplies the same way it had been done for decades — through phone calls, WhatsApp groups, and handshake agreements. There was no price transparency, no verification of who you were buying from, and no reliable way to prove a purchase was tax-compliant. Invoices moved slowly, and suppliers waited months for payment. This wasn't a technology problem in the abstract. It was a daily friction that every Egyptian hotel simply accepted.",
  },
  {
    title: "Why a Marketplace",
    body: "I came to believe the fix wasn't another ordering app bolted onto existing habits. It was a marketplace — one where hotels could buy with confidence, suppliers could sell to a verified network, logistics could consolidate valuable routes, and financiers could fund what was genuinely owed. A four-sided system, because that's how the industry actually operates. One side without the others is just another tool; together, they change the economics of the whole sector.",
  },
  {
    title: "Compliance Was Non-Negotiable",
    body: "From the first line of code, ETA e-invoicing and FRA-aligned factoring were built in — not bolted on later. Egyptian hospitality doesn't need another platform that pretends tax compliance is optional. It needs one where every transaction is structured to be compliant by default, so that a legitimate purchase is also a documented, auditable, and financeable one.",
  },
  {
    title: "The Long View",
    body: "We want HotelsVendors to become the Amazon of Egyptian hospitality — the operating system hotels reach for first, and the network that sets the standard for how the region buys. That is not a slogan we expect to happen overnight. It is the direction we make every decision against, one honest order at a time.",
  },
];

export default function FounderPage() {
  return (
    <main
      className="pt-28 pb-20"
      style={{ backgroundColor: "#ffffff", color: "#314B43", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-4xl px-6">
        {/* ── Header / Signature block ── */}
        <section className="mb-16">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] mb-6"
            style={{ borderColor: "rgba(200,168,107,0.35)", backgroundColor: "rgba(200,168,107,0.08)", color: "#a8874a" }}
          >
            <PenLine size={13} /> A Word From Our Founder
          </span>

          {/* Typographic portrait — no photo (no fabricated image) */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "#314B43", color: "#c8a86b" }}
            aria-label="Founder monogram"
          >
            <span className="text-[26px] font-semibold leading-none">MA</span>
          </div>

          <h1 className="text-[clamp(28px,5vw,42px)] font-semibold leading-[1.1] tracking-tight mb-4" style={{ color: "#c8a86b" }}>
            Why We Built HotelsVendors
          </h1>
          <p className="text-[15px] leading-relaxed mb-2" style={{ color: "rgba(49,75,67,0.72)" }}>
            A letter from <strong style={{ color: "#314B43" }}>Moataz Abdel Ghani</strong>, Founder &amp; CEO.
          </p>
        </section>

        {/* ── The letter ── */}
        <section className="mb-14">
          <div className="relative">
            <Quote size={34} className="absolute -top-3 -left-1" style={{ color: "#c8a86b", opacity: 0.35 }} />
            <p className="text-[19px] font-medium leading-relaxed pt-6 mb-6" style={{ color: "#314B43" }}>
              I have spent years inside Egyptian hospitality and finance, and the thing that surprised me most wasn&apos;t the complexity of
              the industry — it was how much of that complexity was unnecessary. Procuring goods should not be a logistical nightmare,
              a regulatory gamble, and a cash-flow burden all at once. We built HotelsVendors to take that weight off the people who run
              and supply our hotels.
            </p>
          </div>

          <div className="space-y-10">
            {CHAPTERS.map((c) => (
              <div key={c.title}>
                <h2 className="text-[17px] font-semibold mb-2 flex items-center gap-2" style={{ color: "#a8874a" }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#c8a86b" }} />
                  {c.title}
                </h2>
                <p className="text-[15px] leading-relaxed" style={{ color: "#314B43" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Signature ── */}
        <section className="p-8 rounded-2xl mb-16" style={{ backgroundColor: "#314B43", color: "#ffffff" }}>
          <Target size={22} className="mb-4" style={{ color: "#c8a86b" }} />
          <p className="text-[18px] font-semibold leading-relaxed mb-4" style={{ color: "#ffffff" }}>
            “We want the people who run Egyptian hospitality to spend their energy on great hospitality — and let a governed, honest
            platform handle the buying.”
          </p>
          <p className="text-[14px] font-semibold" style={{ color: "#c8a86b" }}>
            Moataz Abdel Ghani
          </p>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.75)" }}>
            Founder &amp; CEO, HotelsVendors
          </p>
        </section>

        {/* ── Values strip ── */}
        <section className="grid sm:grid-cols-3 gap-4 mb-16">
          <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: "rgba(171,162,148,0.08)", border: "1px solid rgba(171,162,148,0.3)" }}>
            <Compass size={20} className="mx-auto mb-2" style={{ color: "#c8a86b" }} />
            <p className="text-[13px] font-semibold" style={{ color: "#314B43" }}>Founder-Led</p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(49,75,67,0.6)" }}>Built from real industry experience, not a template.</p>
          </div>
          <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: "rgba(171,162,148,0.08)", border: "1px solid rgba(171,162,148,0.3)" }}>
            <Target size={20} className="mx-auto mb-2" style={{ color: "#c8a86b" }} />
            <p className="text-[13px] font-semibold" style={{ color: "#314B43" }}>Problem Obsessed</p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(49,75,67,0.6)" }}>We measure success by removing real friction.</p>
          </div>
          <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: "rgba(171,162,148,0.08)", border: "1px solid rgba(171,162,148,0.3)" }}>
            <Eye size={20} className="mx-auto mb-2" style={{ color: "#c8a86b" }} />
            <p className="text-[13px] font-semibold" style={{ color: "#314B43" }}>Long-Term Vision</p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(49,75,67,0.6)" }}>The Amazon of Egyptian hospitality — built step by step.</p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-[22px] font-semibold mb-3" style={{ color: "#c8a86b" }}>
            Learn More About the Platform
          </h2>
          <p className="text-[14px] mb-7" style={{ color: "rgba(49,75,67,0.72)" }}>
            Explore the four-sided marketplace, our compliance framework, and how to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "#314B43", color: "#ffffff" }}
            >
              About HotelsVendors <ArrowRight size={15} />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#314B43", border: "1px solid #ABA294" }}
            >
              Explore the Marketplace
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
