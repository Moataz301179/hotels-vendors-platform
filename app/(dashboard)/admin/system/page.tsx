"use client";
import AppShell, { RequireAuth } from "@/components/AppShell";
import { Card, PageHead, Btn } from "@/components/ui";
import { useApi } from "@/lib/hooks/use-api";
interface SystemStatus { checkedAt: string; databaseReachable: boolean; configuration: { service: string; present: boolean }[]; configurationMeaning: string; backupStatus: string }
export default function AdminSystemPage() {
  const status = useApi<SystemStatus>("/api/v1/admin/system");
  return <RequireAuth><AppShell active="/admin/system"><PageHead title="System health" sub="Read-only diagnostics. No secrets or environment editing." />
    <Btn onClick={() => status.refetch()}>Refresh checks</Btn>
    {status.loading ? <p role="status">Checking system…</p> : null}
    {status.error ? <p role="alert">{status.error}</p> : null}
    {status.data ? <Card className="mt-5 p-5"><p>Checked {new Date(status.data.checkedAt).toLocaleString()}</p><p className="mt-3">Database query: {status.data.databaseReachable ? "Reachable" : "Failed"}</p><h2 className="mt-5 font-semibold">Configuration presence</h2><p className="text-sm">{status.data.configurationMeaning}</p><dl className="mt-3 space-y-2">{status.data.configuration.map(item => <div key={item.service} className="flex justify-between border-b border-line py-2"><dt>{item.service}</dt><dd>{item.present ? "Present" : "Missing"}</dd></div>)}</dl><p className="mt-5">Backup recovery: not yet verified by a restore exercise.</p><p className="mt-2">Environment changes must use the controlled deployment process.</p></Card> : null}
  </AppShell></RequireAuth>;
}
