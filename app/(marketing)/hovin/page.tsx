import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Smartphone, Eye, ShieldCheck, Compass, PackageSearch, Bell, ScanLine, Truck, Hotel, Store, Ship } from "lucide-react";
import { HovinPhoneMockup } from "@/components/invo/hovin-phone-mockup";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/hovin") },
  title: "HOVIN — Receiving and delivery evidence for hospitality operations",
  description: "HOVIN is the field layer for receiving, delivery evidence and ETA updates connected to the HotelsVendors operating record.",
  openGraph: {
    title: "HOVIN — HotelsVendors field operations",
    description: "Receiving, delivery evidence and ETA updates connected to the same order record.",
    type: "website",
  },
};

const FEATURES = [
  { icon: PackageSearch, title: "Order context", desc: "Open the approved order, quantities and delivery plan before receiving begins." },
  { icon: Eye, title: "Receiving evidence", desc: "Capture quantities, exceptions and receipt evidence against the same order record." },
  { icon: ShieldCheck, title: "ETA updates", desc: "Keep the hotel and supplier view aligned when delivery timing changes." },
  { icon: Bell, title: "Exception alerts", desc: "Surface missing quantities, late deliveries and unresolved proof for review." },
  { icon: Compass, title: "Connected handoffs", desc: "Pass verified status from supplier to carrier to hotel without a second ledger." },
  { icon: Smartphone, title: "Protected web fallback", desc: "Until a signed mobile release is verified, use the authenticated web workspace." },
];

const AUDIENCE_ROLES = [
  {
    icon: Hotel,
    title: "For Hotel Purchasing & Personnel",
    items: [
      "Approve purchase orders and raise requisitions on the move — the same approval matrix as web.",
      "Scan dock deliveries against orders and create GRNs with camera QR in a few taps.",
      "Track order status, incoming stock, and spend live across properties.",
      "Give each department (F&B, housekeeping, engineering) its own view and budget guardrails.",
    ],
  },
  {
    icon: Store,
    title: "For Suppliers",
    items: [
      "Receive a hotel PO instantly in one mobile inbox — no lost order emails between Cairo and Sharm.",
      "Confirm, stage, and mark Ship with live status visible to the buyer.",
      "Submit dispatch and receipt evidence so the hotel can reconcile the order and invoice.",
      "Manage listings and pricing directly from your phone.",
    ],
  },
  {
    icon: Ship,
    title: "For Carriers & Logistics",
    items: [
      "Accept dispatch trips and see pickup / drop-off and cargo in one tap.",
      "Get GPS-guided routing and live delivery tracking shared with the hotel.",
      "Scan barcodes and capture proof-of-delivery at the dock.",
      "Close trips with POD and automatically kick off the goods-received flow.",
    ],
  },
];

export default function HOVINPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-32 pb-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#28618f] mb-3">HOVIN · Field operations layer</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#20272b] tracking-tight mb-4">Receiving that stays connected.</h1>
          <p className="text-lg text-[#646367] max-w-2xl mx-auto mb-6">
            HOVIN connects the work at the dock to the HotelsVendors order record: confirm what arrived,
            capture proof, update ETA and keep the next decision visible.
          </p>
          <div className="relative mx-auto mb-8 w-56 h-56">
            <Image src="/logo-hovin.png" alt="HOVIN app logo" fill className="object-contain" priority />
          </div>

          <div className="mx-auto max-w-xl rounded-xl border border-[#c8d2d4] bg-[#e6edf0] px-5 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#28618f]">Release status</p>
            <p className="mt-1 text-sm text-[#56636a]">Signed App Store and Google Play distribution is not published yet. Use the protected web workspace while device release verification is completed.</p>
            <Link href="/login" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#28618f]">Use the web workspace <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* ▸ Exploring HOVIN — phone mockup section */}
      <section id="explore-hovin" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] mb-3">Exploring HOVIN</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4D4A46] tracking-tight">
              The field-day app, up close
            </h2>
            <p className="text-[#646367] mt-2 max-w-xl mx-auto text-sm">
              A preview of the HOVIN app — orders, dock scanning, and delivery tracking
              in one mobile view.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="py-4">
              <HovinPhoneMockup />
            </div>

            {/* Right column — highlights */}
            <div className="space-y-4">
              <MockHighlight icon={ScanLine} title="Pick to dock, in taps" desc="Accept orders, scan dock QR, and generate a GRN — all without a desktop." />
              <MockHighlight icon={Truck} title="Live delivery tracking" desc="Carriers and dock teams follow every shipment with GPS and pod confirmation." />
              <MockHighlight icon={PackageSearch} title="One inbox for every order" desc="Every hotel PO lands in a single mobile feed — ready, in transit, or delivered." />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-y border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#4D4A46] tracking-tight text-center mb-8">Everything the field needs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-[#314B43] flex items-center justify-center mb-3">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-[#4D4A46] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#646367]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who HOVIN serves — per-audience roles */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] mb-3">Who It&apos;s For</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4D4A46] tracking-tight">
              What HOVIN does for each role
            </h2>
            <p className="text-[#646367] mt-2 max-w-xl mx-auto text-sm">
              One app, tailored to how each part of your operation actually works in the field.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {AUDIENCE_ROLES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="border border-slate-200 rounded-xl p-6 flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-[#314B43] flex items-center justify-center mb-4">
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-[#4D4A46] mb-3">{a.title}</h3>
                  <ul className="space-y-2.5">
                    {a.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#646367]">
                        <CheckCircle2 size={15} className="text-[#314B43] mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 text-center">
          <CheckCircle2 size={32} className="text-[#314B43] mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-[#4D4A46] mb-3">One platform. Two layers.</h2>
          <p className="text-[#646367] mb-6">Hotels run procurement on the web. The field runs on HOVIN.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#314B43] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Open the protected web workspace <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function MockHighlight({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-[#314B43] flex items-center justify-center shrink-0">
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <div className="font-semibold text-[#4D4A46]">{title}</div>
        <div className="text-sm text-[#646367] mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.6 1.8 13.8 12 3.6 22.2c-.36-.3-.6-.8-.6-1.4V3.2c0-.6.24-1.1.6-1.4Zm17.4 7.9L9.4 1.4l5.7 8.3 6-1.4c.26-.06.53.03.72.22-.1.06-.18.12-.24.18Zm3 .9c-.42.42-1.02.53-1.5.33L7.9 5.5l9.4 8.9 5.6 2.7c.54-.08 1.02-.54 1.02-1.14v-4.6l-1.22-1.8h.1c-.01.01-.02.02-.03.03l-1.1 1.1 2.2-2.2c.18-.18.53-.17.72 0 .05.05.08.1.11.16Z" />
    </svg>
  );
}
