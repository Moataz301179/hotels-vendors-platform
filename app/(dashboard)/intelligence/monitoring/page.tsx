"use client";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceMonitoringPage() {
  const { data, loading } = useApi<{ updates: any[] }>("/api/v1/intelligence/monitoring");
  const updates = data?.updates || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Continuous Intelligence</h1>
          <p className="text-sm text-foreground-muted">Real change detection updates. Not simulated.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading updates...</div> :
         updates.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Clock size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Updates</h3>
            <p className="text-xs text-foreground-subtle">No intelligence updates detected for this tenant. The monitoring engine produces findings when real evidence/relationship changes occur.</p>
          </div>
         ) : (
          <div className="space-y-3">
            {updates.map((upd: any) => (
              <div key={upd.updateId} className="bg-ink-950 border border-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white">{upd.description}</h3>
                <p className="text-xs text-foreground-subtle">{upd.reasoning}</p>
                <span className="text-[9px] text-foreground-subtle">Status: {upd.status}</span>
              </div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
