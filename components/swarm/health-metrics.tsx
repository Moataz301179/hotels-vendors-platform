"use client";

interface HealthData {
  summary: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    waitingApproval: number;
    successRate: number;
  };
  eventsBySeverity: Record<string, number>;
  modelHealth: Array<{
    provider: string;
    model: string;
    status: string;
  }>;
}

interface HealthMetricsProps {
  health: HealthData;
}

export function HealthMetrics({ health }: HealthMetricsProps) {
  const { summary, eventsBySeverity, modelHealth } = health;

  const metrics = [
    {
      label: "Success Rate",
      value: `${summary.successRate}%`,
      sub: `${summary.completedJobs} completed / ${summary.totalJobs} total`,
      progress: summary.successRate,
    },
    {
      label: "Pending Jobs",
      value: String(summary.pendingJobs),
      sub: "In queue or scheduled",
    },
    {
      label: "Failed Jobs",
      value: String(summary.failedJobs),
      sub: "Last 24 hours",
    },
    {
      label: "Needs Approval",
      value: String(summary.waitingApproval),
      sub: "Human-in-the-loop",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
            <p className="text-xs text-white/50 mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-white/40 mt-1">{m.sub}</p>
            {m.progress !== undefined && (
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Model Health */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-3">LLM Provider Health</h3>
        <div className="space-y-2">
          {modelHealth.map((model) => (
            <div key={`${model.provider}-${model.model}`} className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    model.status === "HEALTHY"
                      ? "bg-emerald-400"
                      : model.status === "DEGRADED"
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
                <span className="text-sm text-white/80">
                  {model.provider} / {model.model}
                </span>
              </div>
              <span
                className={`text-xs ${
                  model.status === "HEALTHY"
                    ? "text-emerald-400"
                    : model.status === "DEGRADED"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {model.status}
              </span>
            </div>
          ))}
          {modelHealth.length === 0 && (
            <p className="text-xs text-white/30">No model health data yet. Run a job first.</p>
          )}
        </div>
      </div>

      {/* Event Severity Breakdown */}
      {Object.keys(eventsBySeverity).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Events by Severity (24h)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"].map((sev) => {
              const count = eventsBySeverity[sev] || 0;
              const colors: Record<string, string> = {
                DEBUG: "bg-white/5 text-white/30",
                INFO: "bg-blue-500/10 text-blue-400",
                WARNING: "bg-amber-500/10 text-amber-400",
                ERROR: "bg-red-500/10 text-red-400",
                CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
              };
              return (
                <div key={sev} className={`text-center p-2 rounded-lg ${colors[sev]}`}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] uppercase">{sev}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
