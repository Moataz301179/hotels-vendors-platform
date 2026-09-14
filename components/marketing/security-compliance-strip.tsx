"use client";

/* HotelsVendors — Security & Compliance badges strip.
   Shows real certifications / verified trust signals near conversion.
   Per NO-FAKE-DATA: every badge here reflects a genuinely-held credential or
   hard compliance rail of the product. Do NOT add badges that aren't true. */

import { ShieldCheck, FileCheck2, Scale, Lock, Landmark, ScanEye } from "lucide-react";

type Badge = {
  icon: typeof ShieldCheck;
  title: string;
  sub: string;
};

const BADGES: Badge[] = [
  {
    icon: Scale,
    title: "ETA e-Invoicing",
    sub: "UUID + SHA-256 signing on every invoice",
  },
  {
    icon: Landmark,
    title: "FRA-Compliant Factoring",
    sub: "OLIV facility via licensed credit partner",
  },
  {
    icon: ShieldCheck,
    title: "AML Screened",
    sub: "Supplier & merchant anti-money-laundering checks",
  },
  {
    icon: FileCheck2,
    title: "KYC Verified Suppliers",
    sub: "Identity & tax-registry validation on signup",
  },
  {
    icon: Lock,
    title: "ISO 27001-aligned Security",
    sub: "Encryption at rest & in transit, RBAC",
  },
  {
    icon: ScanEye,
    title: "PCI-DSS Ready Payments",
    sub: "Tokenized card + InstaPay / Paymob rails",
  },
];

export function SecurityComplianceStrip({ title = "Trusted by design" }: { title?: string }) {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] mb-6">
          {title}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {BADGES.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-[#314B43] flex items-center justify-center">
                <b.icon size={17} className="text-white" />
              </div>
              <div className="text-sm font-semibold text-[#111827] leading-tight">{b.title}</div>
              <div className="text-[11px] text-slate-500 leading-snug">{b.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}