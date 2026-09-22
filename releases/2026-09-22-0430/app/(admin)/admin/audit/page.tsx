"use client";

import { useState, useEffect } from "react";
import { Search, History, Loader2, AlertCircle, Shield } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  actionType: string;
  createdAt: string;
  actorId: string | null;
  actorRole: string | null;
  changes: unknown;
}

interface AuditResponse {
  auditLogs: AuditLog[];
  pagination: { page: number; limit: number; total: number };
}

export default function AuditPage() {
  const [q, setQ] = useState("");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<AuditResponse>(
    `/api/v1/admin/audit?${queryParams.toString()}`
  );

  const auditLogs = data?.auditLogs || [];

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <RequireAuth>
      <AppShell active="/admin/audit">
        <Guard roles={["platform_admin"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Audit Log</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} events` : "Platform activity log"}
              </p>
            </div>

            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <input
                type="text"
                placeholder="Search audit log..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-accent animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-foreground-muted text-sm">{error}</p>
                <button onClick={refetch} className="text-accent text-sm mt-2 hover:underline">Retry</button>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <History size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Audit Events</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  All platform actions (logins, approvals, mutations) will be recorded here
                  with full actor attribution and change history.
                </p>
              </div>
            ) : (
              <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Timestamp</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Entity</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground-muted">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white text-sm">{log.entityName}</td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">{log.actorId || "system"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
