"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-10 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">Financing</div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">Oliv Financing & Credit Lines</h1>
          <p className="text-slate-600 text-sm mt-2">Up to EGP 10M in credit lines for verified hotels, powered by Oliv. Non-recourse factoring and 48h supplier payouts with the CHV000 referral on every link.</p>
        </header>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "Credit line", v: "Up to EGP 10M", d: "Risk-graded per hotel on spend history." },
            { t: "48h payout", v: "1.5–3%", d: "Suppliers funded fast against verified GRNs." },
            { t: "Non-recourse", v: "Zero hotel risk", d: "Factored invoice risk is carried by the funder." },
          ].map((f) => (
            <div key={f.t} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-[10px] text-slate-500 uppercase">{f.t}</div>
              <div className="text-xl font-bold text-[#111827] mt-1">{f.v}</div>
              <p className="text-xs text-slate-500 mt-1.5">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">Referral code: <span className="font-mono text-slate-600">CHV000</span> — every CTA carries it automatically.</p>
        <div className="mt-10"><Link href="/register" className="inline-flex items-center px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a]">Get started free</Link></div>
      </div>
    </main>
  );
}
