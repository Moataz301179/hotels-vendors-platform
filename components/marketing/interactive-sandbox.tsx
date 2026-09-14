"use client";

/* InteractiveSandbox — try-before-you-buy micro-app.
   Zero-refresh role tabs, simulated platform actions + live trace terminal. */

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Hotel, Store, Landmark, ChevronRight, Zap, ScanLine, FileCheck2, CheckCircle2, XCircle } from "lucide-react";

type Role = "hotel" | "supplier" | "funder";

interface Trace { t: string; txt: string; ok?: boolean }

const traceSeq = 0;
function pushTrace(list: Trace[], txt: string, ok?: boolean): Trace[] {
  return [{ t: new Date().toISOString().slice(11, 19), txt, ok }, ...list].slice(0, 30);
}

export function InteractiveSandbox() {
  const [role, setRole] = useState<Role>("hotel");
  const [traces, setTraces] = useState<Trace[]>([
    { t: "--:--:--", txt: "[boot] Interactive Sandbox ready", ok: true },
  ]);
  const [approval, setApproval] = useState(0);
  const running = useRef(false);

  const log = useCallback((txt: string, ok?: boolean) => setTraces((p) => pushTrace(p, txt, ok)), []);

  useEffect(() => {
    setApproval(0);
    setTraces([{ t: "--:--:--", txt: `[boot] switched to ${role} view`, ok: true }]);
  }, [role]);

  async function runApproval() {
    if (running.current) return;
    running.current = true;
    setApproval(0);
    log("[approval] Draft PO #PO-2026-1182 created");
    const steps = [
      "[approval] Chef verified item specs",
      "[approval] F&B Manager approved",
      "[approval] Procurement verified pricing vs market",
      "[approval] Finance Controller cleared",
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 550));
      setApproval(i + 1);
      log(steps[i], true);
    }
    log("[approval] PO Approved — ETA e-invoice queued", true);
    running.current = false;
  }

  async function runPricing() {
    log("[marketpulse] EGP Egyptian Cotton price index: +12% projected next month", false);
    log("[marketpulse] Recommendation: lock in at current vendor rates (EGP 63/unit)", true);
  }

  async function runEtaCheck() {
    log("[compliance] validating invoice JSON against ETA schema v1.8", undefined);
    await new Promise((r) => setTimeout(r, 500));
    log("[compliance] ETA JSON payload Validated — 2 lines, tax compliant", true);
  }

  async function runCashOut() {
    log("[factoring] checking FRA registry for invoice INV-2847", undefined);
    await new Promise((r) => setTimeout(r, 450));
    log("[factoring] FRA audit passed — single-instance lock acquired", true);
    log("[factoring] verifying ETA e-invoice #ETA-1004-88231", undefined);
    await new Promise((r) => setTimeout(r, 450));
    log("[factoring] early payout approved (promo CHV000 applied)", true);
    log("[factoring] net cash-out: EGP 14,098 (2.1% fee)", true);
  }

  async function runDockScan() {
    log("[dock] photo upload received — scanning GRN...", undefined);
    await new Promise((r) => setTimeout(r, 500));
    log("[dock] 2 of 200 units missing (DAMAGED/SHORTAGE detected)", false);
    log("[dock] auto-credit note issued: EGP 504.00 to invoice balance", true);
  }

  const tabBtn = (id: Role, label: string, Icon: React.ElementType) => {
    const sel = role === id;
    return (
      <button
        onClick={() => setRole(id)}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
          sel ? "bg-[#314B43] text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
        }`}
      >
        <Icon size={15} /> {label}
      </button>
    );
  };

  const actionBtn = (label: string, icon: React.ElementType, fn: () => void) => {
    const Icon = icon;
    return (
      <button
        onClick={fn}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="flex items-center gap-2.5"><Icon size={15} className="text-slate-500" /> {label}</span>
        <ChevronRight size={15} className="text-slate-400" />
      </button>
    );
  };

  const approvalSteps = ["Draft", "F&B Approved", "Procurement", "Finance Cleared"];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      {/* Tab bar */}
      <div className="px-5 pt-5 flex gap-2 border-b border-slate-100 pb-4">
        {tabBtn("hotel", "Hotel View", Hotel)}
        {tabBtn("supplier", "Supplier View", Store)}
        {tabBtn("funder", "Funder View", Landmark)}
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* Left: actions */}
        <div className="p-5 space-y-3">
          {role === "hotel" && (
            <>
              {actionBtn("Simulate Multi-Tier Approval Chain", FileCheck2, runApproval)}
              {actionBtn("Lock-In Price Alert (AI MarketPulse)", Zap, runPricing)}
              {actionBtn("Validate ETA e-Invoice Payload", ScanLine, runEtaCheck)}
              {/* live approval progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">PO Approval Flow</span>
                  <span className="text-[11px] text-slate-400">{approval}/4</span>
                </div>
                <div className="flex gap-1">
                  {approvalSteps.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className={`h-1.5 rounded-full ${approval > i ? "bg-emerald-500" : "bg-slate-200"}`} />
                      <div className={`text-[9px] mt-1 text-center ${approval > i ? "text-emerald-700" : "text-slate-400"}`}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {role === "supplier" && (
            <>
              {actionBtn("Trigger 48h Cash-Out via Oliv", Landmark, runCashOut)}
              {actionBtn("Simulate HOVIN Dock Scan", ScanLine, runDockScan)}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <span className="font-bold">Promo CHV000</span> · 0% subscription · instant 48h liquidity fixing
              </div>
            </>
          )}

          {role === "funder" && (
            <>
              {actionBtn("Run FRA Credit-Risk Assessment", Landmark, runCashOut)}
              {actionBtn("Inspect Factoring Pool (Suez Canal Bank)", Landmark, runPricing)}
              {actionBtn("Validate ETA Invoice in Registry", ScanLine, runEtaCheck)}
            </>
          )}

          <div className="pt-3 border-t border-slate-100">
            <Link href="/register" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-[#314B43] text-white text-sm font-semibold hover:bg-[#314B43] transition-colors">
              Create free account <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* Right: trace terminal */}
        <div className="border-l border-slate-200 bg-[#0B0F17] p-4 min-h-[260px]">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-[10px] font-mono text-slate-400">hotelsvendors-agent — live trace</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
            {traces.map((tr, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-500 shrink-0">{tr.t}</span>
                <span className={
                  tr.ok === undefined ? "text-slate-300" : tr.ok ? "text-emerald-400" : "text-amber-400"
                }>{tr.txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
