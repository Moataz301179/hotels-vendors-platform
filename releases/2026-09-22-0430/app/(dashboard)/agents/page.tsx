export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/invo/status-badge";
import { KPICard, KPIGrid } from "@/components/invo/kpi-card";
import { Bot, Play, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const BG_CARD = "var(--bg-surface-1)";
const BORDER = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "#E9ECEF";
const TEXT_SECONDARY = "#9AA0A6";
const TEXT_MUTED = "#6C757D";
const ACCENT_ORANGE = "var(--accent-base)";

const AGENT_PIPELINE = [
  { id: "agent_1_ingestion", name: "Ingestion", desc: "Parse and validate incoming invoices", icon: "📥" },
  { id: "agent_2_compliance", name: "Compliance", desc: "ETA, fraud, and compliance checks", icon: "🛡️" },
  { id: "agent_3_signoff", name: "Sign-off", desc: "Delivery confirmation and approval", icon: "✅" },
  { id: "agent_4_routing", name: "Routing", desc: "Route to factoring or payment", icon: "🔀" },
];

export default async function AgentsPage() {
  const supabase = await createClient();

  const [auditRes, alertsRes] = await Promise.all([
    supabase.from("agent_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const auditLog = auditRes.data || [];
  const alerts = alertsRes.data || [];
  const openAlerts = alerts.filter((a) => a.status === "open").length;

  // Count actions per agent
  const agentCounts: Record<string, number> = {};
  auditLog.forEach((log) => {
    agentCounts[log.agent_name] = (agentCounts[log.agent_name] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Agent System</h1>
        <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
          Automated procurement pipeline — 4-agent orchestration
        </p>
      </div>

      <KPIGrid>
        <KPICard title="Total Actions" value={auditLog.length} icon={<Bot className="w-4 h-4" />} />
        <KPICard title="Open Alerts" value={openAlerts} accent={openAlerts > 0} icon={<AlertTriangle className="w-4 h-4" />} />
        <KPICard title="Pipeline Steps" value={4} icon={<Play className="w-4 h-4" />} />
        <KPICard title="Last 24h" value={auditLog.filter((l) => {
          const d = new Date(l.created_at);
          return Date.now() - d.getTime() < 86400000;
        }).length} accent icon={<CheckCircle className="w-4 h-4" />} />
      </KPIGrid>

      {/* Agent pipeline */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-sm font-bold">Agent Pipeline</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENT_PIPELINE.map((agent, i) => (
            <div
              key={agent.id}
              className="rounded-xl p-5 text-center"
              style={{ backgroundColor: "var(--bg-surface-2)", border: `1px solid ${BORDER}` }}
            >
              <div className="text-3xl mb-3">{agent.icon}</div>
              <div className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{agent.name}</div>
              <div className="text-[12px] mt-1" style={{ color: TEXT_SECONDARY }}>{agent.desc}</div>
              <div className="text-[11px] mt-3 font-mono" style={{ color: TEXT_MUTED }}>
                {agentCounts[agent.id] || 0} actions
              </div>
              <div className="mt-3">
                <button
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{ backgroundColor: "rgba(var(--accent-base-rgb),0.10)", color: ACCENT_ORANGE, border: "1px solid rgba(var(--accent-base-rgb),0.20)" }}
                >
                  Run Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run swarm */}
      <div className="rounded-xl p-6" style={{ backgroundColor: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>Run Full Swarm</h2>
            <p className="text-[12px] mt-1" style={{ color: TEXT_SECONDARY }}>
              Execute all 4 agents in sequence: Ingestion → Compliance → Sign-off → Routing
            </p>
          </div>
          <button
            className="px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: ACCENT_ORANGE, color: "#101215" }}
          >
            ▶ Run Swarm
          </button>
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG_CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
          <h2 className="text-sm font-bold">Agent Audit Log</h2>
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{auditLog.length} entries</span>
        </div>
        {auditLog.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Bot className="w-8 h-8 mx-auto mb-3" style={{ color: TEXT_MUTED }} />
            <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>No agent actions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ color: TEXT_MUTED }}>
                  <th className="text-left px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">Agent</th>
                  <th className="text-left px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">State Change</th>
                  <th className="text-right px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log) => (
                  <tr
                    key={log.log_id}
                    className="border-t transition-colors"
                    style={{ borderColor: BORDER }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(var(--accent-base-rgb),0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="px-5 py-3 font-semibold" style={{ color: ACCENT_ORANGE }}>{log.agent_name}</td>
                    <td className="px-5 py-3" style={{ color: TEXT_PRIMARY }}>{log.action_executed}</td>
                    <td className="px-5 py-3 font-mono text-[11px]" style={{ color: TEXT_MUTED }}>
                      {log.invoice_id?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                      {log.previous_state || "—"} → {log.new_state || "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-[12px]" style={{ color: TEXT_MUTED }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString("en-EG") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
