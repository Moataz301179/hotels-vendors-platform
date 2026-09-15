"use client";

import Link from "next/link";
import { useApi } from "@/lib/hooks/use-api";
import {
  Package, FileText, TrendingUp, Truck, AlertCircle, Loader2,
} from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface SupplierDashboardData {
  kpis: {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    inTransitOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    productsCount: number;
    lowStockCount: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    hotel: { name: string; city: string };
  }[];
  lowStock: { id: string; name: string; sku: string; stockQuantity: number }[];
}

export default function SupplierCentralPage() {
  const { data, loading, error } = useApi<SupplierDashboardData>("/api/v1/supplier/dashboard");

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/supplier">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-accent animate-spin" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  const kpis = data?.kpis || {
    totalOrders: 0, pendingOrders: 0, approvedOrders: 0, inTransitOrders: 0,
    deliveredOrders: 0, totalRevenue: 0, productsCount: 0, lowStockCount: 0,
  };

  const recentOrders = data?.recentOrders || [];
  const lowStock = data?.lowStock || [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "EGP", maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  return (
    <RequireAuth>
      <AppShell active="/supplier">
        <Guard roles={["supplier_manager"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Supplier Central</h1>
              <p className="text-sm text-foreground-muted">Sales pipeline and inventory overview</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
                <Package size={16} className="text-foreground-muted mb-2" />
                <div className="text-2xl font-semibold text-white">{kpis.totalOrders}</div>
                <div className="text-xs text-foreground-muted">Total Orders</div>
              </div>
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
                <TrendingUp size={16} className="text-green-400 mb-2" />
                <div className="text-2xl font-semibold text-white">{formatMoney(kpis.totalRevenue)}</div>
                <div className="text-xs text-foreground-muted">Revenue</div>
              </div>
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
                <Truck size={16} className="text-blue-400 mb-2" />
                <div className="text-2xl font-semibold text-white">{kpis.deliveredOrders}</div>
                <div className="text-xs text-foreground-muted">Delivered</div>
              </div>
              <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
                <AlertCircle size={16} className="text-amber-400 mb-2" />
                <div className="text-2xl font-semibold text-white">{kpis.lowStockCount}</div>
                <div className="text-xs text-foreground-muted">Low Stock</div>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/supplier/orders" className="flex items-center gap-3 p-4 bg-surface-1 border border-border-subtle rounded-xl hover:border-visible transition-colors">
                <Package size={20} className="text-foreground-muted" />
                <span className="text-white font-medium text-sm">Orders</span>
              </Link>
              <Link href="/supplier/catalog" className="flex items-center gap-3 p-4 bg-surface-1 border border-border-subtle rounded-xl hover:border-visible transition-colors">
                <Package size={20} className="text-foreground-muted" />
                <span className="text-white font-medium text-sm">Catalog</span>
              </Link>
              <Link href="/invoices" className="flex items-center gap-3 p-4 bg-surface-1 border border-border-subtle rounded-xl hover:border-visible transition-colors">
                <FileText size={20} className="text-foreground-muted" />
                <span className="text-white font-medium text-sm">Invoices</span>
              </Link>
              <Link href="/supplier/analytics" className="flex items-center gap-3 p-4 bg-surface-1 border border-border-subtle rounded-xl hover:border-visible transition-colors">
                <TrendingUp size={20} className="text-foreground-muted" />
                <span className="text-white font-medium text-sm">Analytics</span>
              </Link>
            </div>

            {/* Empty state */}
            {kpis.totalOrders === 0 && (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <Package size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Orders Yet</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  When hotels place orders with you, they'll appear here along with revenue analytics and inventory alerts.
                </p>
              </div>
            )}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
