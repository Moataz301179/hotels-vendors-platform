"use client";

import { ArrowRight, Network, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { NetworkInsight } from "@/lib/intelligence/network/network-engine";

const SAMPLE_NETWORK_INSIGHTS: NetworkInsight[] = [
  {
    insightId: "network-supplier-001",
    description: "Supplier cluster: Delta Meats Co. linked to 3 active hotels; audit status PENDING.",
    reasoning: "Network pattern inferred from HotelSupplier relationships + SupplierAudit + order footprint. Not autonomous action; requires supplier onboarding verification before commercial approach.",
    networkPattern: "SUPPLIER_CLUSTER",
    entityIds: ["supplier-001"],
    relationshipIds: ["graph-edge-9851734", "audit-chain-01"],
    evidenceReferences: ["ev-348b7d7", "ev-9851734"],
    provenanceReferences: ["evidence-348b7d7", "audit-chain-01"],
    confidenceScore: 0.75,
    networkValueEstimate: "Procurement consolidation / volume expansion opportunity (not verified projection).",
    status: "DETECTED",
    createdAt: new Date("2026-09-09"),
  },
  {
    insightId: "network-logistics-001",
    description: "Logistics consolidation potential: 6th of October Hub linked to delivery network; cross-dock/storage density opportunity.",
    reasoning: "Network pattern inferred from LogisticsHub + Trip/TripStop relationships + delivery patterns. Not autonomous; requires operational review.",
    networkPattern: "LOGISTICS_CONSOLIDATION",
    entityIds: ["hub-001"],
    relationshipIds: ["graph-edge-9851734"],
    evidenceReferences: ["ev-9db61e4", "ev-629858a"],
    provenanceReferences: ["evidence-9db61e4", "graph-edge-9851734"],
    confidenceScore: 0.64,
    networkValueEstimate: "Shared-route fulfillment network optimization opportunity (not verified).",
    status: "DETECTED",
    createdAt: new Date("2026-09-09"),
  },
];

export default function IntelligenceGraphPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowRight size={16} className="text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase tracking-wide">Graph</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">Network Intelligence</h1>
          <p className="text-sm text-foreground-muted">Network patterns (SUPPLIER_CLUSTER, LOGISTICS_CONSOLIDATION, etc.) with explainable reasoning and provenance. All findings require review.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {SAMPLE_NETWORK_INSIGHTS.map((ni) => (
            <div key={ni.insightId} className="bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-medium text-white">{ni.description}</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full border bg-surface-2 text-foreground-subtle border-border-subtle">{ni.networkPattern}</span>
              </div>
              <p className="text-[11px] text-foreground-muted mb-3 leading-relaxed">{ni.reasoning}</p>
              <div className="grid md:grid-cols-3 gap-3 mb-3 text-[10px] text-foreground-muted">
                <div className="bg-ink-950 border border-white/5 rounded p-2.5">
                  <span className="block text-white font-medium mb-0.5">Network Value</span>
                  <span>{ni.networkValueEstimate}</span>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5">
                  <span className="block text-white font-medium mb-0.5">Confidence</span>
                  <span className="text-amber-300 font-medium">{(ni.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded p-2.5">
                  <span className="block text-white font-medium mb-0.5">Status</span>
                  <span className="text-amber-300">{ni.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {ni.provenanceReferences.map((p) => (
                  <span key={p} className="bg-surface-2 rounded px-1.5 py-0.5 text-[9px] text-foreground-subtle border border-border-subtle">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
