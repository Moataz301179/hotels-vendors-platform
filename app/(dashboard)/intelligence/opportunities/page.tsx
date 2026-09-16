"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, ArrowRight, ShieldCheck, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";

// Reference opportunity packages derived from existing engine logic (non-autonomous)
const SAMPLE_OPPORTUNITIES: OpportunityPackage[] = [
  {
    opportunityId: "opportunity-comm-001-s-01",
    needFindingId: "finding-comm-001",
    findingCategory: "COMMERCIAL_SIGNAL",
    needType: "procurement_demand_increase",
    description: "Delta Meats Co. can serve increased F&B procurement demand linked to commercial signal.",
    reasoning: "Derived from COMMERCIAL_SIGNAL evidence (2 evidence records, 3 relationships). Not autonomous: requires supplier audit review and order history verification before approach.",
    affectedParticipants: [
      {
        type: "SUPPLIER",
        entityId: "supplier-001",
        entityName: "Delta Meats Co.",
        recommendation: "Approach supplier regarding expanded procurement. Review supplier audit (PENDING) and current orders (3).",
        evidenceReferences: ["ev-348b7d7", "ev-9851734"],
      },
    ],
    provenanceReferences: ["audit-chain-01", "graph-edge-9851734"],
    confidenceScore: 0.72,
    status: "DETECTED",
    createdAt: new Date("2026-09-10"),
  },
  {
    opportunityId: "opportunity-op-002-h-01",
    needFindingId: "finding-op-002",
    findingCategory: "OPERATIONAL_SIGNAL",
    needType: "logistics_consolidation",
    description: "6th of October Hub logistics consolidation opportunity linked to operational delivery need.",
    reasoning: "Operational signal indicates potential route consolidation or cross-dock optimization. Evidence: 2 records, relationships: 2. Not autonomous.",
    affectedParticipants: [
      {
        type: "LOGISTICS_HUB",
        entityId: "hub-001",
        entityName: "6th of October Hub",
        recommendation: "Evaluate delivery consolidation through 6th of October Hub. Confirm truck capacity, receiving constraints, cross-dock timing.",
        evidenceReferences: ["ev-9db61e4", "ev-629858a"],
      },
    ],
    provenanceReferences: ["evidence-9db61e4", "graph-edge-9851734"],
    confidenceScore: 0.64,
    status: "DETECTED",
    createdAt: new Date("2026-09-09"),
  },
];

export default function IntelligenceOpportunitiesPage() {
  const [filter, setFilter] = useState("all");

  const filtered = SAMPLE_OPPORTUNITIES.filter((o) => {
    if (filter === "all") return true;
    if (filter === "REVIEWED") return o.status === "REVIEWED";
    if (filter === "DETECTED") return o.status === "DETECTED";
    return true;
  });

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Opportunities</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Opportunity Matching</h1>
          <p className="text-sm text-foreground-muted">Commercial recommendations derived from need findings. All recommendations explain evidence/provenance/reasoning; requires review; not autonomous execution.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-2">
          {["all", "DETECTED", "REVIEWED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                filter === f
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-surface-1 text-foreground-muted border-border-subtle hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((op) => (
            <div key={op.opportunityId} className="bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-medium text-white mb-0.5">{op.description}</h3>
                  <p className="text-[10px] text-foreground-muted font-mono">{op.opportunityId}</p>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
                  op.status === "DETECTED" ? "bg-amber-950/30 text-amber-300 border-amber-900/30" :
                  op.status === "REVIEWED" ? "bg-green-950/30 text-green-300 border-green-900/30" :
                  "bg-surface-2 text-foreground-subtle border-border-subtle"
                }`}>
                  {op.status}
                </span>
              </div>

              <p className="text-[11px] text-foreground-muted mb-3 leading-relaxed">
                <strong className="text-white">Reasoning:</strong> {op.reasoning}
              </p>

              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-1 text-[10px]">Participants</span>
                  {op.affectedParticipants.map((p) => (
                    <div key={p.entityId} className="mb-1.5">
                      <span className="text-[9px] uppercase tracking-wide text-foreground-subtle">{p.type}</span>
                      <span className="text-white block">{p.entityName}</span>
                      <span className="text-[9px] text-foreground-subtle">{p.recommendation}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-1 text-[10px]">Evidence References</span>
                  <div className="flex flex-wrap gap-1">
                    {op.provenanceReferences.map((r) => (
                      <span key={r} className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-1 text-[10px]">Confidence</span>
                  <span className="text-amber-300 font-semibold text-sm">{(op.confidenceScore * 100).toFixed(0)}%</span>
                  <span className="text-foreground-subtle block mt-1">Need: {op.needType}</span>
                  <span className="text-foreground-subtle block">Category: {op.findingCategory}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/intelligence/actions" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                  <ArrowRight size={12} /> View Actions
                </Link>
                <Link href="/hotel/catalog" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                  <Target size={12} /> Procurement Portal
                </Link>
                <Link href="/supplier" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                  <ShieldCheck size={12} /> Supplier Central
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
