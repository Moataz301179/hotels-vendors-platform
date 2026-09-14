"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, FilePlus2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   NEEDS-ACTION ORDERS — hotel buyer / procurement
   Real rows only. Approve button POSTs to the live order-approval
   endpoint and refreshes server data (no fabricated rows).
   ═══════════════════════════════════════════════════════════════════ */

export interface NeedsActionOrder {
  id: string;
  orderNumber: string;
  supplierName: string | null;
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_TONE: Record<string, string> = {
  DELIVERED: "bg-success/10 text-success border-success/30",
  PARTIALLY_DELIVERED: "bg-info/10 text-info border-info/30",
  IN_TRANSIT: "bg-info/10 text-info border-info/30",
  APPROVED: "bg-warning/10 text-warning border-warning/30",
  CONFIRMED: "bg-warning/10 text-warning border-warning/30",
  PENDING_APPROVAL: "bg-warning/10 text-warning border-warning/30",
  DRAFT: "bg-white/[0.04] text-foreground-muted border-border-default",
  REJECTED: "bg-error/10 text-error border-error/30",
  CANCELLED: "bg-error/10 text-error border-error/30",
  DISPUTED: "bg-error/10 text-error border-error/30",
};

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

export default function NeedsActionOrders({ orders }: { orders: NeedsActionOrder[] }) {
  const router = useRouter();
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setApproving(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Approval failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve order.");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="rounded-md border border-border-default bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Needs Your Action</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {orders.length} order{orders.length === 1 ? "" : "s"} awaiting your review · real rows
          </p>
        </div>
        <FilePlus2 size={16} className="text-accent-base" />
      </div>

      {error && (
        <div className="px-4 py-2.5 border-b border-error/30 bg-error/10 text-error text-xs">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <ShieldCheck size={22} className="text-accent-base mb-2" />
          <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
          <p className="text-xs text-foreground-muted mt-1">
            No purchase orders are waiting on your approval right now.
          </p>
        </div>
      ) : (
        <div className="table-scroll-wrapper">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-raised">
                <th className="px-4 py-2.5 text-left font-medium text-foreground-secondary uppercase tracking-[0.05em]">Order</th>
                <th className="px-4 py-2.5 text-left font-medium text-foreground-secondary uppercase tracking-[0.05em]">Supplier</th>
                <th className="px-4 py-2.5 text-right font-medium text-foreground-secondary uppercase tracking-[0.05em]">Total</th>
                <th className="px-4 py-2.5 text-left font-medium text-foreground-secondary uppercase tracking-[0.05em]">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-foreground-secondary uppercase tracking-[0.05em]">Approve</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const canApprove = o.status === "PENDING_APPROVAL";
                return (
                  <tr key={o.id} className="border-b border-border-default data-table-row">
                    <td className="px-4 py-3 font-mono text-xs text-accent-base font-medium">
                      {o.orderNumber || o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-foreground">{o.supplierName || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground metric-value">
                      {o.total > 0 ? egp(o.total) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-pill ${STATUS_TONE[o.status] || STATUS_TONE.DRAFT}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canApprove ? (
                        <button
                          onClick={() => approve(o.id)}
                          disabled={approving === o.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-base text-surface text-xs font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approving === o.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          {approving === o.id ? "Approving…" : "Approve"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-foreground-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
