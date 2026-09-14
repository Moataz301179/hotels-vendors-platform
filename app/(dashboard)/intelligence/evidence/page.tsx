"use client";
import { FileSearch, ExternalLink, CheckCircle2, AlertCircle, Building2, Store } from "lucide-react";
import { HOTELS, SUPPLIERS } from "@/lib/data";

const EVIDENCE = [
  ...HOTELS.slice(0, 2).map((h) => ({
    id: h.id,
    entity: h.name,
    source: "Seed Hotel Data",
    type: "Business Profile",
    verified: true,
    date: "2026-09-14",
  })),
  ...SUPPLIERS.slice(0, 2).map((s) => ({
    id: s.id,
    entity: s.name,
    source: "Seed Supplier Data",
    type: "Business Profile",
    verified: true,
    date: "2026-09-14",
  })),
];

export default function EvidencePage() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1">Evidence Vault</h1>
        <p className="text-sm text-foreground-muted">Source evidence and verification records</p>
      </div>
      <div className="space-y-3">
        {EVIDENCE.map((item) => (
          <div key={item.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                <FileSearch size={18} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">{item.entity}</h3>
                <p className="text-xs text-foreground-muted">{item.source} • {item.type} • {item.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {item.verified ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-amber-400" />}
              <button className="text-accent hover:text-accent-light transition-colors"><ExternalLink size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
