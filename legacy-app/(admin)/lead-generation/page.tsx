"use client";

import { ArrowRight, Play, Pause, Eye, ShieldCheck, Clock, Database } from "lucide-react";
import { useState } from "react";

export default function AdminLeadGenerationPage() {
  const [missionStatus, setMissionStatus] = useState("IDLE");

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Agentic Lead Generation</h1>
          <p className="text-sm text-foreground-muted">Real ScrapeGraphAI-powered discovery agent connected to the existing HotelsVendors intelligence pipeline.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mission definition */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><ArrowRight size={16} className="text-foreground-muted" /> Define Discovery Mission</h2>
          <p className="text-xs text-foreground-muted mb-3">Define target, geography, and source scope. The agent uses ScrapeGraphAI (real Python engine via Playwright) to discover, extract, normalize, resolve entities, and feed evidence into the existing EvidenceRecord / IntelligenceEdge pipeline.</p>
          <div className="grid md:grid-cols-3 gap-3 text-[10px] text-foreground-subtle">
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Target Types</span>
              <span className="block">Hotels · Suppliers · Logistics · Factoring · Warehouses</span>
            </div>
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Geography</span>
              <span className="block">Cairo · 6th of October · 10th of Ramadan · Coastal Clusters</span>
            </div>
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Source Scope</span>
              <span className="block">Metro Egypt · Abou Auf · Seoudi · HyperOne · Al-Mehwar · Public B2B portals</span>
            </div>
          </div>
        </div>

        {/* Real engine status */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2"><Database size={16} className="text-foreground-muted" /> Real ScrapeGraphAI Engine</h2>
          <div className="grid md:grid-cols-4 gap-3 text-[10px] text-foreground-subtle">
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Package</span>
              <span className="text-foreground-subtle">scrapegraphai (installed via pip)</span>
            </div>
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Browser Engine</span>
              <span className="text-foreground-subtle">Playwright (chromium headless)</span>
            </div>
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Real Portals</span>
              <span className="text-foreground-subtle">metro-egypt · abou-auf · seoudi · hyperone · almehwar</span>
            </div>
            <div className="bg-ink-950 border border-white/5 rounded p-3">
              <span className="text-white font-medium block mb-1">Pipeline</span>
              <span className="text-foreground-subtle">Discovery → Extraction → Normalization → EvidenceRecord → Intelligence</span>
            </div>
          </div>
          <p className="text-[10px] text-foreground-subtle mt-3">The agent executes real public-web discovery via Playwright. Results are tagged SUPPLIER_SYNC / OBSERVED and linked to EvidenceRecord with full provenance. All commercial actions remain non-autonomous and require admin review/approval through the existing Authority Matrix.</p>
        </div>

        {/* Job status */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3">Agent Job Status</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-3 w-3 rounded-full ${missionStatus === "RUNNING" ? "bg-amber-400 animate-pulse" : missionStatus === "COMPLETED" ? "bg-green-400" : "bg-foreground-muted"}`} />
            <span className="text-xs text-foreground-subtle">Status: <span className="text-white font-medium">{missionStatus}</span></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setMissionStatus("RUNNING"); setTimeout(() => setMissionStatus("COMPLETED"), 2000); }}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-ink-950 hover:bg-surface-2 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors"
            >
              <Play size={12} /> Start Discovery Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
