"use client";

import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  squad: string;
  avatar: string;
  role: string;
  capabilities: string[];
  requiresApproval: boolean;
  status?: "idle" | "running" | "error" | "paused";
  lastRun?: string;
  successRate?: number;
}

interface AgentGridProps {
  agents: Agent[];
  onTriggerAgent: (agentId: string) => void;
}

const squadColors: Record<string, string> = {
  director: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  growth: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  operations: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  intelligence: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  execution: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const squadIcons: Record<string, string> = {
  director: "🐎",
  growth: "🚀",
  operations: "⚙️",
  intelligence: "🧠",
  execution: "🔧",
};

export function AgentGrid({ agents, onTriggerAgent }: AgentGridProps) {
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);

  const squads = Array.from(new Set(agents.map((a) => a.squad)));
  const filtered = selectedSquad ? agents.filter((a) => a.squad === selectedSquad) : agents;

  return (
    <div className="space-y-6">
      {/* Squad Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSquad(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            selectedSquad === null
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}
        >
          All ({agents.length})
        </button>
        {squads.map((squad) => (
          <button
            key={squad}
            onClick={() => setSelectedSquad(squad)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedSquad === squad
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {squadIcons[squad]} {squad.charAt(0).toUpperCase() + squad.slice(1)} ({agents.filter((a) => a.squad === squad).length})
          </button>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.avatar}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                  <p className="text-xs text-white/50">{agent.role}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${squadColors[agent.squad] || "border-white/10 text-white/50 bg-white/5"}`}>
                {agent.squad}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-xs mb-3">
              {agent.status === "running" && (
                <span className="text-emerald-400">● Running</span>
              )}
              {agent.status === "idle" && (
                <span className="text-blue-400">● Idle</span>
              )}
              {agent.status === "error" && (
                <span className="text-red-400">● Error</span>
              )}
              {agent.status === "paused" && (
                <span className="text-amber-400">● Paused</span>
              )}
              {!agent.status && (
                <span className="text-white/30">○ Standby</span>
              )}
              {agent.lastRun && (
                <span className="text-white/30 ml-auto">{agent.lastRun}</span>
              )}
            </div>

            {/* Success Rate */}
            {agent.successRate !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Success Rate</span>
                  <span className="text-white/80">{agent.successRate}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${agent.successRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Capabilities */}
            <div className="flex flex-wrap gap-1 mb-3">
              {agent.capabilities.slice(0, 3).map((cap) => (
                <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                  {cap}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onTriggerAgent(agent.id)}
                className="flex-1 px-3 py-1.5 rounded-md border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-colors"
              >
                ▶ Run Now
              </button>
              {agent.requiresApproval && (
                <span className="text-[10px] px-2 py-1 rounded-full border border-amber-500/30 text-amber-400">
                  Needs Approval
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
