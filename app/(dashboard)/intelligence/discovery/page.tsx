"use client";

import { Search, Plus, Filter, MapPin, Globe, ExternalLink, Building2, Store } from "lucide-react";
import { useState } from "react";
import { HOTELS, SUPPLIERS } from "@/lib/data";

const DISCOVERIES = [
  ...HOTELS.map((h) => ({
    id: h.id,
    name: h.name,
    category: "Hotel",
    location: `${h.city}, Egypt`,
    confidence: 95,
    sources: 3,
  })),
  ...SUPPLIERS.map((s) => ({
    id: s.id,
    name: s.name,
    category: "Supplier",
    location: `${s.city}, Egypt`,
    confidence: 90,
    sources: 2,
  })),
];

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = DISCOVERIES.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Discovery</h1>
              <p className="text-sm text-foreground-muted">Discover new hotels, suppliers, and service providers</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} />
              Add Source
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input type="text" placeholder="Search by name, location, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-foreground-secondary hover:bg-surface-2 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 hover:border-visible transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-foreground-secondary">{item.category}</span>
                <span className="text-xs text-foreground-muted">{item.confidence}% confidence</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-1">{item.name}</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted mb-3">
                <MapPin size={14} /> {item.location}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-foreground-muted"><Globe size={12} /> {item.sources} sources</div>
                <button className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors">View <ExternalLink size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
