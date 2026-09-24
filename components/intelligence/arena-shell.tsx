"use client";

import { ReactNode } from "react";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";
import { TemporalContext } from "@/lib/intelligence/reasoning/temporal-context";
import { NetworkInsight } from "@/lib/intelligence/network/network-engine";
import { IntelligenceUpdate } from "@/lib/intelligence/monitoring/change-detection";
import { Card, StatePill, Stat } from "./ui";
import { Eye, Database, Users, AlertTriangle, Target, FileSearch, Network, TrendingUp, ShieldCheck, Clock, CheckCircle2, ArrowRight, Package, Truck } from "lucide-react";

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
          <p className="text-sm text-foreground-muted">Unified workspace: findings (Need Detection) + recommendations (Opportunity Matching) + temporal dynamics (Temporal Context) + commercial approach (Smart Approach) + transaction context (Transaction Intelligence) + network patterns (Network Intelligence) + continuous updates (Continuous Intelligence) — explainable interface; no autonomous execution; requires review before action.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card key="commercial" className="bg-surface-1 border border-border-subtle">
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Target size={14} className="text-foreground-muted" />Commercial Intelligence
              </h3>
              <p className="text-[11px] text-foreground-subtle mb-2">Smart Approach — explains commercial recommendations for HOTEL / SUPPLIER / FUNDER / CARRIER / LOGISTICS_HUB.</p>
              <div className="flex flex-wrap gap-2 text-[9px] text-foreground-subtle">
                <span className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">IntelligenceApproach</span>
                <span className="bg-surface-2 rounded px-1.5 py-0.5 border border-border-subtle">No Autonomous Action</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export type { ApproachRecommendation as IntelligenceApproach } from "@/lib/intelligence/commercial/approach-engine";
