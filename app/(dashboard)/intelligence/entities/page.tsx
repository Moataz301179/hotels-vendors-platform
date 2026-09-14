"use client";

import { useState, useEffect } from "react";
import {
  Eye, Database, Users, AlertTriangle, Target, FileSearch, Network,
  Plus, Building2, Store, Loader2, AlertCircle, Search, CheckCircle,
  Clock, Shield, HelpCircle,
} from "lucide-react";

interface Entity {
  id: string;
  name: string;
  type: "Hotel" | "Supplier";
  category: string;
  location: string;
  starRating?: number;
  source: string;
  sourceUrl?: string | null;
  dataClassification: string;
  retrievalTimestamp?: string | null;
  status: string;
  tier: string;
  createdAt: string;
}

function DataClassificationBadge({ classification }: { classification: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    EXTERNAL_OBSERVED: {
      color: "bg-green-400/10 text-green-400 border-green-400/20",
      icon: <Eye size={12} />,
      label: "Externally Observed",
    },
    SEED_DEMO: {
      color: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      icon: <Database size={12} />,
      label: "Seed / Demo Data",
    },
    USER_PROVIDED: {
      color: "bg-blue-400/10 text-blue-400 border-blue-400/20",
      icon: <Users size={12} />,
      label: "User Provided",
    },
    INFERRED: {
      color: "bg-purple-400/10 text-purple-400 border-purple-400/20",
      icon: <Network size={12} />,
      label: "Inferred",
    },
    VALIDATED: {
      color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      icon: <CheckCircle size={12} />,
      label: "Validated",
    },
    AUTHORIZED: {
      color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
      icon: <Shield size={12} />,
      label: "Authorized",
    },
  };

  const c = config[classification] || {
    color: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    icon: <HelpCircle size={12} />,
    label: classification,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border rounded ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassification, setFilterClassification] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
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
            sourceUrl: l.sourceUrl,
            dataClassification: l.dataClassification || "SEED_DEMO",
            retrievalTimestamp: l.retrievalTimestamp,
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

  const filtered = entities.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterClassification === "all" || e.dataClassification === filterClassification;
    return matchesSearch && matchesFilter;
  });

  const externalCount = entities.filter((e) => e.dataClassification === "EXTERNAL_OBSERVED").length;
  const seedCount = entities.filter((e) => e.dataClassification === "SEED_DEMO").length;

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
        <div className="text-center max-w-md">
          <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">Unable to load entities</h3>
          <p className="text-foreground-muted text-sm mb-4">{error}</p>
          <div className="bg-surface-1 border border-border-subtle rounded-lg p-4 text-left">
            <h4 className="text-sm font-medium text-white mb-2">To see entities:</h4>
            <ul className="text-xs text-foreground-muted space-y-1">
              <li>• Sign in with an account that has CRM read permissions</li>
              <li>• Connect a data source or run entity discovery</li>
              <li>• Entities appear here when hotels/suppliers are discovered</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Entities</h1>
              <p className="text-sm text-foreground-muted">
                Discovered organizations • {entities.length} entities
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} />
              New Discovery
            </button>
          </div>

          {/* Classification summary */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs">
              <Eye size={14} className="text-green-400" />
              <span className="text-foreground-muted">Externally Observed:</span>
              <span className="text-green-400 font-medium">{externalCount}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Database size={14} className="text-amber-400" />
              <span className="text-foreground-muted">Seed/Demo:</span>
              <span className="text-amber-400 font-medium">{seedCount}</span>
            </div>
          </div>
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
          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className="px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-white focus:outline-none focus:border-accent transition-colors"
          >
            <option value="all">All Classifications</option>
            <option value="EXTERNAL_OBSERVED">Externally Observed</option>
            <option value="SEED_DEMO">Seed / Demo</option>
            <option value="USER_PROVIDED">User Provided</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={24} className="mx-auto text-foreground-muted mb-2" />
            <p className="text-foreground-muted text-sm">
              {entities.length === 0
                ? "No entities yet. Connect a data source or run discovery to find hotels and suppliers."
                : "No entities match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entity) => (
              <div
                key={entity.id}
                className="bg-surface-1 border border-border-subtle rounded-xl p-4 hover:border-visible transition-colors"
              >
                <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-2 mt-1">
                        <DataClassificationBadge classification={entity.dataClassification} />
                        {entity.dataClassification === "EXTERNAL_OBSERVED" && entity.retrievalTimestamp && (
                          <span className="text-xs text-foreground-muted flex items-center gap-1">
                            <Clock size={10} />
                            Observed: {new Date(entity.retrievalTimestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entity.sourceUrl && (
                      <a
                        href={entity.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-muted hover:text-accent transition-colors"
                        title="View source"
                      >
                        <Eye size={14} />
                      </a>
                    )}
                    <span className="text-xs text-foreground-muted">
                      {new Date(entity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
