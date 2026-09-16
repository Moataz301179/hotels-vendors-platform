"use client";

import { ReactNode } from "react";
import { EvidenceRecord } from "@/lib/intelligence/core/types";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";
import { TemporalContext } from "@/lib/intelligence/reasoning/temporal-context";
import { Card, StatePill, Stat } from "./ui";
import { Eye, Database, Users, AlertTriangle, Target, FileSearch, Network, TrendingUp, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export interface ArenaWorkspaceProps {
  role: "HOTEL" | "SUPPLIER" | "FACTORING" | "SHIPPING" | "ADMIN";
  tenantId: string;
  userId: string;
}

export function IntelligenceArenaShell({ role }: ArenaWorkspaceProps) {
  return (
    <div className="space-y-4">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Arena</h1>
          <p className="text-sm text-foreground-muted">Unified workspace connecting Phase 2 (Evidence/Graph) + Phase 3 (Reasoning) + Phase 4 (Commercial) + Phase 5 (Transaction) + Phase 6 (Network) + Phase 7 (Continuous) — explainable interface; no autonomous execution.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Database size={16} className="text-foreground-muted" />Phase 2 — Evidence & Intelligence Graph</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">EvidenceRecord persistence (348b7d7) + IntelligenceEdge temporal relationships (9851734) + provenance taxonomy (VALIDATED / OBSERVED / INFERRED / MODEL_PREDICTED / AUTHORIZED / USER_PROVIDED) + audit chain integration.</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">EvidenceRecord</span><span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceEdge</span><span className="bg-surface-2 rounded px-2 py-0.5">Audit Chain</span></div>
            </div>
          </Card>
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Target size={16} className="text-foreground-muted" />Phase 3 — Intelligence Reasoning</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Need Detection (52d5b1d) + Opportunity Matching (fa9f082) + Temporal Contextual Reasoning (13e4e65) — explainable findings (reasoning field) + recommendations (PROPOSED status; requires review) + provenance taxonomy.</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">NeedFinding</span><span className="bg-surface-2 rounded px-2 py-0.5">OpportunityPackage</span><span className="bg-surface-2 rounded px-2 py-0.5">TemporalContext</span></div>
            </div>
          </Card>
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-foreground-muted" />Phase 4 — Commercial Intelligence</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Smart Approach / IntelligenceApproach (ed1f318) — connects reasoning results to explainable commercial recommendations (HOTEL / SUPPLIER / FUNDER / CARRIER / LOGISTICS_HUB); recommendations explain evidence/provenance/reasoning; status = PROPOSED; requires review; not autonomous.</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceApproach</span><span className="bg-surface-2 rounded px-2 py-0.5">Commercial Signal</span><span className="bg-surface-2 rounded px-2 py-0.5">No Autonomous Action</span></div>
            </div>
          </Card>
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-foreground-muted" />Phase 5 — Transaction Intelligence</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Transaction Intelligence service (13874a6) — connects commercial recommendations to order/payment/logistics mutation context (brief reference in CONFIRM_ORDER); explains reasoning/provenance; no automatic trigger/action execution.</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">TransactionReference</span><span className="bg-surface-2 rounded px-2 py-0.5">Orders Queue</span><span className="bg-surface-2 rounded px-2 py-0.5">Paymob Integration</span></div>
            </div>
          </Card>
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Network size={16} className="text-foreground-muted" />Phase 6 — Network Intelligence</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Network Intelligence (629858a) — supplier clusters, logistics consolidation, warehouse density, financing exposure, operational bottlenecks (DETECTED; explains patterns with reasoning/reference; requires review; not autonomous).</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceEdge</span><span className="bg-surface-2 rounded px-2 py-0.5">NetworkInsight</span><span className="bg-surface-2 rounded px-2 py-0.5">Temporal Validity</span></div>
            </div>
          </Card>
          <Card className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Clock size={16} className="text-foreground-muted" />Phase 7 — Continuous Intelligence</h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Continuous Intelligence / Change Detection (9db61e4) — monitors EvidenceRecord retrievalTimestamp + IntelligenceEdge temporal status; produces explainable IntelligenceUpdate findings (DETECTED; requires review; reasoning explains inference; provenanceReferences preserved; no automatic action/trigger).</p>
              <div className="flex gap-2 text-[10px] text-foreground-subtle"><span className="bg-surface-2 rounded px-2 py-0.5">EvidenceRecord</span><span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceUpdate</span><span className="bg-surface-2 rounded px-2 py-0.5">No Autonomous Action</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
