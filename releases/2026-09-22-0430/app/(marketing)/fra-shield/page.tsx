"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-10 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">Compliance</div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">FRA Regulatory Shield</h1>
          <p className="text-slate-600 text-sm mt-2">Automated Financial Regulatory Authority non-duplication checks. Every invoice is locked against the FRA electronic factoring registry before a single EGP is disbursed.</p>
        </header>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "Single-instance lock", d: "Each ETA invoice is registered once at the FRA registry — no double financing." },
            { t: "Audit trail", d: "Every approval, disbursement, and lock is written to an immutable audit log." },
            { t: "Multi-buyer visibility", d: "Cross-check whether an invoice is already financed on another platform." },
          ].map((f) => (
            <div key={f.t} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-[#111827] mb-1">{f.t}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/register" className="inline-flex items-center px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">Get started free</Link>
        </div>
      </div>
    </main>
  );
}
