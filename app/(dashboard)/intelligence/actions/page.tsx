"use client";
import { History, Plus } from "lucide-react";
import { SUPPLIERS } from "@/lib/data";

const ACTIONS = SUPPLIERS.map((s, i) => ({
  id: s.id,
  title: `Onboard ${s.name}`,
  status: i === 0 ? "pending" : i === 1 ? "in_progress" : "completed",
  priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
}));

export default function ActionsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Actions</h1>
              <p className="text-sm text-foreground-muted">Recommended actions and tasks</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} />
              Add Action
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {ACTIONS.map((action) => (
            <div key={action.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
                  <History size={16} className="text-foreground-muted" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{action.title}</h3>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${action.priority === "high" ? "bg-red-500/10 text-red-400" : action.priority === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-foreground-muted"}`}>
                {action.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
