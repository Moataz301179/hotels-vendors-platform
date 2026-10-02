"use client";
import { ArrowRight, Database, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceSourcesPage() {
  const { data, loading } = useApi<{ sources: any[] }>("/api/v1/intelligence/sources");
  const sources = data?.sources || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Evidence Sources</h1>
          <p className="text-sm text-foreground-muted">Real adapter sources with provenance tracking. Not simulated.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading sources...</div> :
         sources.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Database size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Source Adapters</h3>
            <p className="text-xs text-foreground-subtle">No adapter sources configured. Sources will appear when external adapters (supplier-discovery, graph, monitoring) are connected.</p>
          </div>
         ) : (
          <div className="grid md:grid-cols-4 gap-3 text-[10px] text-foreground-subtle">
            {sources.map((s: any) => (
              <div key={s.source} className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium block">{s.source}</span><span className="text-foreground-subtle">{s.adapterVersion}</span></div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
