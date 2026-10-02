"use client";
import { ArrowRight, Network, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceGraphPage() {
  const { data, loading } = useApi<{ insights: any[] }>("/api/v1/intelligence/graph");
  const insights = data?.insights || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Network Intelligence</h1>
          <p className="text-sm text-foreground-muted">Real network pattern detection. Not simulated.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading network insights...</div> :
         insights.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Network size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Network Insights</h3>
            <p className="text-xs text-foreground-subtle">No network patterns detected. The engine produces insights when real supplier/hub relationships and delivery patterns exist.</p>
          </div>
         ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((ni: any) => (
              <div key={ni.insightId} className="bg-surface-1 border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-2">{ni.description}</h3>
                <p className="text-xs text-foreground-subtle mb-2">{ni.networkValueEstimate}</p>
                <span className="text-[9px] text-foreground-subtle">Status: {ni.status}</span>
              </div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
