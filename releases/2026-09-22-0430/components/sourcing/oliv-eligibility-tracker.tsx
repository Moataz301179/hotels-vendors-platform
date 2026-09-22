"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle2, RefreshCw, ShieldCheck, Users, FileSearch, BadgeCheck } from "lucide-react";

/**
 * Oliv Supplier Eligibility & Referral Tracker.
 * Reads real eligible suppliers (TRN + est. annual >= EGP 10M) and their Oliv
 * attribution/referral status from /api/v1/oliv/eligibility. NO-FAKE-DATA:
 * only real supplier rows are shown.
 */

interface EligibleLead {
  name: string;
  taxId?: string;
  hasTrn: boolean;
  annualEgp?: number;
  eligible: boolean;
  reason?: string;
  category?: string;
  city?: string;
  governorate?: string;
}

interface Audit {
  supplierId: string;
  supplierTaxId: string;
  companyName: string;
  olivStatus: string;
  attributionSource: string;
  createdAt: string;
}

interface Payload {
  success: boolean;
  data?: {
    milestone?: { minAnnualEgp: number; eligibleCount: number; eligibleTop: EligibleLead[] };
    audits?: Audit[];
    message?: string;
  };
  error?: string;
}

const fmt = (n?: number) => (n == null ? "—" : "EGP " + n.toLocaleString("en-US"));

export function OlivEligibilityTracker({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const [data, setData] = useState<NonNullable<Payload["data"]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/v1/oliv/eligibility");
      const json: Payload = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load eligibility");
      setData(json.data ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load (loading starts true; deferred so no sync setState in effect).
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  const runMilestone = async () => {
    setRunning(true); setResult(null);
    try {
      const res = await fetch("/api/v1/oliv/eligibility", { method: "POST" });
      const json: Payload = await res.json();
      setResult(json.data?.message || "Referral updated.");
      await load();
    } catch (e) {
      setResult("Error: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setRunning(false);
    }
  };

  const mil = data?.milestone;

  return (
    <section aria-labelledby="oliv-eligibility-heading" className="mt-16">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${dark ? "text-[#ABA294]" : "text-[#8a6d3b]"}`}>Oliv Due Diligence</p>
          <h2 id="oliv-eligibility-heading" className={`text-2xl md:text-3xl font-bold tracking-tight mt-1 ${dark ? "text-white" : "text-[#111827]"}`}>
            Supplier Eligibility &amp; Referral Pipeline
          </h2>
          <p className={`text-sm mt-2 max-w-2xl ${dark ? "text-white/50" : "text-slate-600"}`}>
            Real Egyptian suppliers with a TRN and estimated annual revenue ≥ EGP 10M are
            flagged as eligible for an Oliv credit line — independent of HotelsVendors signup.
          </p>
        </div>
        <button
          onClick={runMilestone}
          disabled={running}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#314B43] text-white rounded-lg hover:bg-[#3a544a] disabled:opacity-40 ${dark ? "" : "shadow-sm"}`}
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
          {running ? "Referring…" : "Run Referral (CHV000)"}
        </button>
      </div>

      {result && (
        <div className={`text-xs mb-4 px-3 py-2 rounded-md ${String(result).startsWith("Error") ? (dark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700") : (dark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-800")}`}>
          {result}
        </div>
      )}
      {err && <div className={`text-xs mb-4 px-3 py-2 rounded-md ${dark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700"}`}>{err}</div>}

      {loading ? (
        <div className="text-sm text-slate-400">Loading real eligibility data…</div>
      ) : mil ? (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi tone={tone} icon={Users} label="Eligible suppliers" value={String(mil.eligibleCount)} />
            <Kpi tone={tone} icon={BadgeCheck} label="Min annual revenue" value="EGP 10M" />
            <Kpi tone={tone} icon={FileSearch} label="Referral code" value="CHV000" />
            <Kpi tone={tone} icon={ShieldCheck} label="Referred to Oliv" value={String((data?.audits ?? []).filter(a => a.olivStatus).length)} />
          </div>

          {/* Top eligible table */}
          <div className={`${dark ? "bg-[#12121a] border-white/10" : "bg-white border-slate-200"} border rounded-xl overflow-hidden`}>
            <div className={`px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40 border-white/[0.08]" : "text-slate-500 border-slate-100"}`}>
              Top eligible real suppliers
            </div>
            <div className={`divide-y ${dark ? "divide-white/[0.06]" : "divide-slate-100"}`}>
              {mil.eligibleTop.map((l) => {
                const referred = (data?.audits ?? []).some(a => a.supplierTaxId === l.taxId);
                return (
                  <div key={l.taxId + l.name} className="px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{l.name}</div>
                      <div className={`text-xs ${dark ? "text-white/45" : "text-slate-500"}`}>
                        TRN {l.taxId} · {l.category ?? "—"} · {l.city ?? ""} {l.governorate ?? ""}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold tabular-nums ${dark ? "text-white" : "text-slate-700"}`}>{fmt(l.annualEgp)}</div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      referred
                        ? (dark ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                        : (dark ? "bg-white/5 text-white/50 border-white/10" : "bg-slate-50 text-slate-500 border-slate-200")
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {referred ? "Referred to Oliv" : "Eligible · pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-400">No eligibility data.</div>
      )}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={`${dark ? "bg-[#12121a] border-white/10" : "bg-white border-slate-200"} border rounded-xl p-4`}>
      <div className="w-8 h-8 rounded-lg bg-[#314B43] flex items-center justify-center mb-2">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className={`text-lg font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>{value}</div>
      <div className={`text-xs ${dark ? "text-white/45" : "text-slate-500"}`}>{label}</div>
    </div>
  );
}