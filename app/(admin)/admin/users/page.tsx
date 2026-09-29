"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { IcSearch } from "@/components/icons";

export default function AdminUsersPage() {
  const { t, lang } = usePrefs();
  const { data } = useApp();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  const users = data?.users || [];
  const filtered = users.filter((u: any) => {
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.platformRole !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/admin/users">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-8 w-48 rounded-lg mt-3" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell active="/admin/users">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">{t("admin.userManagement")}</h2>
          <Input
            type="text"
            placeholder={t("admin.searchUsers")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.name")}</TableHead>
              <TableHead>{t("admin.email")}</TableHead>
              <TableHead>{t("admin.role")}</TableHead>
              <TableHead>{t("admin.tenant")}</TableHead>
              <TableHead>{t("admin.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.platformRole || "user"}</Badge>
                </TableCell>
                <TableCell>{u.tenant?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={u.status === "active" ? "default" : "destructive"}>
                    {u.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted py-8">
                  {t("admin.noUsers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AppShell>
    </RequireAuth>
  );
}
