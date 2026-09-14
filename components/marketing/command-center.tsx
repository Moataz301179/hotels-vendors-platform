"use client";

/* #47 — Enterprise B2B Command Center.
   High-density modules: multi-property selector, budget allocation gauges,
   ETA e-invoice/e-waybill status badges, and a LIVE streaming swarm terminal. */

import { useEffect, useRef, useState } from "react";
import { Building2, Download, ShieldCheck, BadgeCheck, Cpu } from "lucide-react";

const PROPERTIES = [
  { id: "cairo", name: "Meridian Cairo", pin: "Cairo", budget: 5.4e6, spent: 4.1e6 },
  { id: "hurghada", name: "Meridian Hurghada (Red Sea)", pin: "Hurghada", budget: 3.8e6, spent: 2.2e6 },
  { id: "sharm", name: "Meridian Sharm El Sheikh", pin: "Sharm El Sheikh", budget: 4.6e6, spent: 3.9e6 },
];

const AGENT_EVENTS: { tag: string; txt: string; ok?: boolean }[] = [
  { tag: "marketpulse", txt: "EGP cotton index +12% projected — LockInAlert raised", ok: false },
  { tag: "dockinspector", txt: "Camera GRN scan #GRN-4417: 2 short → auto credit note EGP 504", ok: false },
  { tag: "compliance", txt: "ETA invoice #ETA-1004-88231 JSON validated · RSA-2048 signed" },
  { tag: "cashflow", txt: "Oliv reverse-factoring payout EGP 14,098 approved (48h, CHV000)" },
  { tag: "catalog", txt: "AI ingestion: 1,203 products auto-enriched · tax compliant", ok: true },
  { tag: "dispatch", txt: "Order #HV-9033 accepted by supplier in 3m · dispatch queued", ok: true },
  { tag: "quality", txt: "Egyptian alternative substitution for Fluke thermocouple −23%", ok: true },
];

const ETA_STATUS = [
  { label: "e-Invoice JSON", state: "Valid", ok: true },
  { label: "e-Waybill QR", state: "Verified", ok: true },
  { label: "Real Tax ID", state: "On connect", ok: false },
];

export function CommandCenter() {
  const [propId, setPropId] = useState("cairo");
  const prop = PROPERTIES.find((p) => p.id === propId)!;
  const busage = Math.round((prop.spent / prop.budget) * 100);
  const [trace, setTrace] = useState<string[]>([`[boot] command-center online · ${prop.pin}`]);
  const idx = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const ev = AGENT_EVENTS[idx.current % AGENT_EVENTS.length];
      const tag = ev.ok === undefined ? ev.tag : ev.ok ? ev.tag : ev.tag;
      const color = ev.ok ? "text-emerald-400" : ev.ok === false ? "text-amber-400" : "text-slate-300";
      setTrace((prev) => [`[${tag}] ${ev.txt}`, ...prev].slice(0, 8));
      idx.current++;
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#F8FAFC] border-y border-slate-200 py-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 mb-1">Enterprise Command Center</div>
            <h2 className="text-2xl font-bold text-[#8a6d3b] tracking-tight">One console. Every property.</h2>
          </div>
          {/* Property selector */}
          <div className="flex flex-wrap gap-2">
            {PROPERTIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPropId(p.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  propId === p.id ? "bg-[#314B43] text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                <Building2 size={13} /> {p.name.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left 2/3 — command modules */}
          <div className="lg:col-span-2 space-y-4">
            {/* Budget gauges */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-900">{prop.name}</span>
                <span className="text-[11px] text-slate-500">PIN: {prop.pin}</span>
              </div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Budget allocation</span>
                <span className="font-semibold text-slate-900 tabular-nums">EGP {(prop.spent / 1e6).toFixed(1)}M / {(prop.budget / 1e6).toFixed(1)}M · {busage}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${busage > 85 ? "bg-red-500" : busage > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${busage}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                <ShieldCheck size={11} className="inline mr-1 text-emerald-600" />
                {busage > 85 ? "AI Spend Alert: near department cap — approval required" : "AI Spend Alert: on track · forecast ↓ 8% vs last quarter"}
              </p>
            </div>

            {/* Dual architecture */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded bg-[#314B43] flex items-center justify-center"><Cpu size={15} className="text-white" /></span>
                  <span className="text-sm font-bold text-slate-900">HotelsVendors Web OS</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> Multi-property procurement & approval matrix</li>
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> Departmental budget locks + AI spend forecast</li>
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> ETA e-invoicing & e-Waybill compliance</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center"><Download size={15} className="text-white" /></span>
                  <span className="text-sm font-bold text-slate-900">HOVIN App</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> Supplier execution & dock GRN camera scan</li>
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> 48h reverse-factoring cash-out (Oliv CHV000)</li>
                  <li className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-600" /> Carrier job queue & live e-Waybill QR</li>
                </ul>
              </div>
            </div>

            {/* ETA status badges */}
            <div className="flex flex-wrap gap-3">
              {ETA_STATUS.map((s) => (
                <div key={s.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-slate-500">{s.label}</span>
                  <span className={`font-semibold ${s.ok ? "text-emerald-700" : "text-red-700"}`}>{s.state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1/3 — live streaming terminal */}
          <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 font-mono text-[11px] font-medium flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-slate-400 ml-1">hotslvendors-agent</span><span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#3a544a] text-slate-300 border border-slate-700">illustrative demo — connects live when suppliers onboard</span>
            </div>
            <div className="space-y-2 flex-1 overflow-hidden">
              {trace.map((line, i) => {
                const isEm = line.includes("payout") || line.includes("verified") && !line.includes("near");
                return (
                  <p key={i} className="leading-relaxed break-words">
                    <span className="text-emerald-400">{">"}</span>{" "}
                    <span className={isEm ? "text-emerald-300" : line.includes("Alert") || line.includes("credit note") ? "text-amber-300" : "text-slate-300"}>{line}</span>
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}