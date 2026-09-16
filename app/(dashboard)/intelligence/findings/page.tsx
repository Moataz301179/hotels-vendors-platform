"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Clock, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

const SAMPLE_FINDINGS: NeedFinding[] = [
  {
    findingCategory: "COMMERCIAL_SIGNAL",
    entityId: "entity-001",
    entityName: "Delta Meats Co.",
    description: "Commercial procurement signal: supplier can serve increased F&B demand linked to property-level spend patterns.",
    needType: "procurement_demand_increase",
    evidenceIds: ["ev-348b7d7", "ev-9851734"],
    relationshipIds: ["graph-edge-9851734", "audit-chain-01"],
    provenanceClass: "INTELLIGENCE_EDGE",
    confidenceScore: 0.72,
    reasoning: "EvidenceRecord temporal retrieval (348b7d7) + IntelligenceEdge relationship (9851734) indicates supplier capacity alignment with observed procurement patterns. Not autonomous observation.",
    temporalContext: "Evidence retrieved 2026-09-09; temporal validity verified against supplier audit chain (2026-09-08).",
    status: "DETECTED",
    createdAt: new Date("2026-09-09"),
  },
  {
    findingCategory: "OPERATIONAL_SIGNAL",
    entityId: "entity-002",
    entityName: "6th of October Hub",
    description: "Operational logistics signal: consolidation opportunity linked to delivery route density and warehouse utilization.",
    needType: "logistics_consolidation",
    evidenceIds: ["ev-9db61e4", "ev-629858a"],
    relationshipIds: ["graph-edge-9851734"],
    provenanceClass: "NETWORK_INSIGHT",
    confidenceScore: 0.64,
    reasoning: "EvidenceRecord (9db61e4) + NetworkInsight (629858a) indicates route consolidation potential based on warehouse density patterns. Requires manual review.",
    temporalContext: "Monitoring window 2026-09-07 → 2026-09-09; change detection (9db61e4) confirms operational shift.",
    status: "DETECTED",
    createdAt: new Date("2026-09-09"),
  },
];

export default function IntelligenceFindingsPage() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_FINDINGS.filter(
    (f) =>
      f.entityName.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.needType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Findings</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Need Detection</h1>
          <p className="text-sm text-foreground-muted">Explainable findings (NeedFinding) with reasoning, provenance, temporal context. All findings are observed/inferred, not autonomous actions.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings by entity, description, need type..."
            className="w-full pl-9 pr-4 py-2 bg-surface-1 border border-border-subtle rounded-lg text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-hover"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.entityId + f.needType} className="bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-medium text-white">{f.entityName}</h3>
                  <p className="text-[10px] text-foreground-muted font-mono">{f.findingCategory} / {f.needType}</p>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
                  f.status === "DETECTED" ? "bg-amber-950/30 text-amber-300 border-amber-900/30" :
                  f.status === "REVIEWED" ? "bg-green-950/30 text-green-300 border-green-900/30" :
                  "bg-surface-2 text-foreground-subtle border-border-subtle"
                }`}>
                  {f.status}
                </span>
              </div>

              <p className="text-xs text-foreground-muted mb-3 leading-relaxed">{f.description}</p>
              <p className="text-[11px] text-foreground-subtle mb-3 leading-relaxed">{f.reasoning}</p>

              <div className="grid md:grid-cols-4 gap-3 mb-3">
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-0.5">Evidence References</span>
                  <div className="flex flex-wrap gap-1">
                    {f.evidenceIds.map((e) => (
                      <span key={e} className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-0.5">Relationship References</span>
                  <div className="flex flex-wrap gap-1">
                    {f.relationshipIds.map((r) => (
                      <span key={r} className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-0.5">Temporal Context</span>
                  <span className="text-foreground-subtle">{f.temporalContext}</span>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5 text-[10px] text-foreground-muted">
                  <span className="block text-white font-medium mb-0.5">Provenance</span>
                  <span className="text-foreground-subtle">{f.provenanceClass}</span>
                  <span className="text-amber-300 block mt-0.5 font-medium">{(f.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/intelligence/opportunities" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                  <CheckCircle2 size={12} /> Related Opportunities
                </Link>
                <Link href="/intelligence/evidence" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
                  <Eye size={12} /> Evidence
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
