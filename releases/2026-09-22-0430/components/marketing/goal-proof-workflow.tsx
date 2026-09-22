"use client";

import { useState } from "react";
import {
  CheckCircle2, Sparkles, Smartphone, Landmark,
  Monitor, ArrowRight, Terminal, Zap,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  desc: string;
  proofLabel: string;
  proofIcon: string;
  hotelView: string;
  supplierView: string;
  terminalOut: string[];
  color: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Automated Onboarding",
    desc: "Enter your Commercial Register and Tax ID. Our onboarding agent verifies credentials directly with Egyptian government databases in under 60 seconds.",
    proofLabel: "ETA Tax ID #382-910-112 Verified in 42s",
    proofIcon: "✓",
    hotelView: "Register on Web → Upload CR + Tax ID → Auto-verified by AI agent",
    supplierView: "Download HOVIN → Enter phone → KYC auto-fills → Ready in 60s",
    terminalOut: [
      "[AI Agent] Verifying Commercial Register #105300900196948...",
      "[Gov API] ETA tax registration confirmed for Tax ID 382-910-112",
      "[FRA Check] Commercial registry: Active · No flags",
      "[System] Onboarding complete in 42s · Status: CLEARED",
    ],
    color: "var(--accent-base)",
  },
  {
    id: 2,
    title: "AI Catalog Ingestion",
    desc: "Search products in natural language. Our hybrid pricing engine automatically routes standard items to instant checkout and converts bulk orders to automated RFQs.",
    proofLabel: "1,203 Products Auto-Enriched · 100% Tax Compliant",
    proofIcon: "⚡",
    hotelView: "Search 'Egyptian cotton sheets 400TC' → See 3 vendors → Compare prices → Add to Cart or RFQ",
    supplierView: "Upload Excel/CSV → AI enriches SKUs, descriptions, pricing → Products live in marketplace",
    terminalOut: [
      "[AI Ingestion] Parsing supplier-pricelist.xlsx... 1,247 rows found",
      "[LLM] Enriching: SKU auto-generation, SEO descriptions, pricing optimization",
      "[Catalog] 1,203 products enriched · 44 flagged for manual review",
      "[System] Marketplace updated · All SKUs ETA-compliant",
    ],
    color: "var(--orange-base)",
  },
  {
    id: 3,
    title: "Dual-Layer Order Dispatch",
    desc: "Approved purchase orders instantly pushed to the supplier's HOVIN App. Warehouse staff scan, pack, and issue e-Waybills with zero manual data entry.",
    proofLabel: "Order #HV-8812 Accepted by Supplier in 3m",
    proofIcon: "📱",
    hotelView: "Create PO on Web → Authority matrix approves → Order dispatched to supplier instantly",
    supplierView: "Push alert on HOVIN → Accept with one tap → Scan items → Pack → Ship",
    terminalOut: [
      "[Orders] PO #HV-8812 created for Luxe Linen Co. — EGP 14,400",
      "[Auth] Authority matrix: Manager approved · Tier 2 OK",
      "[Mobile] Push notification sent to HOVIN: 'New Order #HV-8812'",
      "[Supplier] Order accepted in 3m · Packing started",
    ],
    color: "var(--purple-base)",
  },
  {
    id: 4,
    title: "48-Hour Factoring",
    desc: "Suppliers request reverse factoring via HOVIN. AI compliance agents audit the invoice and trigger disbursement in 38–48 hours at 1.5–3% rate, while hotels preserve standard 60–90 day payment cycles.",
    proofLabel: "EGP 14,400 Payout Approved in 38h",
    proofIcon: "💳",
    hotelView: "Invoice auto-reconciled · Payment due in 90 days · Zero cash flow impact",
    supplierView: "Tap 'Request Payout' → FRA auto-audit → Funds in bank in 48h · 1.5–3% fee",
    terminalOut: [
      "[Factoring] Supplier requested 48h payout for invoice INV-2847",
      "[Compliance] FRA audit: Invoice verified · ETA status VALID",
      "[Risk] Credit assessment: Luxe Linen Co. — Score 87/100 · APPROVED",
      "[Payout] EGP 14,400 disbursed to bank account · Fee: 2.1% = EGP 302",
      "[System] Net payout: EGP 14,098 · Estimated arrival: 38h",
    ],
    color: "#10B981",
  },
];

type ViewMode = "hotel" | "supplier";

export function GoalProofWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const [view, setView] = useState<ViewMode>("hotel");
  const [showTerminal, setShowTerminal] = useState(false);

  const step = STEPS[activeStep];

  return (
    <section className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-14 animate-on-scroll">
        <span className="text-xs tracking-widest uppercase" style={{ color: "#10B981" }}>
          AI Automation Engine
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-3 text-foreground">
          How Our Swarm Agents Work
        </h2>
        <p className="text-foreground-secondary text-base max-w-2xl mx-auto">
          Not just steps — automated processes running 24/7 in the background.
          Click each step to see the live system proof.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex justify-center mb-8 animate-on-scroll">
        <div className="inline-flex rounded-xl border border-white/[0.08] bg-surface-1 p-1">
          {(["hotel", "supplier"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                view === v ? "bg-accent-base text-white" : "text-foreground-muted hover:text-white"
              }`}
            >
              {v === "hotel" ? <Monitor size={14} /> : <Smartphone size={14} />}
              {v === "hotel" ? "Hotel View (Web)" : "Supplier View (HOVIN)"}
            </button>
          ))}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-8 animate-on-scroll">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActiveStep(i); setShowTerminal(false); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i === activeStep
                ? "text-white border-2"
                : i < activeStep
                ? "bg-accent-base/20 text-accent-base border border-accent-base/30"
                : "text-foreground-muted border border-white/[0.06] hover:border-white/[0.15]"
            }`}
            style={i === activeStep ? { borderColor: step.color, background: `${step.color}20` } : {}}
          >
            {i < activeStep ? <CheckCircle2 size={16} /> : s.id}
          </button>
        ))}
      </div>

      {/* Active step content */}
      <div className="grid md:grid-cols-2 gap-6 animate-on-scroll">
        {/* Left: Step info */}
        <div
          className="rounded-2xl border bg-surface-1 p-6 flex flex-col justify-between"
          style={{ borderColor: `${step.color}33` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${step.color}15`, border: `1px solid ${step.color}40` }}>
                <span style={{ color: step.color }}>{step.id}</span>
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: step.color }}>
                Step {step.id}
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-foreground-secondary leading-relaxed mb-4">{step.desc}</p>

            {/* Proof badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium animate-pulse"
              style={{ borderColor: `${step.color}44`, background: `${step.color}10`, color: step.color }}
            >
              <span>{step.proofIcon}</span>
              {step.proofLabel}
            </div>

            {/* View-specific content */}
            <div className="mt-4 p-3 rounded-lg border border-white/[0.06] bg-canvas/60">
              <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1">
                {view === "hotel" ? "🏢 Hotel Flow" : "📱 Supplier Flow"}
              </div>
              <div className="text-sm text-foreground-secondary">
                {view === "hotel" ? step.hotelView : step.supplierView}
              </div>
            </div>
          </div>

          {/* Terminal toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="mt-4 flex items-center gap-2 text-xs text-foreground-muted hover:text-white transition-colors"
          >
            <Terminal size={12} />
            {showTerminal ? "Hide system logs" : "Show system logs"}
          </button>
        </div>

        {/* Right: Terminal / Proof */}
        <div
          className="rounded-2xl border bg-surface-1 overflow-hidden"
          style={{ borderColor: "#10B98133", boxShadow: "0 0 30px rgba(16,185,129,0.1)" }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-canvas/50">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981" }} />
            <span className="flex-1 text-center text-[10px] text-foreground-muted font-mono">
              hotelsvendors-agent ~ swarm logs
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-4 font-mono text-xs space-y-1.5 min-h-[280px]" style={{ background: "#080c14" }}>
            {showTerminal ? (
              step.terminalOut.map((line, i) => (
                <div key={i} className={`flex gap-2 ${
                  line.includes("ERROR") ? "text-red-400" :
                  line.includes("APPROVED") || line.includes("COMPLETE") || line.includes("disbursed") ? "text-emerald-400" :
                  line.includes("⚠") ? "text-amber-400" :
                  "text-foreground-muted"
                }`}>
                  <span className="text-foreground-muted shrink-0">[{i + 1}]</span>
                  <span>{line}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                <Terminal size={32} className="text-foreground-muted" />
                <p className="text-foreground-muted text-xs">Click &quot;Show system logs&quot; to see the AI swarm agents in action</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}