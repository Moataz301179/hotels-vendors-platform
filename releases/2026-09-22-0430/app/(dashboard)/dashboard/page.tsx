"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart, Package, Users, Building2, TrendingUp, AlertCircle, Loader2,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { RequireAuth } from "@/components/AppShell";

interface DashboardStats {
  orders: { total: number; pending: number; delivered: number };
  suppliers: { total: number };
  products: { total: number };
}

export default function DashboardPage() {
  const { data, loading, error } = useApi<DashboardStats>("/api/v1/admin/dashboard");

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/dashboard">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-accent animate-spin" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  const stats = data || { orders: { total: 0, pending: 0, delivered: 0 }, suppliers: { total: 0 }, products: { total: 0 } };

  return (
    <RequireAuth>
      <AppShell active="/dashboard">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
            <p className="text-sm text-foreground-muted">Procurement overview and activity</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <ShoppingCart size={16} className="text-foreground-muted mb-2" />
              <div className="text-2xl font-semibold text-white">{stats.orders.total}</div>
              <div className="text-xs text-foreground-muted">Total Orders</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <Package size={16} className="text-amber-400 mb-2" />
              <div className="text-2xl font-semibold text-white">{stats.orders.pending}</div>
              <div className="text-xs text-foreground-muted">Pending</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <TrendingUp size={16} className="text-green-400 mb-2" />
              <div className="text-2xl font-semibold text-white">{stats.orders.delivered}</div>
              <div className="text-xs text-foreground-muted">Delivered</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <Building2 size={16} className="text-blue-400 mb-2" />
              <div className="text-2xl font-semibold text-white">{stats.suppliers.total}</div>
              <div className="text-xs text-foreground-muted">Suppliers</div>
            </div>
          </div>

          {/* Empty state */}
          {stats.orders.total === 0 && (
            <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
              <AlertCircle size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Activity Yet</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto">
                Your dashboard will populate as you create orders, connect with suppliers,
                and process deliveries. All activity is tracked and auditable.
              </p>
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
