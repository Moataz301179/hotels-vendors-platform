"use client";
import { ArrowRight, Users, ShieldCheck } from "lucide-react";

export default function IntelligenceEntitiesPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1"><ArrowRight size={16} className="text-foreground-muted" /><span className="text-[10px] text-foreground-muted uppercase tracking-wide">Entities</span></div>
          <h1 className="text-2xl font-semibold text-white mb-1">Entity Resolution</h1>
          <p className="text-sm text-foreground-muted">Resolved entity references (HOTEL, SUPPLIER, LOGISTICS_HUB) with resolution confidence, not raw names. Requires review.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Users size={16} className="text-foreground-muted" /> Resolved Entities</h2>
          <p className="text-xs text-foreground-muted mb-3">Entity references link intelligence findings to real database entities (hotel, supplier, logistics hub) via resolved IDs and alias tracking. Resolution confidence is separate from assertion confidence.</p>
          <div className="grid md:grid-cols-3 gap-3 text-[10px] text-foreground-subtle">
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">HOTEL</span>Property-level procurement entities linked to orders, invoices, consumption.</div>
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">SUPPLIER</span>Verified supplier entities with audit status, tier, and catalog links.</div>
            <div className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">LOGISTICS_HUB</span>Hub entities linked to trip stops, delivery routes, and consolidation patterns.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
