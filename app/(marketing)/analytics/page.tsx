"use client";

import { TrendingUp, DollarSign, ShoppingCart, Truck } from "lucide-react";
import AppShell, { RequireAuth } from "@/components/AppShell";

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      <AppShell active="/analytics">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Analytics</h1>
            <p className="text-sm text-foreground-muted">Procurement analytics and insights</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <DollarSign size={16} className="text-green-400 mb-2" />
              <div className="text-2xl font-semibold text-white">EGP 0</div>
              <div className="text-xs text-foreground-muted">Total Spend</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <ShoppingCart size={16} className="text-blue-400 mb-2" />
              <div className="text-2xl font-semibold text-white">0</div>
              <div className="text-xs text-foreground-muted">Orders</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <Truck size={16} className="text-purple-400 mb-2" />
              <div className="text-2xl font-semibold text-white">0</div>
              <div className="text-xs text-foreground-muted">Deliveries</div>
            </div>
            <div className="bg-surface-1 border border-border-subtle rounded-xl p-4">
              <TrendingUp size={16} className="text-amber-400 mb-2" />
              <div className="text-2xl font-semibold text-white">EGP 0</div>
              <div className="text-xs text-foreground-muted">Savings</div>
            </div>
          </div>

          <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
            <TrendingUp size={32} className="mx-auto text-foreground-muted mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Analytics Data Yet</h3>
            <p className="text-foreground-muted text-sm max-w-md mx-auto">
              Analytics will populate as you create orders, receive deliveries, and process invoices.
              Track spending by category, supplier performance, and savings.
            </p>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
