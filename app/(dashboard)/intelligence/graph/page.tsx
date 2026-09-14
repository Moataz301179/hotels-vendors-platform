"use client";
import { Network, ExternalLink, Users, Building2, Store } from "lucide-react";
import { HOTELS, SUPPLIERS } from "@/lib/data";

const NODES = [
  ...HOTELS.map((h) => ({ id: h.id, name: h.name, type: "hotel" as const })),
  ...SUPPLIERS.map((s) => ({ id: s.id, name: s.name, type: "supplier" as const })),
];

export default function GraphPage() {
  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-1">Relationship Graph</h1>
        <p className="text-sm text-foreground-muted">Visualizing entity relationships and connections</p>
      </div>
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Network size={20} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Entity Network</h2>
        </div>
        <p className="text-foreground-muted mb-6">
          {NODES.length} entities loaded from seed data. Graph visualization requires backend graph API.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {NODES.map((node) => (
            <div key={node.id} className="flex items-center gap-2 p-3 bg-surface-2 rounded-lg">
              {node.type === "hotel" ? (
                <Building2 size={14} className="text-blue-400" />
              ) : (
                <Store size={14} className="text-green-400" />
              )}
              <span className="text-sm text-white truncate">{node.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
