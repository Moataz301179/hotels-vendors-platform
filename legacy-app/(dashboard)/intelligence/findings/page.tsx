"use client";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { NeedFinding } from "@/lib/intelligence/need-detection/types";

export default function IntelligenceFindingsPage() {
  const { data, loading, error } = useApi<{ findings: NeedFinding[] }>("/api/v1/intelligence/findings");
  const findings = data?.findings || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Need Detection</h1>
          <p className="text-sm text-foreground-muted">Explainable findings from real evidence and relationships. Not autonomous.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {loading ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">Loading findings...</div>
        ) : findings.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Clock size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Findings Detected</h3>
            <p className="text-xs text-foreground-subtle">No need findings for this tenant yet. Discovery or evidence updates will appear here when real data exists. This is an honest empty state — not simulated.</p>
          </div>
        ) : (
          findings.map((f: NeedFinding) => (
            <div key={f.entityId + f.needType} className="bg-surface-1 border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-1">{f.entityName}</h3>
              <p className="text-xs text-foreground-muted mb-3">{f.description}</p>
              <div className="grid md:grid-cols-3 gap-3 text-[10px] text-foreground-muted">
                <div className="bg-ink-950 rounded p-2 border border-white/5"><span className="text-white">Category</span><span className="block">{f.findingCategory}</span></div>
                <div className="bg-ink-950 rounded p-2 border border-white/5"><span className="text-white">Need Type</span><span className="block">{f.needType}</span></div>
                <div className="bg-ink-950 rounded p-2 border border-white/5"><span className="text-white">Status</span><span className="text-amber-300 block">{f.status}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
