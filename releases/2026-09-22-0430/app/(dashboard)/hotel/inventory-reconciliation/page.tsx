"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Package, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingCard } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface ReconciliationLineItem {
  id: string;
  productName: string;
  sku: string;
  beginningQuantity: number;
  endingQuantity: number;
  receivedQuantity: number;
  consumedQuantity: number;
  wasteQuantity: number;
  varianceQuantity: number;
  varianceReason: string | null;
  unitCost: number;
  totalValue: number;
}

interface Reconciliation {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  lineItems: ReconciliationLineItem[];
}

interface ReconciliationData {
  reconciliations: Reconciliation[];
  stats: {
    totalPeriods: number;
    approvedPeriods: number;
    pendingPeriods: number;
    totalVarianceValue: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-white/5 text-white/60 border-white/10",
    SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    ADJUSTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] ?? "bg-white/5 text-white/60 border-white/10"}`}>
      {status}
    </span>
  );
}

function VarianceBar({ quantity, max }: { quantity: number; max: number }) {
  const width = max > 0 ? Math.min((Math.abs(quantity) / max) * 100, 100) : 0;
  return (
    <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${quantity >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function InventoryReconciliationPage() {
  const { data, loading, error } = useApi<ReconciliationData>("/api/v1/hotel/inventory/reconciliations");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!data?.reconciliations) return null;
    return data.reconciliations.find((r) => r.id === selectedId) ?? data.reconciliations[0] ?? null;
  }, [data, selectedId]);

  const totalVariance = useMemo(() => {
    if (!selected?.lineItems) return 0;
    return selected.lineItems.reduce((sum, item) => sum + Math.abs(item.varianceQuantity), 0);
  }, [selected]);

  const totalWaste = useMemo(() => {
    if (!selected?.lineItems) return 0;
    return selected.lineItems.reduce((sum, item) => sum + item.wasteQuantity, 0);
  }, [selected]);

  const totalValue = useMemo(() => {
    if (!selected?.lineItems) return 0;
    return selected.lineItems.reduce((sum, item) => sum + (item.totalValue ?? 0), 0);
  }, [selected]);

  const maxVariance = useMemo(() => {
    if (!selected?.lineItems) return 1;
    return Math.max(...selected.lineItems.map((i) => Math.abs(i.varianceQuantity)), 1);
  }, [selected]);

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <EmptyState title="Error loading reconciliation data" description={error} />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold tracking-tight text-white">Inventory Reconciliation</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Beginning/ending inventory, variance tracking, and waste analysis</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : [
              { label: "Total Periods", value: data?.stats?.totalPeriods ?? 0, icon: ClipboardList, color: "text-indigo-400" },
              { label: "Approved", value: data?.stats?.approvedPeriods ?? 0, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Pending Review", value: data?.stats?.pendingPeriods ?? 0, icon: Clock, color: "text-amber-400" },
              { label: "Total Variance Value", value: `EGP ${(data?.stats?.totalVarianceValue ?? 0).toLocaleString()}`, icon: AlertTriangle, color: "text-red-400" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-xl border border-border-subtle bg-surface-1 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <s.icon size={15} className={s.color} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </motion.div>
            ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Period Selector */}
        <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-4">
          <h3 className="text-xs font-semibold text-white mb-3">Reconciliation Periods</h3>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <LoadingCard key={i} />)}</div>
          ) : !data?.reconciliations?.length ? (
            <EmptyState title="No periods" description="No reconciliation periods found" />
          ) : (
            <div className="space-y-2">
              {data.reconciliations.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected?.id === r.id
                      ? "border-indigo-500/30 bg-indigo-500/10"
                      : "border-border-subtle bg-surface-2 hover:bg-surface-3"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{r.period}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-[10px] text-foreground-muted mt-1">
                    {r.lineItems?.length ?? 0} items
                  </p>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <motion.div variants={fadeInUp} className="lg:col-span-3 rounded-xl border border-border-subtle bg-surface-1 p-5">
          {loading ? (
            <div className="space-y-4">
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : !selected ? (
            <EmptyState title="Select a period" description="Choose a reconciliation period to view details" />
          ) : (
            <>
              {/* Period Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selected.period}</h3>
                  <p className="text-xs text-foreground-muted">
                    {new Date(selected.periodStart).toLocaleDateString()} — {new Date(selected.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status === "DRAFT" && (
                    <button className="px-3 py-1.5 text-xs bg-[#314B43] hover:bg-[#3a544a] text-white rounded-lg font-medium transition-colors">
                      Submit for Review
                    </button>
                  )}
                  {selected.status === "SUBMITTED" && (
                    <>
                      <button className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="text-[10px] text-foreground-muted uppercase">Total Variance</p>
                  <p className={`text-lg font-bold mt-1 ${totalVariance > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {totalVariance} units
                  </p>
                </div>
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="text-[10px] text-foreground-muted uppercase">Waste/Damage</p>
                  <p className="text-lg font-bold mt-1 text-amber-400">{totalWaste} units</p>
                </div>
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="text-[10px] text-foreground-muted uppercase">Total Value</p>
                  <p className="text-lg font-bold mt-1 text-white">EGP {totalValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 px-3 text-foreground-muted font-medium">Product</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Beginning</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Received</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Consumed</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Ending</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Variance</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Waste</th>
                      <th className="text-right py-2 px-3 text-foreground-muted font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-border-invisible hover:bg-surface-2 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Package size={12} className="text-foreground-muted" />
                            <div>
                              <p className="text-white font-medium">{item.productName}</p>
                              <p className="text-[10px] text-foreground-muted">{item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-white text-right">{item.beginningQuantity}</td>
                        <td className="py-2.5 px-3 text-emerald-400 text-right">+{item.receivedQuantity}</td>
                        <td className="py-2.5 px-3 text-amber-400 text-right">-{item.consumedQuantity}</td>
                        <td className="py-2.5 px-3 text-white text-right font-medium">{item.endingQuantity}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <VarianceBar quantity={item.varianceQuantity} max={maxVariance} />
                            <span className={item.varianceQuantity > 0 ? "text-emerald-400" : item.varianceQuantity < 0 ? "text-red-400" : "text-white"}>
                              {item.varianceQuantity > 0 ? "+" : ""}{item.varianceQuantity}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.wasteQuantity > 0 ? (
                            <span className="text-red-400">{item.wasteQuantity}</span>
                          ) : (
                            <span className="text-foreground-muted">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-white text-right">EGP {(item.totalValue ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Variance Reasons */}
              {selected.lineItems.some((i) => i.varianceReason) && (
                <div className="mt-5 pt-4 border-t border-border-subtle">
                  <h4 className="text-xs font-semibold text-white mb-3">Variance Reasons</h4>
                  <div className="space-y-2">
                    {selected.lineItems
                      .filter((i) => i.varianceReason)
                      .map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-xs">
                          <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-white font-medium">{item.productName}:</span>
                            <span className="text-foreground-muted ml-1">{item.varianceReason}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
