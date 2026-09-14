import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Lock,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
  Scale,
  ScrollText,
  Clock,
  PackageSearch,
  Route,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/hotels/join") },
  title: "Onboard Your Hotel — ETA e-Invoicing, Oliv Financing & Shared Logistics | HotelsVendors",
  description:
    "Join HotelsVendors: one regulated account for compliant ETA e-invoicing, embedded Oliv reverse-factoring terms, and shared-route logistics for your properties. Register your hotel, connect your ETA token, and start procuring.",
  openGraph: {
    title: "HotelsVendors — Onboard Your Hotel",
    description:
      "ETA-native e-invoicing, Olivier reverse-factoring terms, and shared-route coastal logistics — from one regulated account.",
    type: "website",
  },
};

/* ── Brand (no orange, no neon) ─────────────────────────────
   green   #314B43  accent / primary
   beige   #ABA294  supporting neutral
   grey    #646367  muted / secondary
   gold    #8a6d3b  headings / eyebrows
   ink     #111827  light-mode headings (unused here — dark OLED base)
   dark    #0c0c12  page base / #12121a surface            */

const STEPS = [
  {
    step: "01",
    title: "Register your hotel",
    icon: Building2,
    desc: "Create a regulated account in two minutes. Tell us whether you are a single property, chain, or management company. No cash ever moves on the platform — HotelsVendors is a workflow and compliance layer, not a payment intermediary.",
    points: [
      "Role preselects to Hotel (type=hotel)",
      "Regulated account with email verification",
      "Authorized-signatory onboarding for approvals",
    ],
    cta: { href: "/register?type=hotel", label: "Start hotel registration" },
  },
  {
    step: "02",
    title: "Connect ETA e-invoicing",
    icon: FileCheck2,
    desc: "Wire your Egyptian Tax Authority token to the compliance layer. Invoices are generated, signed, submitted and re-signed directly against the ETA e-invoicing API, with status callbacks tracked end-to-end — no manual re-entry.",
    points: [
      "ETA certificate / registration number + digital signature",
      "Automated submission and status callback handling",
      "Cancellation, rejection and re-submission workflows",
    ],
  },
  {
    step: "03",
    title: "Set up Oliv financing terms",
    icon: Landmark,
    desc: "Embed non-recourse liquidity on every confirmed invoice. Your supplier is funded directly by the factoring partner; you repay later on agreed terms. Every invoice is locked once in the FRA registry to prevent double financing.",
    points: [
      "Reverse-factoring / Net terms on confirmed deliveries",
      "Eligibility inquiry & offer selection via partner bridge",
      "FRA single-instance lock — no double financing",
    ],
  },
  {
    step: "04",
    title: "Go live with shared logistics",
    icon: Truck,
    desc: "Activate shared-route delivery to your receiving dock. Multi-supplier loads are consolidated across coastal clusters, with GPS tracking and digital proof of delivery that keeps the compliance trail complete.",
    points: [
      "Shared-route consolidation to coastal hubs",
      "Cold-chain capable & real-time tracking",
      "Digital POD closes the PO → ETA → GRN loop",
    ],
  },
];

const OFFERS = [
  {
    icon: FileCheck2,
    title: "ETA-compliant invoicing, automated",
    desc: "Invoices generated, signed and submitted to the Egyptian Tax Authority e-invoicing API with status callbacks — no manual tax re-entry per order.",
  },
  {
    icon: Landmark,
    title: "Embedded reverse-factoring",
    desc: "Suppliers get funded by the factoring partner against confirmed deliveries while you repay on agreed terms. Non-recourse liquidity on every invoice.",
  },
  {
    icon: Lock,
    title: "FRA anti-fraud shield",
    desc: "Three-way matching (PO + ETA UUID + GRN) and a SHA-256 tamper-proof audit trail. Each invoice is locked once in the FRA electronic registry.",
  },
  {
    icon: Route,
    title: "Shared-route logistics",
    desc: "Multi-supplier loads consolidated onto shared routes to Red Sea and coastal clusters, with GPS tracking and digital proof of delivery.",
  },
  {
    icon: PackageSearch,
    title: "Fixed-price hospitality catalog",
    desc: "10,000+ SKUs across six hospitality categories from vetted suppliers — browse a fixed-price catalog instead of negotiating order by order.",
  },
  {
    icon: Scale,
    title: "Risk-based credit orchestration",
    desc: "Seasonal, occupancy-linked credit and a hospitality credit-score engine inform factoring eligibility — so terms adapt to your actual procurement.",
  },
  {
    icon: Users,
    title: "Multi-property governance",
    desc: "One account across your chain or management portfolio with role-based approval chains and per-property spend visibility.",
  },
  {
    icon: ScrollText,
    title: "Immutable audit trail",
    desc: "Every approval, disbursement and ETA status change is written to a tamper-proof chain — audit-ready for your controllers and regulators.",
  },
];

const TRUST = [
  {
    icon: FileCheck2,
    label: "ETA",
    text: "Egyptian Tax Authority e-invoicing integration",
  },
  {
    icon: ShieldCheck,
    label: "FRA",
    text: "Anti-fraud registry lock against double financing",
  },
  {
    icon: Lock,
    label: "KYC / AML",
    text: "Regulated account onboarding with signatory verification",
  },
  {
    icon: Scale,
    label: "Compliance",
    text: "SHA-256 audit trail on all approvals and disbursements",
  },
];

export default function HotelJoinPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#0c0c12", color: "#ffffff" }}
    >
      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Clean branded overlay in brand greens — subtle, non-neon */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(49,75,67,0.55) 0%, rgba(12,12,18,0) 60%), radial-gradient(ellipse 60% 50% at 10% 10%, rgba(138,109,59,0.15) 0%, rgba(12,12,18,0) 55%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-20 sm:pt-36 sm:pb-24">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] mb-7"
            style={{ borderColor: "rgba(138,109,59,0.4)", color: "#8a6d3b", backgroundColor: "rgba(138,109,59,0.08)" }}
          >
            <Building2 size={12} />
            Hotel Onboarding
          </div>

          <h1 className="max-w-3xl text-[clamp(32px,5.5vw,56px)] font-semibold leading-[1.05] tracking-tight">
            Onboard your hotel onto a{" "}
            <span style={{ color: "#8a6d3b" }}>compliant procurement</span>{" "}
            operating system.
          </h1>

          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "#ABA294" }}>
            HotelsVendors unites three capabilities your procurement already depends on — ETA-compliant
            e-invoicing, embedded reverse-factoring terms, and shared-route logistics — behind one
            regulated account. Register once, connect your ETA token, and operate every property
            through a single, audit-ready workflow.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/register?type=hotel"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[14px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6d3b]"
              style={{ backgroundColor: "#314B43", color: "#ffffff" }}
            >
              Register your hotel <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-[14px] font-medium transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6d3b]"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ABA294" }}
            >
              Talk to our team
            </Link>
          </div>

          {/* Trust badges */}
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Compliance and trust">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <li
                  key={t.label}
                  className="flex items-start gap-3 rounded-xl border p-4"
                  style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#12121a" }}
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "rgba(49,75,67,0.25)", color: "#314B43", border: "1px solid rgba(49,75,67,0.5)" }}
                  >
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#8a6d3b" }}>
                      {t.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: "#646367" }}>
                      {t.text}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: "#8a6d3b" }}>
              How onboarding works
            </div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Four steps from signature to live procurement.
            </h2>
          </div>

          <ol className="grid gap-5 lg:grid-cols-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.step}
                  className="flex flex-col rounded-2xl border p-7"
                  style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#12121a" }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(49,75,67,0.2)", color: "#314B43", border: "1px solid rgba(49,75,67,0.45)" }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "#8a6d3b" }}>
                      Step {s.step}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#ABA294" }}>
                    {s.desc}
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[13px]" style={{ color: "#646367" }}>
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#314B43" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  {s.cta && (
                    <Link
                      href={s.cta.href}
                      className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6d3b]"
                      style={{ backgroundColor: "#314B43", color: "#ffffff" }}
                    >
                      {s.cta.label} <ArrowRight size={14} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ═══════════════════════ WHAT YOU GET ═══════════════════════ */}
      <section className="border-y border-white/[0.06] py-20" style={{ backgroundColor: "#0e0e15" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: "#8a6d3b" }}>
              What you get
            </div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Real capabilities wired into the platform — not a static form.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map((o) => {
              const Icon = o.icon;
              return (
                <div
                  key={o.title}
                  className="flex flex-col rounded-2xl border p-6 transition-colors hover:border-white/[0.14] focus-within:border-white/[0.14]"
                  style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#12121a" }}
                >
                  <span
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(49,75,67,0.2)", color: "#314B43", border: "1px solid rgba(49,75,67,0.45)" }}
                  >
                    <Icon size={18} />
                  </span>
                  <h3 className="text-[15px] font-semibold text-white">{o.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#646367" }}>
                    {o.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CLOSING CTA ═══════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(49,75,67,0.2)", border: "1px solid rgba(49,75,67,0.45)" }}>
            <Wallet size={22} style={{ color: "#314B43" }} />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to bring your properties onto one platform?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#ABA294" }}>
            Register your account, connect your ETA token, and set up financing and logistics terms.
            Most registrations move from first sign-in to live onboarding within a few days.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register?type=hotel"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6d3b]"
              style={{ backgroundColor: "#314B43", color: "#ffffff" }}
            >
              Register your hotel <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border px-8 py-3.5 text-[14px] font-medium transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a6d3b]"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "#ABA294" }}
            >
              Talk to our team
            </Link>
          </div>

          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px]" style={{ color: "#646367" }}>
            <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Egypt — hospitality first</span>
            <span className="inline-flex items-center gap-1.5"><Store size={13} /> Fixed-price vetted catalog</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> ETA & FRA audit-ready</span>
          </p>
        </div>
      </section>
    </main>
  );
}
