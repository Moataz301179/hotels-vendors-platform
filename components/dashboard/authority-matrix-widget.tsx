"use client";

import { Shield, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface ApprovalTier {
  tier: number;
  label: string;
  limitAmount: number;
  approver: string;
  status: "pending" | "approved" | "awaiting";
}

interface AuthorityMatrixWidgetProps {
  tiers: ApprovalTier[];
  currentAmount?: number;
}

export function AuthorityMatrixWidget({ tiers, currentAmount }: AuthorityMatrixWidgetProps) {
  return (
    <div className="rounded-2xl border bg-surface-1 p-5" style={{ borderColor: "var(--accent-base)22" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-base)15", border: "1px solid var(--accent-base)40" }}>
            <Shield size={14} style={{ color: "var(--accent-base)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Authority Matrix</h3>
            <p className="text-[11px] text-foreground-muted">Multi-tier approval workflow</p>
          </div>
        </div>
        {currentAmount && (
          <span className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--accent-base)10", color: "var(--accent-base)" }}>
            EGP {currentAmount.toLocaleString()}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {tiers.map((tier, i) => {
          const isActive = currentAmount ? currentAmount <= tier.limitAmount : i === 0;
          const isLastActive = currentAmount
            ? (i > 0 && currentAmount > tiers[i - 1].limitAmount && currentAmount <= tier.limitAmount)
            : false;

          return (
            <div
              key={tier.tier}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                isLastActive ? "border-accent-base/40 bg-accent-base/5" : "border-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isLastActive ? "var(--accent-base)" : "transparent",
                    border: isLastActive ? "none" : "1px solid var(--accent-base)44",
                    color: isLastActive ? "#fff" : "var(--accent-base)",
                  }}
                >
                  {tier.tier}
                </div>
                <div>
                  <div className="text-[12px] font-medium text-white">{tier.label}</div>
                  <div className="text-[10px] text-foreground-muted">
                    &lt; EGP {tier.limitAmount.toLocaleString()} · {tier.approver}
                  </div>
                </div>
              </div>

              <div>
                {tier.status === "approved" && (
                  <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
                )}
                {tier.status === "pending" && (
                  <Clock size={14} className="text-foreground-muted animate-pulse" />
                )}
                {tier.status === "awaiting" && (
                  <AlertTriangle size={14} style={{ color: "var(--orange-base)" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}