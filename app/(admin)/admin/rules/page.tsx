"use client";

import { useState, useEffect } from "react";
import { Scale, Loader2, AlertCircle, Plus } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface AuthorityRule {
  id: string;
  name: string;
  role: string;
  minValue: number;
  maxValue: number | null;
  action: string;
  priority: number;
  slaHours: number | null;
  approvers: string[];
}

interface RulesResponse {
  rules: AuthorityRule[];
}

export default function RulesPage() {
  const { data, loading, error } = useApi<RulesResponse>("/api/v1/authority/rules");

  const rules = data?.rules || [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <RequireAuth>
      <AppShell active="/admin/rules">
        <Guard roles={["platform_admin"]}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Authority Rules</h1>
                <p className="text-sm text-foreground-muted">
                  {rules.length} approval rules configured
                </p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                <Plus size={16} />
                Add Rule
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-accent animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-foreground-muted text-sm">{error}</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <Scale size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Rules Configured</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                  Authority Matrix rules define approval workflows based on order value thresholds.
                  Configure rules to automate purchase order approvals.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                  <Plus size={16} />
                  Create First Rule
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-surface-1 border border-border-subtle rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Scale size={20} className="text-foreground-muted" />
                        <div>
                          <div className="text-white font-medium">{rule.name}</div>
                          <div className="text-xs text-foreground-muted">{rule.role} • Priority {rule.priority}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rule.action === "AUTO_APPROVE"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {rule.action.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">Min Value</div>
                        <div className="text-white font-medium">{formatMoney(rule.minValue)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">Max Value</div>
                        <div className="text-white font-medium">{rule.maxValue ? formatMoney(rule.maxValue) : "∞"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground-muted mb-1">SLA</div>
                        <div className="text-white font-medium">{rule.slaHours ? `${rule.slaHours}h` : "—"}</div>
                      </div>
                    </div>

                    {rule.approvers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <div className="text-xs text-foreground-muted mb-2">Approvers</div>
                        <div className="flex flex-wrap gap-2">
                          {rule.approvers.map((role) => (
                            <span key={role} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
