"use client";

import { Truck, AlertCircle, Package } from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

export default function DeliveriesPage() {
  return (
    <RequireAuth>
      <AppShell active="/deliveries">
        <Guard roles={["carrier"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Deliveries</h1>
              <p className="text-sm text-foreground-muted">Manage and track deliveries</p>
            </div>

            <div className="text-center py-16 bg-surface-1 border border-border-subtle rounded-xl">
              <Truck size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Deliveries Assigned</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto">
                When you're assigned deliveries, they'll appear here with status tracking,
                route management, and exception reporting.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <Package size={14} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Active</div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <Truck size={14} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Completed</div>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-3">
                  <AlertCircle size={14} className="mx-auto text-foreground-muted mb-1" />
                  <div className="text-xl font-semibold text-white">0</div>
                  <div className="text-xs text-foreground-muted">Exceptions</div>
                </div>
              </div>
            </div>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
