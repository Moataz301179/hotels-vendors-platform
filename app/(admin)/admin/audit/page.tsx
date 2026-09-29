"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { IcHistory } from "@/components/icons";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminAuditPage() {
  const { t, lang } = usePrefs();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      setEntries([
        { id: "1", action: "order.approve", actor: "admin@hv.com", timestamp: "2026-09-29T12:00:00Z", details: "Approved order #HV-2847" },
        { id: "2", action: "eta.submit", actor: "system", timestamp: "2026-09-29T11:45:00Z", details: "Submitted invoice INV-0042 to ETA" },
        { id: "3", action: "user.login", actor: "supplier@hv.com", timestamp: "2026-09-29T10:30:00Z", details: "Login from 187.77.181.3" },
      ]);
      setLoading(false);
    }, 350);
    return () => clearTimeout(id);
  }, []);

  const filtered = entries.filter((e) =>
    !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/admin/audit">
          <PageHeader title={t("admin.auditLog")} description={t("admin.auditDesc")} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell>{e.actor}</TableCell>
                <TableCell className="text-muted text-xs">{e.timestamp}</TableCell>
                <TableCell>{e.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppShell>
    </RequireAuth>
  );
}
