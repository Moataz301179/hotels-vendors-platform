"use client";
import { ArrowRight, ShieldCheck, Clock, Target } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { OpportunityPackage } from "@/lib/intelligence/opportunity/engine";

export default function IntelligenceOpportunitiesPage() {
  const { data, loading } = useApi<{ opportunities: OpportunityPackage[] }>("/api/v1/intelligence/opportunities");
  const opportunities = data?.opportunities || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Opportunity Matching</h1>
          <p className="text-sm text-foreground-muted">Commercial recommendations from real opportunity engine. Not autonomous.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading opportunities...</div> :
         opportunities.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Target size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Opportunities</h3>
            <p className="text-xs text-foreground-subtle">No opportunity packages for this tenant. Real engine returns empty when no findings produce commercial recommendations.</p>
          </div>
         ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {opportunities.map((op: OpportunityPackage) => (
              <div key={op.opportunityId} className="bg-surface-1 border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-medium text-white mb-2">{op.description}</h3>
                <p className="text-xs text-foreground-subtle mb-3">{op.reasoning}</p>
                <div className="flex items-center gap-2 text-[10px] text-foreground-subtle">
                  <span>Status: <span className="text-amber-300">{op.status}</span></span>
                  <span>• Confidence: {(op.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
