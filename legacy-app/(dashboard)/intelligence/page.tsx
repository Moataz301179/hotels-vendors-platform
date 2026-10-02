"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Loader2, AlertCircle, Eye, Database, Users,
  Target, FileSearch, Network,
} from "lucide-react";
import { apiFetch, backendAvailable } from "@/lib/api";
import { IntelligenceArenaShell } from "@/components/intelligence/arena-shell";

export default function IntelligenceOverview() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendAvailable) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      apiFetch("/v1/crm/leads").then((d: any) => setLeads(d.leads || [])).catch(() => setLeads([])),
      apiFetch("/v1/sourcing/connect").then((d: any) => setSources(d.sources || [])).catch(() => setSources([])),
    ])
      .catch((e) => setError(e.message || "Failed to load intelligence data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Intelligence Workspace</h1>
              <p className="text-sm text-foreground-muted">Discover, correlate, and act on hospitality ecosystem insights</p>
            </div>
            <a
              href="/intelligence/discovery"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              <Plus size={16} />
              New Discovery
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-foreground-muted uppercase tracking-wide mb-1">
              <Users size={14} /> Leads
            </div>
            <div className="text-2xl font-semibold text-white">
              {loading ? <Loader2 size={20} className="text-foreground-muted animate-spin" /> : leads.length}
            </div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-foreground-muted uppercase tracking-wide mb-1">
              <Database size={14} /> Sources
            </div>
            <div className="text-2xl font-semibold text-white">
              {loading ? <Loader2 size={20} className="text-foreground-muted animate-spin" /> : sources.length}
            </div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-foreground-muted uppercase tracking-wide mb-1">
              <Target size={14} /> Findings
            </div>
            <div className="text-2xl font-semibold text-white">—</div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-foreground-muted uppercase tracking-wide mb-1">
              <Network size={14} /> Updates
            </div>
            <div className="text-2xl font-semibold text-white">—</div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950/30 border border-red-900/30 rounded-xl p-4 text-sm text-red-300 flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Arena Shell — always rendered; connects intelligence phases to real routes */}
        <IntelligenceArenaShell role="HOTEL" tenantId="demo" userId="user-1" />

        {/* Sub-routes for exploration */}
        <div className="grid md:grid-cols-3 gap-4">
          <a href="/intelligence/evidence" className="block bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors group">
            <div className="flex items-center gap-2 mb-2 text-white font-medium group-hover:text-accent">
              <Eye size={16} /> Evidence
            </div>
            <p className="text-xs text-foreground-muted">EvidenceRecord timeline, provenance taxonomy, audit links.</p>
          </a>
          <a href="/intelligence/findings" className="block bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors group">
            <div className="flex items-center gap-2 mb-2 text-white font-medium group-hover:text-accent">
              <FileSearch size={16} /> Findings
            </div>
            <p className="text-xs text-foreground-muted">Need detections, opportunity packages, temporal reasoning.</p>
          </a>
          <a href="/intelligence/opportunities" className="block bg-surface-1 border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors group">
            <div className="flex items-center gap-2 mb-2 text-white font-medium group-hover:text-accent">
              <Target size={16} /> Opportunities
            </div>
            <p className="text-xs text-foreground-muted">Commercial recommendations mapped to procurement actions.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
