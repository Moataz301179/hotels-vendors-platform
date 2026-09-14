"use client";
import { Target, ExternalLink, Building2, Store, TrendingUp } from "lucide-react";
import { SUPPLIERS, HOTELS } from "@/lib/data";

const OPPORTUNITIES = [
  ...SUPPLIERS.map((s) => ({
    id: s.id,
    title: `${s.name} — Supplier Match Opportunity`,
    category: "Supplier Match",
    value: "High",
    confidence: 90,
    entity: s.name,
  })),
  ...HOTELS.map((h) => ({
    id: h.id,
    title: `${h.name} — Hotel Intelligence`,
    category: "Hotel Discovery",
    value: "High",
    confidence: 95,
    entity: h.name,
  })),
];

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1">Opportunities</h1>
        <p className="text-sm text-foreground-muted">Commercial opportunities and prospects</p>
      </div>
      <div className="space-y-4">
        {OPPORTUNITIES.map((opp) => (
          <div key={opp.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between hover:border-visible transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                <Target size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">{opp.title}</h3>
                <p className="text-xs text-foreground-muted">{opp.category} • {opp.entity}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium ${opp.value === "High" ? "text-green-400" : "text-amber-400"}`}>{opp.value} Value</span>
              <span className="text-xs text-foreground-muted">{opp.confidence}%</span>
              <button className="text-accent hover:text-accent-light transition-colors"><ExternalLink size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
