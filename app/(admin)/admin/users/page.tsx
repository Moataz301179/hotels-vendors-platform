"use client";

import { useState, useEffect } from "react";
import { usePrefs } from "@/i18n/provider";
import AppShell, { RequireAuth } from "@/components/AppShell";
import { Badge, Card, CardContent, Skeleton, Table, TableHeader, TableBody, TableRow, TableCell, TableHead, Input } from "@/components/ui";

interface ApiUser {
  id: string;
  name: string;
  email: string;
  platformRole: string;
  status: string;
  tenant: { id: string; name: string; slug: string } | null;
  lastActive: string | null;
}

export default function AdminUsersPage() {
  const { t, lang } = usePrefs();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (roleFilter) params.set("role", roleFilter);
        params.set("limit", "200");
        const res = await fetch(`/api/v1/admin/users?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
          setUsers(json.data.users);
        } else {
          setError(json.error || "Failed to load users");
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    return () => controller.abort();
  }, [search, roleFilter]);

  const filtered =
    roleFilter || search
      ? users.filter((u) => {
          if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
          if (roleFilter && u.platformRole !== roleFilter) return false;
          return true;
        })
      : users;

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
        <Card>
          <CardContent className="p-0">
            {error && (
              <div className="px-4 py-3 text-sm text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
                {error}
              </div>
            )}
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
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted py-8">
                      {t("admin.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted text-xs">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.platformRole || "user"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        {u.tenant?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "error"}>
                          {u.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AppShell>
    </RequireAuth>
  );
}

