"use client";

import { Users, Search, Filter, ExternalLink, Building2, Store, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface Entity {
  id: string;
  name: string;
  type: "Hotel" | "Supplier";
  category: string;
  location: string;
  starRating?: number;
  source: string;
  status: string;
  tier: string;
  createdAt: string;
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    // Use the server-side proxy route that reads from the database
    fetch("/api/v1/crm/leads", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.leads) {
          const mapped: Entity[] = data.leads.map((l: any) => ({
            id: l.id,
            name: l.name,
            type: l.entityType === "HOTEL" ? "Hotel" : "Supplier",
            category: l.category || l.entityType,
            location: l.city,
            starRating: l.starRating,
            source: l.source,
            status: l.status,
            tier: l.tier,
            createdAt: l.createdAt,
          }));
          setEntities(mapped);
        } else {
          setError(data.error || "Failed to load entities");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">Unable to load entities</h3>
          <p className="text-foreground-muted text-sm">{error}</p>
          <p className="text-foreground-muted text-xs mt-2">
            Entities are populated when hotels and suppliers are discovered or onboarded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">Entities</h1>
          <p className="text-sm text-foreground-muted">
            Discovered organizations • {entities.length} entities
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-foreground-secondary hover:bg-surface-2 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={24} className="mx-auto text-foreground-muted mb-2" />
            <p className="text-foreground-muted text-sm">No entities match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entity) => (
              <div key={entity.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between hover:border-visible transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5">
                    {entity.type === "Hotel" ? (
                      <Building2 size={18} className="text-blue-400" />
                    ) : (
                      <Store size={18} className="text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{entity.name}</h3>
                    <p className="text-xs text-foreground-muted">
                      {entity.type} • {entity.category} • {entity.location}
                      {entity.starRating && ` • ${entity.starRating}★`}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      Source: {entity.source} • Status: {entity.status} • Tier: {entity.tier}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-foreground-muted">
                    {new Date(entity.createdAt).toLocaleDateString()}
                  </span>
                  <button className="text-accent hover:text-accent-light transition-colors">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
