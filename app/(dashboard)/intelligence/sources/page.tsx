"use client";
import { ArrowRight, Database, ShieldCheck } from "lucide-react";

export default function IntelligenceSourcesPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1"><ArrowRight size={16} className="text-foreground-muted" /><span className="text-[10px] text-foreground-muted uppercase tracking-wide">Sources</span></div>
          <h1 className="text-2xl font-semibold text-white mb-1">Evidence Sources</h1>
          <p className="text-sm text-foreground-muted">Evidence sources (adapter/module names only) with access type classification. External URLs are never exposed in findings.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><Database size={16} className="text-foreground-muted" /> Source Adapters</h2>
          <p className="text-xs text-foreground-muted mb-4">Sources are classified by adapter version and ingestion trace. Every evidence hash (SHA-256) links back to adapter logs only. Access types: PASSIVE, PUBLIC_DOCUMENT, METADATA, AUTHORIZED.</p>
          <div className="grid md:grid-cols-4 gap-3 text-[10px] text-foreground-subtle">
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">supplier-discovery-adapter</span>v2.1.0 — PUBLIC_DOCUMENT</div>
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">intelligence-graph-adapter</span>v2.1.0 — METADATA</div>
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">continuous-monitoring-adapter</span>v2.1.0 — PASSIVE</div>
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">supplier-audit-adapter</span>v2.1.0 — AUTHORIZED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
