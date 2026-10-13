"use client";
import { Clock } from "lucide-react";
import type { EvidenceRecord } from "@prisma/client";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceEvidencePage() {
  const { data, loading, error } = useApi<{ evidence: Pick<EvidenceRecord, 'id' | 'entityName' | 'sourceReference' | 'extractedFact'>[] }>("/api/v1/intelligence/evidence");
  const evidence = data?.evidence || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Evidence Records</h1>
          <p className="text-sm text-foreground-muted">Evidence from real evidence store. Not simulated.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {error ? <div role="alert" className="p-4 text-red-400">{error}</div> : loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading evidence...</div> :
         evidence.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Clock size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Evidence Records</h3>
            <p className="text-xs text-foreground-subtle">The evidence store has no records for this tenant. Real data will appear when evidence adapters ingest verified records.</p>
          </div>
         ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {evidence.map((ev) => (
              <div key={ev.id || ev.sourceReference} className="bg-surface-1 border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-medium text-white">{ev.entityName || ev.id}</h3>
                <p className="text-[10px] text-foreground-subtle">Source: {ev.sourceReference}</p>
                <p className="text-xs text-foreground-muted mt-2">{ev.extractedFact}</p>
              </div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
