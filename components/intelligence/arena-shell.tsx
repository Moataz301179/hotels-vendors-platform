"use client";

import { ReactNode } from "react";
import { EvidenceRecord } from "@/lib/intelligence/core/types";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";
import { TemporalContext } from "@/lib/intelligence/reasoning/temporal-context";
import { IntelligenceApproach } from "@/lib/intelligence/commercial/approach-engine";
import { TransactionRecommendation } from "@/lib/intelligence/transaction/intelligence-bridge";
import { NetworkInsight } from "@/lib/intelligence/network/network-engine";
import { IntelligenceUpdate } from "@/lib/intelligence/monitoring/change-detection";
import { Card, StatePill, Stat } from "./ui";
import { Eye, Database, Users, AlertTriangle, Target, FileSearch, Network, TrendingUp, ShieldCheck, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export interface ArenaWorkspaceProps {
  role: "HOTEL" | "SUPPLIER" | "FACTORING" | "SHIPPING" | "ADMIN";
  tenantId: string;
  userId: string;
}

export function IntelligenceArenaShell({ role }: ArenaWorkspaceProps) {
  const phases = [
    { phase: "Phase 2", title: "Evidence & Intelligence Graph", desc: "EvidenceRecord persistence + IntelligenceEdge temporal relationships + provenance taxonomy + audit chain integration.", tags: ["EvidenceRecord", "IntelligenceEdge", "Audit Chain", "Temporal Validity"] },
    { phase: "Phase 3", title: "Intelligence Reasoning", desc: "Need Detection (explainable findings; requires review) + Opportunity Matching (recommendations only; PROPOSED; requires review) + Temporal Contextual Reasoning (explains changes over time).", tags: ["NeedFinding", "OpportunityPackage", "TemporalContext", "No Autonomous Action"] },
    { phase: "Phase 4", title: "Commercial Intelligence", desc: "Smart Approach (IntelligenceApproach) — explains commercial recommendations for HOTEL / SUPPLIER / FUNDER / CARRIER / LOGISTICS_HUB; recommendations explain evidence/provenance/reasoning; requires review; not autonomous execution.", tags: ["IntelligenceApproach", "Commercial Signal", "No Autonomous Action"] },
    { phase: "Phase 5", title: "Transaction Intelligence", desc: "Transaction Intelligence — connects recommendations to procurement/transaction mutation context; brief reference in CONFIRM_ORDER; explains reasoning/provenance; no automatic trigger/action execution.", tags: ["TransactionReference", "Orders Queue", "Paymob Integration"] },
    { phase: "Phase 6", title: "Network Intelligence", desc: "Network Intelligence — supplier clusters (SUPPLIER_CLUSTER), logistics consolidation (LOGISTICS_CONSOLIDATION), warehouse density (WAREHOUSE_DENSITY), financing exposure (FINANCING_EXPOSURE), operational bottlenecks (OPERATIONAL_BOTTLENECK); explains patterns with reasoning/reference; requires review; not autonomous.", tags: ["IntelligenceEdge", "NetworkInsight", "Supplier Cluster", "Logistics Consolidation"] },
    { phase: "Phase 7", title: "Continuous Intelligence", desc: "Continuous Intelligence / Change Detection — monitors EvidenceRecord retrievalTimestamp + IntelligenceEdge temporal status; produces explainable IntelligenceUpdate findings (DETECTED; requires review; reasoning explains inference; provenanceReferences preserved; no automatic action/trigger).", tags: ["EvidenceRecord", "IntelligenceUpdate", "No Autonomous Action"] },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Arena</h1>
          <p className="text-sm text-foreground-muted">Unified workspace: findings (Need Detection) + recommendations (Opportunity Matching) + temporal dynamics (Temporal Context) + commercial approach (Smart Approach) + transaction context (Transaction Intelligence) + network patterns (Network Intelligence) + continuous updates (Continuous Intelligence) — explainable interface; no autonomous execution; requires review before action.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phases.map((p) => (
            <Card key={p.phase + p.title} className="bg-surface-1 border border-border-subtle">
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Target size={14} className="text-foreground-muted" />{p.phase}: {p.title}</h3>
                <p className="text-[11px] text-foreground-subtle mb-2">{p.desc}</p>
                <div className="flex flex-wrap gap-2 text-[9px] text-foreground-subtle">
                  {p.tags.map((tag) => (
                    <span key={tag} className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">{tag}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Eye size={16} className="text-foreground-muted" />Readiness & Provenance</h3>
          <div className="grid md:grid-cols-5 gap-2 text-[10px] text-foreground-subtle">
            <div className="bg-surface-2 rounded p-2 border border-border-subtle"><span className="font-medium text-white">P0 Claims</span><span className="text-[9px] text-foreground-subtle block">Corrected (f62c12b)</span></div>
            <div className="bg-surface-2 rounded p-2 border border-border-subtle"><span className="font-medium text-white">Evidence</span><span className="text-[9px] text-foreground-subtle block">EvidenceRecord (348b7d7)</span></div>
            <div className="bg-surface-2 rounded p-2 border border-border-subtle"><span className="font-medium text-white">Graph</span><span className="text-[9px] text-foreground-subtle block">IntelligenceEdge (9851734)</span></div>
            <div className="bg-surface-2 rounded p-2 border border-border-subtle"><span className="font-medium text-white">Reasoning</span><span className="text-[9px] text-foreground-subtle block">Need + Opportunity + Temporal</span></div>
            <div className="bg-surface-2 rounded p-2 border border-border-subtle"><span className="font-medium text-white">Provenance</span><span className="text-[9px] text-foreground-subtle block">AuditLink + 7 mutations</span></div>
          </div>
          <p className="text-[10px] text-foreground-subtle mt-2">All findings, recommendations, observations connect to existing provenance taxonomy (VALIDATED / OBSERVED / INFERRED / MODEL_PREDICTED / AUTHORIZED / USER_PROVIDED). All recommendations are explainable and require review before action. No autonomous decision or execution.</p>
        </div>
      </div>
    </div>
  );
}

      {/* Role-Specific Action Links — Production Continuity */}
      <div className="bg-ink-950 border-t border-white/5 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <h4 className="text-[11px] font-medium text-foreground-muted mb-3 uppercase tracking-[0.1em]">Role-Specific Workspace Actions</h4>
          <div className="grid md:grid-cols-5 gap-2 text-[10px]">
            <a href="/procurement/catalog" className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg px-3 py-2.5 transition-colors text-foreground-subtle hover:text-white">
              <Eye size={14} /> <span>Hotel / Procurement Portal</span>
            </a>
            <a href="/supplier/central" className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg px-3 py-2.5 transition-colors text-foreground-subtle hover:text-white">
              <Package size={14} /> <span>Supplier Central</span>
            </a>
            <a href="/shipping/deliveries" className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg px-3 py-2.5 transition-colors text-foreground-subtle hover:text-white">
              <Truck size={14} /> <span>Shipping / Logistics</span>
            </a>
            <a href="/factoring/liquidity" className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg px-3 py-2.5 transition-colors text-foreground-subtle hover:text-white">
              <ShieldCheck size={14} /> <span>Factoring / Liquidity</span>
            </a>
            <a href="/admin/control-center" className="flex items-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg px-3 py-2.5 transition-colors text-foreground-subtle hover:text-white">
              <Users size={14} /> <span>Admin / Audit</span>
            </a>
          </div>
        </div>
      </div>
