"use client";

import { useState } from "react";
import { Calculator, TrendingUp, Wallet, PackageCheck } from "lucide-react";

export default function FoodCostCalculatorPage() {
  // Inputs (EGP, monthly)
  const [monthlyRevenue, setMonthlyRevenue] = useState(2500000); // F&B revenue
  const [monthlyPurchases, setMonthlyPurchases] = useState(900000); // COGS purchases
  const [fxMove, setFxMove] = useState(15); // % FX-driven reprice on reorder
  const [fxExposure, setFxExposure] = useState(40); // % of purchases import-sensitive
  const [spoilage, setSpoilage] = useState(4); // freight/spoilage % of purchases

  // Standard vs "true Egypt" food cost
  const stdCostPct = monthlyRevenue ? (monthlyPurchases / monthlyRevenue) * 100 : 0;
  const fxHaircut = monthlyPurchases * (fxExposure / 100) * (fxMove / 100);
  const spoilageCost = monthlyPurchases * (spoilage / 100);
  const trueCost = monthlyPurchases + fxHaircut + spoilageCost;
  const trueCostPct = monthlyRevenue ? (trueCost / monthlyRevenue) * 100 : 0;
  const gapPct = trueCostPct - stdCostPct;
  const annualSavings = Math.round((trueCost - monthlyPurchases) * 12);

  const fmt = (n: number) => "EGP " + Math.round(n).toLocaleString("en-EG");
  const pct = (n: number) => n.toFixed(1) + "%";

  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] flex items-center gap-1.5">
            <Calculator size={13} /> Egypt Food-Cost Calculator
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">
            What Is Your Hotel&apos;s True Food-Cost Percentage?
          </h1>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            The global &quot;30% rule&quot; assumes stable FX. In Egypt, EGP moves, imports dominate
            (wheat, cooking oil, dairy, coffee), and freight inflates cost. This calculator estimates
            the <span className="font-semibold text-[#111827]">true</span> food-cost % once you add FX repricing, import exposure, and spoilage.
          </p>
          <p className="text-[11px] text-slate-400 mt-3">
            Illustrative math — adjust inputs to your property. Not financial advice; no fabricated data.
          </p>
        </header>

        {/* Inputs */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between">
              <span>Monthly F&amp;B revenue (EGP)</span>
              <span className="font-semibold text-[#111827] tabular-nums">{fmt(monthlyRevenue)}</span>
            </label>
            <input type="range" min={500000} max={15000000} step={50000} value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} className="w-full accent-slate-900" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between">
              <span>Monthly F&amp;B purchases / COGS (EGP)</span>
              <span className="font-semibold text-[#111827] tabular-nums">{fmt(monthlyPurchases)}</span>
            </label>
            <input type="range" min={100000} max={6000000} step={50000} value={monthlyPurchases} onChange={(e) => setMonthlyPurchases(Number(e.target.value))} className="w-full accent-slate-900" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between">
              <span>Expected EGP move on reorder (%)</span>
              <span className="font-semibold text-[#111827] tabular-nums">{fxMove.toFixed(0)}%</span>
            </label>
            <input type="range" min={0} max={40} step={1} value={fxMove} onChange={(e) => setFxMove(Number(e.target.value))} className="w-full accent-amber-600" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between">
              <span>Import-sensitive purchases (%)</span>
              <span className="font-semibold text-[#111827] tabular-nums">{fxExposure.toFixed(0)}%</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={fxExposure} onChange={(e) => setFxExposure(Number(e.target.value))} className="w-full accent-amber-600" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-2 flex justify-between">
              <span>Freight / spoilage on purchases (%)</span>
              <span className="font-semibold text-[#111827] tabular-nums">{spoilage.toFixed(0)}%</span>
            </label>
            <input type="range" min={0} max={15} step={1} value={spoilage} onChange={(e) => setSpoilage(Number(e.target.value))} className="w-full accent-amber-600" />
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Standard food cost</div>
              <div className="text-lg font-bold text-[#111827] mt-1 tabular-nums">{pct(stdCostPct)}</div>
            </div>
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] text-emerald-600 uppercase">True Egypt food cost</div>
              <div className="text-lg font-bold text-emerald-800 mt-1 tabular-nums">{pct(trueCostPct)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <TrendingUp size={18} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-[#111827]">Hidden annual gap ≈ {fmt(annualSavings)}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                FX repricing + spoilage add ~{pct(gapPct)} to your true food cost vs. the textbook figure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-start gap-3">
              <PackageCheck size={18} className="text-[#314B43] mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#111827]">Price-lock procurement</div>
                <p className="text-xs text-slate-600 mt-1">Fixed-price supplier catalogs hedge your imports against EGP moves.</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-start gap-3">
              <Wallet size={18} className="text-[#8a6d3b] mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#111827]">48h factoring</div>
                <p className="text-xs text-slate-600 mt-1">Buy at today&apos;s price, pay suppliers via Oliv on net-60 — suppliers get paid in 48h.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
