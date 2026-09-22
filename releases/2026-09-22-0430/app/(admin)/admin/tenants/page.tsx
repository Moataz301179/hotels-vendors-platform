"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Building2, Loader2, AlertCircle,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  createdAt: string;
  _count: { users: number; hotels: number; suppliers: number };
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: { page: number; limit: number; total: number };
}

export default function TenantsPage() {
  const [q, setQ] = useState("");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<TenantsResponse>(
    `/api/v1/admin/tenants?${queryParams.toString()}`
  );

  const tenants = data?.tenants || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <RequireAuth>
      <AppShell active="/admin/tenants">
        <Guard roles={["platform_admin"]}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Tenants</h1>
                <p className="text-sm text-foreground-muted">
                  {data?.pagination ? `${data.pagination.total} organizations` : "Platform organizations"}
                </p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                <Plus size={16} />
                Add Tenant
              </button>
            </div>

            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <input
                type="text"
                placeholder="Search tenants..."
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
            ) : tenants.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <Building2 size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Tenants</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  Organizations will appear here when they register on the platform.
                </p>
              </div>
            ) : (
              <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Users</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{tenant.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            tenant.type === "PLATFORM" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            tenant.type === "HOTEL_GROUP" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}>
                            {tenant.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            tenant.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white">{tenant._count.users}</td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">{formatDate(tenant.createdAt)}</td>
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
