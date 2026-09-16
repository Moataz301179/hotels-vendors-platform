"use client";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceDiscoveryPage() {
  const { loading } = useApi<{ sources: any[] }>("/api/v1/intelligence/sources");

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Discovery</h1>
          <p className="text-sm text-foreground-muted">Real discovery requires user-initiated adapter connections. Not autonomous.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Search size={16} className="text-foreground-muted" /> Discovery Process</h2>
          <p className="text-xs text-foreground-muted mb-4">Discovery requires connecting an adapter and configuring scope. No autonomous discovery runs.</p>
          <ul className="text-[11px] text-foreground-subtle space-y-1">
            <li>• Adapter connection verified via <code className="text-foreground-subtle">/api/v1/intelligence/sources</code></li>
            <li>• Evidence ingestion writes to <code className="text-foreground-subtle">EvidenceRecord</code> with hash provenance</li>
            <li>• Entity resolution links to <code className="text-foreground-subtle">prisma</code> entities (hotel, supplier, hub)</li>
            <li>• All recommendations remain <code className="text-foreground-subtle">PROPOSED</code>; no autonomous execution</li>
          </ul>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3">Authority Matrix Note</h2>
          <p className="text-xs text-foreground-muted">Every mutation path requires Authority Matrix evaluation. Admin overrides require dual authorization. This page connects to real adapter sources — no simulated discovery pipeline.</p>
        </div>
      </div>
    </div>
  );
}
