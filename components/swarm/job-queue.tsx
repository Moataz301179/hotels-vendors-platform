"use client";

import { useState } from "react";

interface SwarmJob {
  id: string;
  jobType: string;
  jobName: string;
  status: string;
  squad: string;
  assignedAgent: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  requiresApproval: boolean;
}

interface JobQueueProps {
  jobs: SwarmJob[];
  onApprove: (jobId: string) => void;
  onRefresh: () => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: "text-white/50", label: "Pending" },
  SCHEDULED: { color: "text-blue-400", label: "Scheduled" },
  RUNNING: { color: "text-emerald-400", label: "Running" },
  WAITING_APPROVAL: { color: "text-amber-400", label: "Needs Approval" },
  COMPLETED: { color: "text-emerald-400", label: "Completed" },
  FAILED: { color: "text-red-400", label: "Failed" },
  RETRYING: { color: "text-amber-400", label: "Retrying" },
};

export function JobQueue({ jobs, onApprove, onRefresh }: JobQueueProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? jobs.filter((j) => j.status === filter) : jobs;
  const pendingApproval = jobs.filter((j) => j.status === "WAITING_APPROVAL").length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Job Queue</h3>
            <p className="text-xs text-white/50 mt-1">
              {jobs.length} total {pendingApproval > 0 && `· ${pendingApproval} need approval`}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1">
          {[
            { key: null, label: "All" },
            { key: "RUNNING", label: "Running" },
            { key: "WAITING_APPROVAL", label: "Approval" },
            { key: "COMPLETED", label: "Completed" },
            { key: "FAILED", label: "Failed" },
          ].map((f) => (
            <button
              key={f.key || "all"}
              onClick={() => setFilter(f.key)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                filter === f.key
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        <div className="space-y-1">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">No jobs match this filter</div>
          )}
          {filtered.map((job) => {
            const config = statusConfig[job.status] || statusConfig.PENDING;
            return (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{job.jobName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/40">
                        {job.squad}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {job.startedAt
                          ? new Date(job.startedAt).toLocaleTimeString()
                          : "Not started"}
                      </span>
                      {job.durationMs && (
                        <span className="text-[10px] text-white/30">
                          {Math.round(job.durationMs / 1000)}s
                        </span>
                      )}
                    </div>
                    {job.error && (
                      <p className="text-[10px] text-red-400 mt-1 truncate">{job.error}</p>
                    )}
                  </div>
                </div>

                {job.status === "WAITING_APPROVAL" && (
                  <button
                    onClick={() => onApprove(job.id)}
                    className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs transition-colors ml-2"
                  >
                    Approve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
