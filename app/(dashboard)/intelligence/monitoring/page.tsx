"use client";
import { History, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { SUPPLIERS } from "@/lib/data";

const CHANGES = SUPPLIERS.map((s, i) => ({
  id: s.id,
  time: i === 0 ? "Seed data" : i === 1 ? "Seed data" : "Seed data",
  entity: s.name,
  change: "Available for monitoring",
  type: i === 0 ? "source" : i === 1 ? "relationship" : "evidence",
}));

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-white mb-1">Monitoring</h1>
          <p className="text-sm text-foreground-muted">Track changes and intelligence evolution</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {CHANGES.map((change) => (
            <div key={change.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                {change.type === "source" && <RefreshCw size={14} className="text-green-400" />}
                {change.type === "relationship" && <CheckCircle2 size={14} className="text-purple-400" />}
                {change.type === "evidence" && <CheckCircle2 size={14} className="text-cyan-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{change.entity}</p>
                <p className="text-xs text-foreground-muted">{change.change}</p>
              </div>
              <span className="text-xs text-foreground-muted">{change.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
