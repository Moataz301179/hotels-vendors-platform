"use client";

import { ArrowRight, Clock, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { IntelligenceUpdate } from "@/lib/intelligence/monitoring/change-detection";

const SAMPLE_UPDATES: IntelligenceUpdate[] = [
  {
    updateId: "upd-001",
    findingCategory: "ENTITY_RESOLUTION",
    description: "Evidence update: supplier profile retrieval timestamp changed — new evidence record (ev-348b7d7) available.",
    reasoning: "EvidenceRecord retrievalTimestamp difference detected. Temporal validity verified against audit chain. Not autonomous action.",
    affectedEntityId: "entity-001",
    affectedEntityName: "Delta Meats Co.",
    changedEvidenceIds: ["ev-348b7d7"],
    changedRelationshipIds: ["graph-edge-9851734"],
    provenanceReferences: ["audit-chain-01", "evidence-348b7d7"],
    temporalContext: "Evidence retrieved 2026-09-09; audit chain verified 2026-09-08.",
    confidenceScore: 0.78,
    status: "DETECTED",
    createdAt: new Date("2026-09-09T16:00:00Z"),
  },
  {
    updateId: "upd-002",
    findingCategory: "RELATIONSHIP",
    description: "Relationship change: logistics consolidation signal at 6th of October Hub — temporal relationship status updated.",
    reasoning: "IntelligenceEdge temporal status change (9851734) detected. Provenance chain preserved. Review required.",
    affectedEntityId: "hub-001",
    affectedEntityName: "6th of October Hub",
    changedEvidenceIds: ["ev-9db61e4"],
    changedRelationshipIds: ["graph-edge-9851734"],
    provenanceReferences: ["graph-edge-9851734", "evidence-9db61e4"],
    temporalContext: "Monitoring window 2026-09-07 → 2026-09-09; temporal validity verified.",
    confidenceScore: 0.64,
    status: "DETECTED",
    createdAt: new Date("2026-09-09T10:30:00Z"),
  },
];

export default function IntelligenceMonitoringPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Monitoring</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Continuous Intelligence</h1>
          <p className="text-sm text-foreground-muted">Change detection monitoring EvidenceRecord retrievalTimestamp + IntelligenceEdge temporal status. All observations explain reasoning and provenance. No automatic trigger.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><Clock size={16} className="text-foreground-muted" /> Recent Updates</h2>
          <div className="space-y-3">
            {SAMPLE_UPDATES.map((upd) => (
              <div key={upd.updateId} className="bg-ink-950 border border-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-medium text-white">{upd.description}</h3>
                  <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
                    upd.status === "DETECTED" ? "bg-amber-950/30 text-amber-300 border-amber-900/30" : "bg-green-950/30 text-green-300 border-green-900/30"
                  }`}>
                    {upd.status}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mb-2">{upd.reasoning}</p>
                <div className="flex items-center gap-3 text-[10px] text-foreground-subtle">
                  <span>Created: {new Date(upd.createdAt).toLocaleString("en-GB")}</span>
                  <span>Update ID: {upd.updateId}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {upd.provenanceReferences.map((p) => (
                    <span key={p} className="bg-surface-2 rounded px-1.5 py-0.5 text-[9px] text-foreground-subtle border border-border-subtle">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
