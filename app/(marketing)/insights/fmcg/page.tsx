"use client";

/* Manufacturer Market-Share Dashboard — anonymized category aggregation.
   Wired to /api/v1/analytics/market-share. Enterprise SaaS tier. */

import { useEffect, useState } from "react";
import { TrendingUp, Package, Banknote, BarChart3 } from "lucide-react";

interface ShareRow { category: string; brand: string; volume: number; gmvEGP: number; avgUnitPrice: number; sharePct: number }

const CATEGORY_LABEL: Record<string, string> = {
  F_AND_B: "F&B", CONSUMABLES: "Consumables", GUEST_SUPPLIES: "Guest Amenities", FFE: "FF&E", SERVICES: "Services",
};

export default function FmcgIntelligencePage() {
  const [rows, setRows] = useState<ShareRow[]>([]);
  const [cat, setCat] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/analytics/market-share")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRows(d.data.rows); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cats = ["ALL", ...new Set(rows.map((r) => r.category))];
  const filtered = cat === "ALL" ? rows : rows.filter((r) => r.category === cat);

  const totalGMV = filtered.reduce((s, r) => s + r.gmvEGP, 0);
  const totalVol = filtered.reduce((s, r) => s + r.volume, 0);

  return (
    <main style={{ backgroundColor: "#0B0F17", color: "#ffffff", minHeight: "100vh" }}>
      <section className="pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#34d399" }}>Data Lake</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">Enterprise SaaS</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight mb-1">Manufacturer Market-Share Intelligence</h1>
          <p className="text-sm text-slate-400 mb-8">Anonymized category aggregation — Volume GMV, Average Unit Price, Brand Share. Ready for subscription tiers.</p>

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Kpi icon={Package} label="Catalog Volume (units)" value={totalVol.toLocaleString()} accent="#34d399" />
            <Kpi icon={Banknote} label="Category GMV" value={`EGP ${totalGMV.toLocaleString()}`} accent="#34d399" />
            <Kpi icon={BarChart3} label="Brands Tracked" value={String(new Set(filtered.map((r) => r.brand)).size)} accent="#f59e0b" />
            <Kpi icon={TrendingUp} label="Categories" value={String(new Set(filtered.map((r) => r.category)).size)} accent="#f59e0b" />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={cat === c ? { backgroundColor: "#34d399", color: "#0B0F17" } : { border: "1px solid #1e293b", color: "#94a3b8" }}
              >
                {c === "ALL" ? "All Categories" : CATEGORY_LABEL[c] || c}
              </button>
            ))}
          </div>

          {/* Share table */}
          {loading ? (
            <div className="text-slate-500 text-sm py-16 text-center">Loading anonymized aggregation…</div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400" style={{ fontSize: 11 }}>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Brand</th>
                    <th className="text-right px-4 py-3 font-medium">Volume</th>
                    <th className="text-right px-4 py-3 font-medium">Avg Unit (EGP)</th>
                    <th className="text-right px-4 py-3 font-medium">GMV (EGP)</th>
                    <th className="text-right px-4 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.category + r.brand} className="border-b border-slate-800/50 hover:bg-[#3a544a]/20">
                      <td className="px-4 py-3 text-slate-300">{CATEGORY_LABEL[r.category] || r.category}</td>
                      <td className="px-4 py-3 font-medium text-white">{r.brand}</td>
                      <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{r.volume.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{r.avgUnitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-200 tabular-nums">{r.gmvEGP.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-emerald-400 font-semibold tabular-nums">{r.sharePct}%</span>
                          <span className="w-16 h-1.5 rounded-full bg-[#3a544a] overflow-hidden">
                            <span className="block h-full" style={{ width: `${r.sharePct}%`, background: "#34d399" }} />
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-6 text-[11px] text-slate-500">
            Data anonymized at source. No buyer PII exposed. Available via Manufacturer Insights — Enterprise SaaS subscription tier.
          </p>
        </div>
      </section>
    </main>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-4" style={{ backgroundColor: "#111827" }}>
      <Icon size={16} style={{ color: accent }} className="mb-2" />
      <div className="text-xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
