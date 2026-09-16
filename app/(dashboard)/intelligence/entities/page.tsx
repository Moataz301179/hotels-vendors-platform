"use client";
import { ArrowRight, Users, ShieldCheck } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

export default function IntelligenceEntitiesPage() {
  const { data, loading } = useApi<{ entities: any[] }>("/api/v1/intelligence/entities");
  const entities = data?.entities || [];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Entity Resolution</h1>
          <p className="text-sm text-foreground-muted">Real resolved entities. Not simulated.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? <div className="text-center p-8 text-sm text-foreground-muted">Loading entities...</div> :
         entities.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center text-sm text-foreground-muted">
            <Users size={20} className="mx-auto text-foreground-muted mb-2" />
            <h3 className="text-white font-medium mb-1">No Resolved Entities</h3>
            <p className="text-xs text-foreground-subtle">No entity resolutions for this tenant. Resolution results will appear when the engine processes verified entity references.</p>
          </div>
         ) : (
          <div className="grid md:grid-cols-3 gap-3 text-[10px] text-foreground-subtle">
            {entities.map((e: any) => (
              <div key={e.resolvedId || e.entityId} className="bg-ink-950 border border-white/5 rounded p-3"><span className="text-white font-medium">{e.entityType || "Entity"}</span><span className="block text-[9px]">{e.resolvedId || e.entityId}</span></div>
            ))}
          </div>
         )}
      </div>
    </div>
  );
}
