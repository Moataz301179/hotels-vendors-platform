"use client";

import { useState, useEffect } from "react";
import {
  Users, Search, Loader2, AlertCircle, Building2, Package, Landmark, Truck,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  platformRole: string;
  status: string;
  tenant: { id: string; name: string; slug: string };
  hotel: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
  lastActive: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: { page: number; limit: number; total: number };
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  hotel: Building2,
  supplier: Package,
  partner: Landmark,
  carrier: Truck,
};

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  if (roleFilter !== "all") queryParams.set("role", roleFilter);
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<UsersResponse>(
    `/api/v1/admin/users?${queryParams.toString()}`
  );

  const users = data?.users || [];

  const formatDateTime = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <RequireAuth>
      <AppShell active="/admin/users">
        <Guard roles={["platform_admin"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Users</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} users` : "Platform users"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white focus:outline-none focus:border-accent"
              >
                <option value="all">All Roles</option>
                <option value="platform_admin">Platform Admin</option>
                <option value="hotel_admin">Hotel Admin</option>
                <option value="supplier_manager">Supplier Manager</option>
              </select>
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
            ) : users.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <Users size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Users Found</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  No users match your search criteria. Users appear here when they register
                  and are assigned roles.
                </p>
              </div>
            ) : (
              <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Tenant</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {users.map((user) => {
                      const entityType = user.hotel ? "hotel" : user.supplier ? "supplier" : "platform";
                      const EntityIcon = ENTITY_ICONS[entityType] || Users;
                      return (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5">
                                <EntityIcon size={14} className="text-foreground-muted" />
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">{user.name}</div>
                                <div className="text-xs text-foreground-muted">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">{user.tenant.name}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                              {user.platformRole}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              user.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground-muted">
                            {formatDateTime(user.lastActive)}
                          </td>
                        </tr>
                      );
                    })}
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
