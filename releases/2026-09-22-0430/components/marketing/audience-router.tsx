"use client";

/* AudienceRouter — smart intent routing below the hero.
   Zero-refresh persona toggle (Hotel / Supplier / Funder), driven by
   ?role=hotel|supplier|funder URL param (or ?ref=CHV000 → supplier persona).
   Each persona surfaces role-specific moats + primary CTAs. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Hotel, Store, Landmark, Truck, ArrowRight, CheckCircle2 } from "lucide-react";

type Audience = "hotel" | "supplier" | "funder" | "carrier";

const AUDIENCES: { id: Audience; label: string; icon: React.ElementType; tag: string }[] = [
  { id: "hotel", label: "HOTELS", icon: Hotel, tag: "BUYERS" },
  { id: "supplier", label: "SUPPLIERS", icon: Store, tag: "FULFILLMENT" },
  { id: "funder", label: "FUNDERS", icon: Landmark, tag: "LIQUIDITY" },
  { id: "carrier", label: "CARRIERS", icon: Truck, tag: "LOGISTICS" },
];

const PERSONAS: Record<Audience, { heading: string; points: string[]; ctaPrimary: React.ReactNode; }> = {
  hotel: {
    heading: "Enterprise-grade procurement, purpose-built for multi-property hotel groups.",
    points: [
      "Multi-tier approval matrix — Chef → F&B → Procurement → Finance, routed by dollar threshold",
      "Departmental budget locks & spend guardrails with AI forecasting",
      "Native ETA e-invoicing & e-Waybill compliance, submission-ready",
      "Web dashboard sandbox — run your procurement live before you commit",
    ],
    ctaPrimary: (
      <Link href="/register?type=hotel" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">
        Request Enterprise Demo <ArrowRight size={15} />
      </Link>
    ),
  },
  supplier: {
    heading: "List free, get paid in 48 hours. Zero platform friction.",
    points: [
      "0% platform & listing fees — keep more of every order",
      "Instant 48h cash-out via Oliv — promo code CHV000",
      "HOVIN scan-to-fulfill — accept orders, scan, ship from your phone",
      "3× profile verification boost for faster buyer trust",
    ],
    ctaPrimary: (
      <Link href="/register?type=supplier" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">
        Join Free as Vendor <ArrowRight size={15} />
      </Link>
    ),
  },
  funder: {
    heading: "FRA-compliant factoring pool with institutional-grade risk controls.",
    points: [
      "FRA-compliant e-factoring registry with single-instance invoice locks",
      "Oliv integrated facility for pooled liquidity",
      "Automated credit-risk scoring on verified GRN-backed invoices",
      "48h reverse-factoring pool across Egyptian hospitality suppliers",
    ],
    ctaPrimary: (
      <Link href="/funders" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">
        Access Liquidity Portal <ArrowRight size={15} />
      </Link>
    ),
  },
  carrier: {
    heading: "Route freight, dock slots, and deliveries across Egypt's corridors.",
    points: [
      "Accept trip jobs & dock-slot bookings from the field",
      "Live GPS tracking and e-waybill QR verification",
      "Shared freight pooling across resort corridors",
      "Dispatch, proof-of-delivery, and instant credit notes",
    ],
    ctaPrimary: (
      <Link href="/register?type=carrier" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">
        Join as Carrier <ArrowRight size={15} />
      </Link>
    ),
  },
};

export function AudienceRouter() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const paramRole = searchParams.get("role");
  // ?ref=CHV000 is a supplier tie-in; explicit ?role wins.
  const initial: Audience =
    (paramRole as Audience) || (ref ? "supplier" : "hotel") || "hotel";
  const [active, setActive] = useState<Audience>(initial);

  useEffect(() => {
    const r = searchParams.get("role") as Audience | null;
    if (r && ["hotel", "supplier", "funder", "carrier"].includes(r)) setActive(r);
    else if (ref && !r) setActive("supplier");
  }, [searchParams, ref]);

  const persona = PERSONAS[active];

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {/* Role toggle bar */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {AUDIENCES.map((a) => {
            const Icon = a.icon;
            const selected = active === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border text-sm font-semibold transition-all ${
                  selected
                    ? "bg-[#314B43] text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                <Icon size={17} />
                {a.label}
              </button>
            );
          })}
        </div>

        {/* Persona panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center" key={active}>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {AUDIENCES.find((a) => a.id === active)?.tag}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">{persona.heading}</h3>
            <ul className="mt-5 space-y-2.5">
              {persona.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6">{persona.ctaPrimary}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              {active === "hotel" ? "HotelsVendors Web · Hotel"
                : active === "supplier" ? "HOVIN App · Supplier"
                : active === "funder" ? "HotelsVendors Web · Funder"
                : "HOVIN App · Carrier"}
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {active === "hotel" && (
                <>
                  <p className="flex justify-between"><span className="text-slate-500">Approval chain</span><span className="font-medium text-slate-900">4-tier · auto-routed</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Spend forecast</span><span className="font-medium text-emerald-700">↓ 8% MoM</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">ETA invoices</span><span className="font-medium text-emerald-700">All submitted</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Properties</span><span className="font-medium text-slate-900">3 managed</span></p>
                </>
              )}
              {active === "supplier" && (
                <>
                  <p className="flex justify-between"><span className="text-slate-500">Platform + listing fees</span><span className="font-medium text-emerald-700">0%</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Cash-out</span><span className="font-medium text-slate-900">48h via Oliv</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Promo code</span><span className="font-medium text-slate-900">CHV000</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Profile verification</span><span className="font-medium text-emerald-700">3× boost</span></p>
                </>
              )}
              {active === "funder" && (
                <>
                  <p className="flex justify-between"><span className="text-slate-500">Registry</span><span className="font-medium text-slate-900">FRA-compliant</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Facility</span><span className="font-medium text-slate-900">Suez Canal Bank</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Credit scoring</span><span className="font-medium text-emerald-700">Automated</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Invoice locks</span><span className="font-medium text-emerald-700">Single-instance</span></p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}