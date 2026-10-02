"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

export default function YieldPage() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(2.1);
  const fee = Math.round(amount * (rate / 100) * 100) / 100;
  const net = amount - fee;

  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] flex items-center gap-1.5"><Calculator size={13} /> Dynamic Yield Calculator</div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">Early-payment discount simulator</h1>
          <p className="text-slate-600 text-sm mt-2">Move the sliders to see the factoring fee and net 48h payout for a supplier invoice.</p>
        </header>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between"><span>Invoice amount (EGP)</span><span className="font-semibold text-[#111827] tabular-nums">EGP {amount.toLocaleString()}</span></label>
            <input type="range" min={5000} max={5000000} step={5000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full accent-slate-900" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between"><span>Factoring rate</span><span className="font-semibold text-[#111827]">{rate.toFixed(2)}%</span></label>
            <input type="range" min={1.5} max={3.0} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-emerald-600" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Gross</div>
              <div className="text-sm font-bold text-[#111827] mt-1 tabular-nums">EGP {amount.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Fee ({rate}%)</div>
              <div className="text-sm font-bold text-[#111827] mt-1 tabular-nums">EGP {fee.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] text-emerald-600 uppercase">Net 48h payout</div>
              <div className="text-sm font-bold text-emerald-800 mt-1 tabular-nums">EGP {net.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
