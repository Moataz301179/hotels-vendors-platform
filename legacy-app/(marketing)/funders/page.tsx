"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-10 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">Solutions</div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">For Funders & Banks</h1>
          <p className="text-slate-600 text-sm mt-2">Run risk-graded lending portfolios, verified receiving proof, and FRA-backed invoice locks. A desktop console built for institutional underwriting.</p>
        </header>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "Risk-graded portfolios", d: "Credit lines scored per buyer with live utilization." },
            { t: "Verified receiving proof", d: "Digital GRNs confirm goods before you fund." },
            { t: "FRA-backed invoice locks", d: "Single-instance locks prevent double-financing." },
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
