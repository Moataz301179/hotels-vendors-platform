"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock, Play, Pause, Plus, Package, Clock, ArrowRight, Settings, Trash2,
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

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BI_WEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  CUSTOM: "Custom",
};

interface ScheduledOrder {
  id: string;
  name: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  status: string;
  autoSubmit: boolean;
  maxOrderValue: number | null;
  supplierName: string;
  itemCount: number;
  totalEstimate: number;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
}

interface ScheduledOrdersData {
  orders: ScheduledOrder[];
  stats: {
    total: number;
    active: number;
    paused: number;
    totalMonthlyEstimate: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] ?? "bg-white/5 text-white/60 border-white/10"}`}>
      {status}
    </span>
  );
}

export default function ScheduledOrdersPage() {
  const { data, loading, error, refetch } = useApi<ScheduledOrdersData>("/api/v1/hotel/scheduled-orders");
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "PAUSED">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    if (filter === "all") return data.orders;
    return data.orders.filter((o) => o.status === filter);
  }, [data, filter]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await fetch(`/api/v1/hotel/scheduled-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      refetch();
    } catch {}
  };

  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto">
        <EmptyState title="Error loading scheduled orders" description={error} />
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
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Scheduled Orders</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Manage recurring procurement orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#314B43] hover:bg-[#3a544a] text-white text-sm rounded-lg font-medium transition-colors">
          <Plus size={14} />
          New Schedule
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : [
              { label: "Total Schedules", value: data?.stats?.total ?? 0, icon: CalendarClock, color: "text-indigo-400" },
              { label: "Active", value: data?.stats?.active ?? 0, icon: Play, color: "text-emerald-400" },
              { label: "Paused", value: data?.stats?.paused ?? 0, icon: Pause, color: "text-amber-400" },
              { label: "Monthly Estimate", value: `EGP ${(data?.stats?.totalMonthlyEstimate ?? 0).toLocaleString()}`, icon: Package, color: "text-cyan-400" },
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

      {/* Filter */}
      <motion.div variants={fadeInUp} className="flex gap-2">
        {(["all", "ACTIVE", "PAUSED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === f ? "bg-[#314B43] text-white" : "bg-surface-2 text-foreground-muted hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </motion.div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-12">
          <EmptyState
            title="No scheduled orders"
            description="Set up recurring orders for regular supplies like cleaning products, amenities, or F&B items"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              variants={fadeInUp}
              className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{order.name}</h3>
                      <StatusBadge status={order.status} />
                      {order.autoSubmit && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          Auto-Submit
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">{order.supplierName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center transition-colors"
                    >
                      <Settings size={14} className="text-foreground-muted" />
                    </button>
                    <button
                      onClick={() => toggleStatus(order.id, order.status)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        order.status === "ACTIVE"
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 hover:bg-amber-500/20"
                      }`}
                    >
                      {order.status === "ACTIVE" ? (
                        <Pause size={14} className="text-emerald-400" />
                      ) : (
                        <Play size={14} className="text-amber-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3 text-xs text-foreground-muted">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{FREQUENCY_LABELS[order.frequency] ?? order.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package size={12} />
                    <span>{order.itemCount} items</span>
                  </div>
                  <div>
                    Next: <span className="text-white">{new Date(order.nextRunAt).toLocaleDateString()}</span>
                  </div>
                  {order.lastRunAt && (
                    <div>
                      Last: <span className="text-white">{new Date(order.lastRunAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="ml-auto text-white font-medium">
                    EGP {order.totalEstimate.toLocaleString()}
                  </div>
                  {order.maxOrderValue && (
                    <div className="text-foreground-muted">
                      Cap: EGP {order.maxOrderValue.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Items */}
              {expandedId === order.id && order.items?.length > 0 && (
                <div className="border-t border-border-subtle bg-surface-2 p-4">
                  <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider mb-3">Scheduled Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white">{item.productName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-foreground-muted">Qty: {item.quantity}</span>
                          {item.unitPrice && (
                            <span className="text-foreground-muted">EGP {item.unitPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
