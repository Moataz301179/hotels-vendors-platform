"use client";

import { useState } from "react";
import { ArrowRight, Eye, Clock, ShieldCheck, Database } from "lucide-react";
import { SourceProvenance } from "@/lib/intelligence/core/types";

const SAMPLE_EVIDENCE: { id: string; source: SourceProvenance; statement: string; inferenceType: string; confidence: { value: number; evidenceCount: number; reasoning: string }; impactEstimate?: { low: number; high: number; currency: string; basis: string } }[] = [
  {
    id: "ev-348b7d7",
    source: { source: "supplier-discovery-adapter", timestamp: "2026-09-09T14:22:00Z", adapterVersion: "v2.1.0", ingestionId: "ing-348b7d7", evidenceHash: "sha256-abc...", accessType: "PUBLIC_DOCUMENT" },
    statement: "Delta Meats Co. supplier profile indicates expanded capacity for protein product lines.",
    inferenceType: "INFERENCE",
    confidence: { value: 0.78, evidenceCount: 2, reasoning: "Evidence chain: supplier audit + catalog price update." },
    impactEstimate: { low: 52000, high: 78000, currency: "EGP", basis: "Historical F&B spend patterns per property." },
  },
  {
    id: "ev-9851734",
    source: { source: "intelligence-graph-adapter", timestamp: "2026-09-08T09:15:00Z", adapterVersion: "v2.1.0", ingestionId: "ing-9851734", evidenceHash: "sha256-def...", accessType: "METADATA" },
    statement: "IntelligenceEdge temporal relationship links supplier profile to procurement spend signal.",
    inferenceType: "INFERENCE",
    confidence: { value: 0.72, evidenceCount: 3, reasoning: "Relationship verified across 3 graph nodes (supplier, product, order)." },
  },
  {
    id: "ev-9db61e4",
    source: { source: "continuous-monitoring-adapter", timestamp: "2026-09-07T11:30:00Z", adapterVersion: "v2.1.0", ingestionId: "ing-9db61e4", evidenceHash: "sha256-ghi...", accessType: "PASSIVE" },
    statement: "EvidenceRecord retrieval timestamp indicates operational signal at 6th of October logistics hub.",
    inferenceType: "OBSERVED",
    confidence: { value: 0.65, evidenceCount: 1, reasoning: "Single evidence record; temporal validity verified." },
  },
];

export default function IntelligenceEvidencePage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Evidence</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Evidence Records</h1>
          <p className="text-sm text-foreground-muted">EvidenceRecord persistence + provenance taxonomy + audit chain references. Every finding connects to an evidence chain.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          {SAMPLE_EVIDENCE.map((ev) => (
            <div
              key={ev.id}
              className="bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-medium text-white">{ev.id}</h3>
                <span className="text-[9px] text-foreground-subtle font-mono bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{ev.source.accessType}</span>
              </div>

              <p className="text-xs text-foreground-muted mb-3 leading-relaxed">{ev.statement}</p>
              <p className="text-[10px] text-foreground-subtle mb-3">Inference type: <span className="text-white font-medium">{ev.inferenceType}</span> — Confidence: <span className="text-amber-300 font-medium">{(ev.confidence.value * 100).toFixed(0)}%</span> ({ev.confidence.evidenceCount} evidence reference{ev.confidence.evidenceCount > 1 ? "s" : ""})</p>

              <div className="text-[10px] text-foreground-muted bg-ink-950 border border-white/5 rounded p-3 mb-3 space-y-1">
                <div className="flex justify-between"><span>Source</span> <span className="text-white">{ev.source.source}</span></div>
                <div className="flex justify-between"><span>Adapter</span> <span className="text-white">{ev.source.adapterVersion}</span></div>
                <div className="flex justify-between"><span>Ingestion</span> <span className="text-white">{ev.source.ingestionId}</span></div>
                <div className="flex justify-between"><span>Hash</span> <span className="text-white truncate max-w-[120px]">{ev.source.evidenceHash}</span></div>
                <div className="flex justify-between"><span>Timestamp</span> <span className="text-white">{ev.source.timestamp}</span></div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                  className="text-[11px] px-3 py-1 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors"
                >
                  {expanded === ev.id ? "Collapse" : "Details"}
                </button>
                <span className="text-[9px] text-foreground-subtle">Evidence chain preserved; no autonomous action.</span>
              </div>

              {expanded === ev.id && ev.impactEstimate && (
                <div className="mt-3 text-[10px] text-foreground-muted bg-surface-2 rounded p-3 border border-border-subtle">
                  <strong className="text-white block mb-0.5">Impact Estimate</strong>
                  <div className="flex justify-between"><span>Low</span> <span className="text-white">{ev.impactEstimate.low.toLocaleString("en-US", { style: "currency", currency: ev.impactEstimate.currency })}</span></div>
                  <div className="flex justify-between"><span>High</span> <span className="text-white">{ev.impactEstimate.high.toLocaleString("en-US", { style: "currency", currency: ev.impactEstimate.currency })}</span></div>
                  <span className="text-foreground-subtle">Basis: {ev.impactEstimate.basis}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
