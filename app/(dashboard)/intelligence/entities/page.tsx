"use client";
import { Users, Search, Filter, ExternalLink, Building2, Store } from "lucide-react";
import { useState } from "react";
import { HOTELS, SUPPLIERS } from "@/lib/data";

const ENTITIES = [
  ...HOTELS.map((h) => ({ id: h.id, name: h.name, type: "Hotel" as const, category: "Hospitality", location: h.city, confidence: 95 })),
  ...SUPPLIERS.map((s) => ({ id: s.id, name: s.name, type: "Supplier" as const, category: s.categories.join(", "), location: s.city, confidence: 90 })),
];

export default function EntitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = ENTITIES.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.location.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">Entities</h1>
          <p className="text-sm text-foreground-muted">All discovered organizations and their relationships</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input type="text" placeholder="Search entities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-foreground-secondary hover:bg-surface-2 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
        <div className="space-y-3">
          {filtered.map((entity) => (
            <div key={entity.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between hover:border-visible transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                  {entity.type === "Hotel" ? <Building2 size={18} className="text-blue-400" /> : <Store size={18} className="text-green-400" />}
                </div>
                <div>
                  <h3 className="text-white font-medium">{entity.name}</h3>
                  <p className="text-xs text-foreground-muted">{entity.type} • {entity.category} • {entity.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-green-400">{entity.confidence}%</span>
                <button className="text-accent hover:text-accent-light transition-colors"><ExternalLink size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
