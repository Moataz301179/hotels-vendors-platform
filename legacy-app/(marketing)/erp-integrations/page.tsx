"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-10 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b]">Integrations</div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">ERP Integrations</h1>
          <p className="text-slate-600 text-sm mt-2">Bi-directional synchronisation with the systems hotels already run: SAP, Odoo, Oracle Opera PMS, and local Egyptian accounting packages.</p>
        </header>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "SAP", what: "BAPI PO creation", dir: "OUT" },
            { name: "Odoo", what: "Purchase order sync", dir: "BOTH" },
            { name: "Oracle Opera", what: "PMS procurement", dir: "OUT" },
            { name: "cXML / Local", what: "eProcurement adapters", dir: "BOTH" },
          ].map((e) => (
            <div key={e.name} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-[#111827]">{e.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{e.what}</div>
              <span className="inline-block text-[10px] mt-2 px-1.5 py-0.5 rounded bg-[#ABA294] text-[#4D4A46] border border-[#ABA294]">{e.dir}</span>
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
