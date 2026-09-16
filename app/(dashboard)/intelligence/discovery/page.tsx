"use client";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";

export default function IntelligenceDiscoveryPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1"><ArrowRight size={16} className="text-foreground-muted" /><span className="text-[10px] text-foreground-muted uppercase tracking-wide">Discovery</span></div>
          <h1 className="text-2xl font-semibold text-white mb-1">Discovery</h1>
          <p className="text-sm text-foreground-muted">Entity discovery, evidence acquisition, and provenance tracking processes. Requires user-initiated action.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Search size={16} className="text-foreground-muted" /> Discovery Process</h2>
          <p className="text-xs text-foreground-muted mb-3">Discovery requires explicit action: connecting a data source, running entity resolution, or configuring an external adapter. No autonomous discovery runs continuously.</p>
          <ul className="text-[11px] text-foreground-subtle space-y-2">
            <li>• Connect adapter (supplier-discovery, intelligence-graph, continuous-monitoring)</li>
            <li>• Configure tenant scope and access type (PASSIVE / PUBLIC_DOCUMENT / METADATA / AUTHORIZED)</li>
            <li>• Run entity resolution with confidence scoring</li>
            <li>• Evidence records are hash-linked to adapter logs; audit chain preserved</li>
            <li>• Review results before any opportunity/action generation</li>
          </ul>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3">Authority Matrix Note</h2>
          <p className="text-xs text-foreground-muted">Discovery results feed into the Intelligence Arena but do not trigger orders, payments, or logistics actions. Every recommendation requires user review. The Authority Matrix (multi-level approval by order value, role, supplier tier) governs all mutation paths.</p>
        </div>
      </div>
    </div>
  );
}
