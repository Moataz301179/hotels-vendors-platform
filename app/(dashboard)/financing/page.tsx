"use client";

import { Landmark, ArrowRight } from "lucide-react";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

export default function FinancingPage() {
  return (
    <RequireAuth>
      <AppShell active="/financing">
        <Guard roles={["hotel_admin", "gm", "finance_director", "partner_officer"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Financing & Factoring</h1>
              <p className="text-sm text-foreground-muted">Credit lines and invoice factoring</p>
            </div>

            <div className="text-center py-16 bg-surface-1 border border-border-subtle rounded-xl">
              <Landmark size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Financing Applications</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                Apply for credit lines or factor your approved invoices to get paid faster.
                Partner with licensed factoring companies for liquidity solutions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
                <div className="bg-ink-950 border border-white/5 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-medium text-white mb-1">Credit Lines</h4>
                  <p className="text-xs text-foreground-muted">
                    Apply for revolving credit lines up to EGP 10M with flexible terms
                  </p>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-medium text-white mb-1">Invoice Factoring</h4>
                  <p className="text-xs text-foreground-muted">
                    Sell approved invoices for immediate cash (less factoring fee)
                  </p>
                </div>
                <div className="bg-ink-950 border border-white/5 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-medium text-white mb-1">BNPL for Hotels</h4>
                  <p className="text-xs text-foreground-muted">
                    Net-60 payment terms on procurement through factoring partners
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                  Apply for Credit Line
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
