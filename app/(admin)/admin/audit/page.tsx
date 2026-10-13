"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import AppShell, { RequireAuth } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { Skeleton, Input } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui";
import { IcHistory } from "@/components/icons";
import { PageHeader } from "@/components/shared/page-header";

interface AuditEntry {
  id: string;
  entityName: string | null;
  entityId: string;
  actionType: string | null;
  actorId: string | null;
  actorRole: string | null;
  changes: unknown;
  createdAt: string;
}

export default function AdminAuditPage() {
  const { t, lang } = usePrefs();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAuditLog = async () => {
      try {
        const res = await fetch("/api/v1/admin/audit-log?limit=200", {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setEntries(data.data?.entries ?? data.entries ?? []);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLog();
    return () => controller.abort();
  }, []);

  const filtered = entries.filter(
    (e) =>
      !search ||
      JSON.stringify(e).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/admin/audit">
          <PageHeader title={t("admin.auditLog")} description={t("admin.auditDesc")} />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell active="/admin/audit">
        <PageHeader title={t("admin.auditLog")} description={t("admin.auditDesc")} />
        <Input
          type="text"
          placeholder={t("admin.searchAudit")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-64"
        />
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {filtered.length === 0 && !loading ? (
          <Card className="p-8">
            <div className="text-center">
              <IcHistory className="mx-auto h-8 w-8 text-ink-300" />
              <p className="mt-3 text-sm text-ink-500">{t("admin.noAuditEntries")}</p>
            </div>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.action")}</TableHead>
                <TableHead>{t("admin.actor")}</TableHead>
                <TableHead>{t("admin.time")}</TableHead>
                <TableHead>{t("admin.details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.actionType ?? "—"}</TableCell>
                  <TableCell>{e.actorId ?? e.actorRole ?? "System"}</TableCell>
                  <TableCell className="text-muted text-xs">
                    {new Date(e.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG")}
                  </TableCell>
                  <TableCell>
                    {e.entityName ?? "Record"} · {e.entityId}
                    {e.changes ? ` — ${JSON.stringify(e.changes)}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppShell>
    </RequireAuth>
  );
}
