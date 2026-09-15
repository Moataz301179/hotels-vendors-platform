"use client";

import { Package } from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

export default function ReceivingPage() {
  return (
    <RequireAuth>
      <AppShell active="/receiving">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Receiving</h1>
            <p className="text-sm text-foreground-muted">Goods receiving and inspection</p>
          </div>

          <div className="text-center py-16 bg-surface-1 border border-border-subtle rounded-xl">
            <Package size={32} className="mx-auto text-foreground-muted mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Deliveries to Receive</h3>
            <p className="text-foreground-muted text-sm max-w-md mx-auto">
              When deliveries arrive, you'll inspect goods, record any discrepancies,
              and update inventory. All receipts are recorded as GRNs for audit trail.
            </p>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
