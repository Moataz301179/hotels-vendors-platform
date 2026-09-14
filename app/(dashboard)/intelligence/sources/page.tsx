"use client";
import { Link2, Plus, ExternalLink, CheckCircle2, XCircle, Clock, Building2, Store } from "lucide-react";
import { SUPPLIERS, HOTELS } from "@/lib/data";

const SOURCES = [
  ...SUPPLIERS.map((s) => ({
    id: s.id,
    name: s.name,
    type: "supplier" as const,
    status: "active" as "active" | "error" | "paused",
    lastSync: "Seed data",
    records: s.categories.length,
  })),
  ...HOTELS.map((h) => ({
    id: h.id,
    name: h.name,
    type: "hotel" as const,
    status: "active" as "active" | "error" | "paused",
    lastSync: "Seed data",
    records: 1,
  })),
];

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Sources</h1>
              <p className="text-sm text-foreground-muted">Manage external intelligence sources</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} /> Add Source
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {SOURCES.map((source) => (
            <div key={source.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                  {source.type === "supplier" ? <Store size={18} className="text-green-400" /> : <Building2 size={18} className="text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-white font-medium">{source.name}</h3>
                  <p className="text-xs text-foreground-muted">{source.type} • {source.records} records</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-foreground-muted">{source.lastSync}</span>
                {source.status === "active" && <CheckCircle2 size={16} className="text-green-400" />}
                {source.status === "error" && <XCircle size={16} className="text-red-400" />}
                {source.status === "paused" && <Clock size={16} className="text-amber-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
