"use client";

import { FileCheck, AlertCircle } from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

export default function EtaCompliancePage() {
  return (
    <RequireAuth>
      <AppShell active="/eta-compliance">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">ETA Compliance</h1>
            <p className="text-sm text-foreground-muted">Egyptian Tax Authority e-invoicing</p>
          </div>

          <div className="text-center py-16 bg-surface-1 border border-border-subtle rounded-xl">
            <FileCheck size={32} className="mx-auto text-foreground-muted mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No ETA Submissions</h3>
            <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
              ETA compliance requires configuring your ETA credentials and digital signature.
              Once configured, invoices will be automatically submitted to the Egyptian Tax Authority.
            </p>
            <div className="bg-ink-950 border border-white/5 rounded-lg p-4 max-w-sm mx-auto text-left">
              <h4 className="text-sm font-medium text-white mb-2">To enable ETA:</h4>
              <ul className="text-xs text-foreground-muted space-y-1">
                <li>• Register for ETA e-invoicing portal</li>
                <li>• Obtain digital signature certificate</li>
                <li>• Configure credentials in Settings → ETA</li>
                <li>• Invoices will auto-submit on issuance</li>
              </ul>
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
