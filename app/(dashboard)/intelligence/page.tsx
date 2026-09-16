"use client";

import { useState, useEffect } from "react";
import {
  Eye, Database, Users, AlertTriangle, Target, FileSearch, Network,
  Plus, Building2, Store, Loader2, AlertCircle, Search,
} from "lucide-react";
import { apiFetch, backendAvailable } from "@/lib/api";
import { IntelligenceArenaShell } from "@/components/intelligence/arena-shell";

export default function IntelligenceOverview() {
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendAvailable) return;
    setLoading(true);
    Promise.all([
      apiFetch("/v1/crm/leads").then((d: any) => setLeads(d.leads || [])).catch(() => {}),
      apiFetch("/v1/sourcing/connect").then((d: any) => setSources(d.sources || [])).catch(() => {}),
    ]).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (!backendAvailable) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="bg-ink-950 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Workspace</h1>
            <p className="text-sm text-foreground-muted">Discover, correlate, and act on hospitality ecosystem insights</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Backend Not Connected</h3>
            <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
              Set <code className="text-accent">NEXT_PUBLIC_API_URL</code> to connect to the HotelsVendors backend.
            </p>
            <div className="text-xs text-foreground-muted">
              Available endpoints: <code>/v1/crm/leads</code>, <code>/v1/sourcing/discovery</code>, <code>/v1/sourcing/connect</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Workspace</h1>
              <p className="text-sm text-foreground-muted">Discover, correlate, and act on hospitality ecosystem insights</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} />
              New Discovery
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Leads</div>
            <div className="text-2xl font-semibold text-white">{leads.length}</div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Sources</div>
            <div className="text-2xl font-semibold text-white">{sources.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

        {/* Unified Intelligence Arena — Phase 2-7 Capabilities */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">Intelligence Arena — Phase 2-7 Capabilities</h3>
            <p className="text-xs text-foreground-muted mb-2">EvidenceRecord persistence (348b7d7) + IntelligenceEdge temporal relationships (9851734) + Need Detection (52d5b1d) + Opportunity Matching (fa9f082) + Temporal Contextual Reasoning (13e4e65) + Smart Approach / Commercial Intelligence (ed1f318) + Transaction Intelligence (13874a6) + Network Intelligence (629858a) + Continuous Intelligence (9db61e4). All capabilities use existing schema/provenance framework; no EvidenceRecord as P1; no autonomous action.</p>
            <div className="flex gap-3 text-[10px] text-foreground-subtle">
              <span className="bg-surface-2 rounded px-2 py-0.5">EvidenceRecord</span>
              <span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceEdge</span>
              <span className="bg-surface-2 rounded px-2 py-0.5">NeedFinding</span>
              <span className="bg-surface-2 rounded px-2 py-0.5">OpportunityPackage</span>
              <span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceApproach</span>
              <span className="bg-surface-2 rounded px-2 py-0.5">IntelligenceUpdate</span>
            </div>
          </div>
        </div>