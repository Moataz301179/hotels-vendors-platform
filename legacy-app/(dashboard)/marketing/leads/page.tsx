"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, Plus, Sparkles, Mail, Phone, MapPin,
  TrendingUp, Users, Building2, Package, Truck, Landmark,
  MoreHorizontal, ArrowRight, Loader2,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

const KANBAN_COLUMNS = [
  { id: "DISCOVERED", label: "Discovered", color: "bg-surface-2" },
  { id: "ENRICHED", label: "Enriched", color: "bg-blue-500/5" },
  { id: "CONTACTED", label: "Contacted", color: "bg-amber-500/5" },
  { id: "QUALIFIED", label: "Qualified", color: "bg-purple-500/5" },
  { id: "MEETING_SCHEDULED", label: "Meeting", color: "bg-cyan-500/5" },
  { id: "PROPOSAL_SENT", label: "Proposal", color: "bg-pink-500/5" },
  { id: "NEGOTIATING", label: "Negotiating", color: "bg-orange-500/5" },
  { id: "CONVERTED", label: "Converted", color: "bg-emerald-500/5" },
  { id: "LOST", label: "Lost", color: "bg-red-500/5" },
  { id: "PAUSED", label: "Paused", color: "bg-gray-500/5" },
];

const ENTITY_ICONS: Record<string, React.ElementType> = {
  HOTEL: Building2,
  SUPPLIER: Package,
  FACTOR: Landmark,
  LOGISTICS: Truck,
};

const ENTITY_COLORS: Record<string, string> = {
  HOTEL: "text-blue-400",
  SUPPLIER: "text-amber-400",
  FACTOR: "text-purple-400",
  LOGISTICS: "text-cyan-400",
};

const ENTITY_BG: Record<string, string> = {
  HOTEL: "bg-blue-500/10",
  SUPPLIER: "bg-amber-500/10",
  FACTOR: "bg-purple-500/10",
  LOGISTICS: "bg-cyan-500/10",
};

interface Lead {
  id: string;
  name: string;
  entityType: "HOTEL" | "SUPPLIER" | "FACTOR" | "LOGISTICS";
  city: string | null;
  governorate: string | null;
  status: string;
  priority: number;
  source: string;
  assignedTo: { name: string } | null;
  lastContactAt: string | null;
  createdAt: string;
}

function PriorityBadge({ score }: { score: number }) {
  const color = score >= 8 ? "text-red-400 bg-red-500/10" : score >= 5 ? "text-amber-400 bg-amber-500/10" : "text-foreground-muted bg-surface-2";
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold ${color}`}>
      P{score}
    </span>
  );
}

function SkeletonKanban() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-72 flex-shrink-0 space-y-3">
          <div className="h-8 bg-surface-2 rounded-lg animate-pulse" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-32 bg-surface-1 rounded-xl border border-border-invisible animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, loading, error, refetch } = useApi<{ leads: Lead[]; pagination: { total: number } }>(
    "/api/v1/leads?limit=100"
  );

  const leads = data?.leads ?? [];

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.city && l.city.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === "ALL" || l.entityType === filterType;
      return matchesSearch && matchesType;
    });
  }, [leads, search, filterType]);

  const leadsByColumn = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    KANBAN_COLUMNS.forEach((c) => { map[c.id] = []; });
    filteredLeads.forEach((l) => {
      if (map[l.status]) map[l.status].push(l);
      else map["DISCOVERED"].push(l);
    });
    return map;
  }, [filteredLeads]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: leads.length };
    leads.forEach((l) => { counts[l.entityType] = (counts[l.entityType] || 0) + 1; });
    return counts;
  }, [leads]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Lead Pipeline</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Track prospects from discovery to conversion</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-medium border border-border-subtle text-foreground-secondary rounded-lg hover:bg-surface-1 transition-colors flex items-center gap-2"
          >
            <Sparkles size={13} />
            Enrich All
          </button>
          <button className="px-4 py-2 text-xs font-semibold bg-accent-base hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <Plus size={13} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "ALL", label: "All", icon: Users },
            { key: "HOTEL", label: "Hotels", icon: Building2 },
            { key: "SUPPLIER", label: "Suppliers", icon: Package },
            { key: "FACTOR", label: "Factors", icon: Landmark },
            { key: "LOGISTICS", label: "Logistics", icon: Truck },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterType === t.key
                  ? "bg-accent-base/15 text-accent-base border border-accent-base/25"
                  : "bg-surface-1 text-foreground-tertiary border border-border-subtle hover:bg-surface-2"
              }`}
            >
              <t.icon size={12} />
              {t.label}
              <span className="text-[10px] text-foreground-muted">({typeCounts[t.key] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-lg text-xs text-white placeholder:text-foreground-muted bg-surface-2 border border-border-subtle outline-none focus:border-accent-base/40 transition-all w-full sm:w-56"
            />
          </div>
          <button className="h-8 px-2.5 rounded-lg border border-border-subtle text-foreground-muted hover:text-foreground-secondary hover:bg-surface-1 transition-colors">
            <Filter size={12} />
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <SkeletonKanban />
      ) : error ? (
        <div className="text-center py-20 text-sm text-red-400">{error}</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {KANBAN_COLUMNS.map((col) => {
            const colLeads = leadsByColumn[col.id] ?? [];
            return (
              <div key={col.id} className="w-72 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${col.color} border border-border-invisible mb-3`}>
                  <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] font-bold text-foreground-muted bg-surface-2 px-1.5 py-0.5 rounded">{colLeads.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colLeads.map((lead) => {
                    const Icon = ENTITY_ICONS[lead.entityType] || Building2;
                    return (
                      <motion.div
                        key={lead.id}
                        layoutId={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="p-3.5 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-visible hover:bg-surface-1 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-7 h-7 rounded-lg ${ENTITY_BG[lead.entityType] || "bg-surface-2"} flex items-center justify-center`}>
                            <Icon size={14} className={ENTITY_COLORS[lead.entityType] || "text-foreground-muted"} />
                          </div>
                          <PriorityBadge score={lead.priority} />
                        </div>
                        <h4 className="text-[13px] font-semibold text-white mb-0.5 truncate">{lead.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-foreground-muted mb-2">
                          <MapPin size={9} />
                          {lead.city ?? "Unknown"}{lead.governorate ? `, ${lead.governorate}` : ""}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-foreground-muted uppercase tracking-wider">{lead.source}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 rounded hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary">
                              <Mail size={11} />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary">
                              <Phone size={11} />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary">
                              <MoreHorizontal size={11} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50" onClick={() => setSelectedLead(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface-1 border-l border-border-subtle p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)} className="text-foreground-muted hover:text-white transition-colors">Close</button>
            </div>
            <div className="space-y-4">
              {(() => {
                const Icon = ENTITY_ICONS[selectedLead.entityType] || Building2;
                return (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${ENTITY_BG[selectedLead.entityType]} ${ENTITY_COLORS[selectedLead.entityType]}`}>
                    <Icon size={10} />
                    {selectedLead.entityType}
                  </div>
                );
              })()}
              <h3 className="text-xl font-bold text-white">{selectedLead.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">City</p>
                  <p className="text-foreground-secondary">{selectedLead.city ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Governorate</p>
                  <p className="text-foreground-secondary">{selectedLead.governorate ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Priority</p>
                  <p className="text-foreground-secondary">P{selectedLead.priority}</p>
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Status</p>
                  <p className="text-foreground-secondary">{selectedLead.status}</p>
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Source</p>
                  <p className="text-foreground-secondary">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Assigned To</p>
                  <p className="text-foreground-secondary">{selectedLead.assignedTo?.name ?? "Unassigned"}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border-subtle space-y-2">
                <button className="w-full py-2.5 rounded-lg bg-accent-base hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Sparkles size={14} />
                  Enrich with AI
                </button>
                <button className="w-full py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-foreground-secondary text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2">
                  <Mail size={14} />
                  Send Outreach
                </button>
                <button className="w-full py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-foreground-secondary text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2">
                  <TrendingUp size={14} />
                  Convert to Tenant
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
