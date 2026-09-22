"use client";

/* CashOutModal — factoring breakdown for the "Cash out in 48h →" CTA.
   Per the platform spec: clicking Cash out presents a transparent financial
   summary — Gross Invoice Value, Disbursal Timeline, Factoring Spread,
   Net Disbursed Amount — plus live trust/compliance status badges. */

import { useEffect, useMemo, useState } from "react";
import {
  Banknote, X, Clock, ShieldCheck, FileCheck2, Lock, ArrowRight, CheckCircle2,
} from "lucide-react";

export interface CashOutLine {
  sku: string;
  item: string;
  qty: number;
  total: number;
}

interface Props {
  poRef: string;
  property: string;
  lines: CashOutLine[];
  gross: number;          // EGP — gross invoice value
  spreadPct: number;      // factoring spread / fee ( % )
  open: boolean;
  onClose: () => void;
}

export function CashOutModal({ poRef, property, lines, gross, spreadPct, open, onClose }: Props) {
  // Lock scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const canDisburse = useMemo(
    () => lines.every((l) => l.total > 0),
    [lines]
  );

  // Early render: null when closed so it doesn't sit invisible in DOM
  if (!open) return null;

  const fee = (gross * spreadPct) / 100;
  const net = gross - fee;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Factoring breakdown"
    >
      {/* backdrop — solid, no blur */}
      <div className="absolute inset-0 bg-[#314B43]/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Cash-out in 48h</span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">Reverse-factoring breakdown</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {poRef} · {property}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* financial summary */}
        <div className="px-5 py-4 space-y-3">
          {[
            { label: "Gross Invoice Value", val: `EGP ${gross.toLocaleString("en-EG")}` },
            { label: "Disbursal Timeline", val: "48 hours" },
            { label: "Factoring Spread", val: `${spreadPct.toFixed(1)}%` },
            { label: "Single-Instance Lock", val: "Active" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{r.label}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{r.val}</span>
            </div>
          ))}
        </div>

        {/* net disbursed */}
        <div className="mx-5 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Net Disbursed Amount</span>
            <span className="text-xl font-bold text-emerald-700 tabular-nums">
              EGP {net.toLocaleString("en-EG")}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
            48h disbursal via licensed grantors (Oliv / Suez Canal Bank). Non-recourse facility — credit
            underwriting held against the corporate hotel buyer, off HotelsVendors' balance sheet.
          </p>
        </div>

        {/* trust / compliance badges */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-2">
          {[
            { icon: FileCheck2, label: "ETA Validated" },
            { icon: ShieldCheck, label: "FRA Compliant" },
            { icon: CheckCircle2, label: "Non-Recourse" },
            { icon: Lock, label: "Single-Instance Lock" },
          ].map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-semibold"
            >
              <b.icon size={12} />
              {b.label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            disabled={!canDisburse}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock size={14} />
            Request 48h cash-out
            <ArrowRight size={14} />
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Full breakdown shown before any disbursal. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}