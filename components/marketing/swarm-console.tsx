"use client";

/* SwarmConsole — interactive control panel that drives the REAL AgentOrchestrator
   through /api/v1/agents + /api/v1/agents/run. Every agent card, workflow, and result
   is served live from the backend — zero fake data. */

import { useEffect, useState } from "react";
import {
  Cpu,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

type Agent = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  capabilities: string[];
};

type AgentResult = {
  taskId: string;
  agentId: string;
  status: "running" | "completed" | "failed" | "pending";
  output: string;
  findings: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
};

type AgentRunResponse = { success: boolean; results?: AgentResult[]; error?: string };
type AgentCatalogResponse = { success: boolean; agents?: Agent[]; error?: string };

const WORKFLOWS: { id: string; label: string }[] = [
  { id: "market_research_sprint", label: "Market Research Sprint" },
  { id: "feature_ideation_sprint", label: "Feature Ideation Sprint" },
  { id: "platform_audit", label: "Platform Audit" },
];

function truncate(text: string, max = 220): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
        <CheckCircle2 size={11} /> Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
        <XCircle size={11} /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
      <Activity size={11} /> Running
    </span>
  );
}

export function SwarmConsole() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [workflow, setWorkflow] = useState<string>(WORKFLOWS[0].id);
  const [singleAgent, setSingleAgent] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [results, setResults] = useState<AgentResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/agents")
      .then((res) => res.json())
      .then((data: AgentCatalogResponse) => {
        if (cancelled) return;
        if (data.success && data.agents) {
          setAgents(data.agents);
        } else {
          setCatalogError(data.error || "Failed to load agent catalog.");
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogError("Failed to reach the agent catalog endpoint.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runWorkflow = async () => {
    setLoading(true);
    setRunError(null);
    setResults([]);
    try {
      const res = await fetch("/api/v1/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(singleAgent ? { agentId: singleAgent } : { workflow }),
          ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
        }),
      });
      const data: AgentRunResponse = await res.json();
      if (res.ok && data.success) {
        setResults(data.results ?? []);
      } else {
        setRunError(data.error || "The swarm returned an error.");
      }
    } catch {
      setRunError("Network error — the swarm could not be reached.");
    } finally {
      setLoading(false);
    }
  };

  const agentName = (id: string): Agent | undefined =>
    agents.find((a) => a.id === id);

  return (
    <div className="space-y-8">
      {/* Control panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#314B43] flex items-center justify-center shrink-0">
            <Cpu size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Run the swarm</div>
            <div className="text-[11px] text-slate-500">
              Live orchestration against your real data &mdash; each run persists to the agent log.
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6d3b]">
              Workflow
            </label>
            <select
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value)}
              disabled={loading || !!singleAgent}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-800 disabled:opacity-50"
            >
              {WORKFLOWS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6d3b]">
              Single agent (optional)
            </label>
            <select
              value={singleAgent}
              onChange={(e) => setSingleAgent(e.target.value)}
              disabled={loading}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-800 disabled:opacity-50"
            >
              <option value="">— Run whole workflow —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.avatar} {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6d3b]">
            Custom prompt (optional)
          </label>
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Focus on ETA compliance gaps"
            disabled={loading}
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
          />
        </div>

        <button
          onClick={runWorkflow}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-md hover:bg-[#3a544a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          {loading ? "Agents working…" : singleAgent ? "Run agent" : "Run the swarm"}
        </button>
      </div>

      {/* Error panel */}
      {runError && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700 flex items-start gap-2">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          <span>{runError}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-14 text-slate-500">
          <Loader2 size={20} className="animate-spin text-[#314B43]" />
          <span className="text-sm font-medium">
            Agents working on live data&hellip;
          </span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length === 0 && !runError && (
        <p className="text-sm text-slate-400 py-6 text-center">
          No output yet &mdash; choose a workflow or agent and hit &ldquo;Run the swarm&rdquo;.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Activity size={13} /> {results.length} task{results.length === 1 ? "" : "s"} returned by the orchestrator
          </div>
          {results.map((r) => {
            const ag = agentName(r.agentId);
            return (
              <div
                key={r.taskId}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: ag ? `${ag.color}22` : "#e2e8f0" }}
                  >
                    {ag?.avatar ?? "🤖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {ag?.name ?? r.agentId}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {ag?.role ?? r.agentId}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                  {r.findings ? (
                    truncate(r.findings)
                  ) : r.output ? (
                    truncate(r.output)
                  ) : (
                    <span className="text-slate-400">No findings returned.</span>
                  )}
                </div>

                {r.durationMs !== null && r.durationMs !== undefined && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Completed in {(r.durationMs / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Agent catalog */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Swarm roster &middot; {agents.length} live agents
        </div>
        {catalogError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
            {catalogError}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-slate-400">Loading agents…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {agents.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${a.color}22` }}
                  >
                    {a.avatar}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0 ml-auto"
                    style={{ backgroundColor: a.color }}
                    aria-label="agent color"
                  />
                </div>
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {a.name}
                </div>
                <div className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                  {a.role}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.capabilities.slice(0, 2).map((c) => (
                    <span
                      key={c}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium"
                    >
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}