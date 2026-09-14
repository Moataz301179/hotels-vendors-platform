"use client";

import { useState, useMemo } from "react";
import { Calculator, DollarSign, TrendingUp, Building2, Wallet } from "lucide-react";

export function CreditCalculator() {
  const [cashPrice, setCashPrice] = useState("100000");
  const [creditPrice, setCreditPrice] = useState("115000");
  const [factoringFee, setFactoringFee] = useState("5");
  const [platformFee, setPlatformFee] = useState("2");

  const results = useMemo(() => {
    const cp = parseFloat(cashPrice) || 0;
    const crp = parseFloat(creditPrice) || 0;
    const ff = parseFloat(factoringFee) || 0;
    const pf = parseFloat(platformFee) || 0;

    const spread = crp - cp;
    const spreadPct = cp > 0 ? (spread / cp) * 100 : 0;
    const factoringCost = crp * (ff / 100);
    const platformCost = crp * (pf / 100);
    const netProfit = spread - factoringCost - platformCost;
    const netMargin = crp > 0 ? (netProfit / crp) * 100 : 0;

    return { spread, spreadPct, factoringCost, platformCost, netProfit, netMargin, supplierGets: cp };
  }, [cashPrice, creditPrice, factoringFee, platformFee]);

  const format = (n: number) => `EGP ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-white">Credit Line Calculator</h3>
          <p className="text-[12px] text-white/40">Model factoring scenarios and margins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input label="Cash Price (Supplier)" value={cashPrice} onChange={setCashPrice} icon={<DollarSign className="w-4 h-4" />} />
        <Input label="Credit Price (Hotel)" value={creditPrice} onChange={setCreditPrice} icon={<DollarSign className="w-4 h-4" />} />
        <Input label="Factoring Fee %" value={factoringFee} onChange={setFactoringFee} step="0.1" icon={<TrendingUp className="w-4 h-4" />} />
        <Input label="Platform Fee %" value={platformFee} onChange={setPlatformFee} step="0.1" icon={<Building2 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Credit Spread" value={format(results.spread)} sub={pct(results.spreadPct)} color="emerald" />
        <MetricCard label="Factoring Cost" value={format(results.factoringCost)} sub={`${factoringFee}%`} color="amber" />
        <MetricCard label="Platform Fee" value={format(results.platformCost)} sub={`${platformFee}%`} color="blue" />
        <MetricCard label="Hotels Vendors Net" value={format(results.netProfit)} sub={pct(results.netMargin)} color="purple" />
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[12px] font-semibold text-white/60 mb-3">Cash Flow Breakdown</p>
        <div className="space-y-3">
          <FlowRow label="Supplier receives (cash now)" amount={format(results.supplierGets)} color="text-white" icon={<Wallet className="w-4 h-4" />} />
          <FlowRow label="Factoring company earns" amount={format(results.factoringCost)} color="text-amber-400" icon={<TrendingUp className="w-4 h-4" />} />
          <FlowRow label="Hotels Vendors keeps" amount={format(results.netProfit)} color="text-purple-400" icon={<Building2 className="w-4 h-4" />} bold />
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, step = "1", icon }: { label: string; value: string; onChange: (v: string) => void; step?: string; icon: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-white/40 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">{icon}</span>
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:border-white/20"
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400", amber: "text-amber-400", blue: "text-blue-400", purple: "text-purple-400",
  };
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className={`text-[18px] font-bold mt-1 ${colors[color] || "text-white"}`}>{value}</p>
      <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>
    </div>
  );
}

function FlowRow({ label, amount, color, icon, bold }: { label: string; amount: string; color: string; icon: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white/20">{icon}</span>
        <span className={`text-[12px] text-white/50 ${bold ? "font-semibold" : ""}`}>{label}</span>
      </div>
      <span className={`text-[13px] font-bold ${color}`}>{amount}</span>
    </div>
  );
}
