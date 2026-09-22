"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface GrnLineItem {
  id: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  product: { name: string; sku: string; unitOfMeasure: string };
}

interface Grn {
  id: string;
  grnNumber: string;
  status: string;
  receivedAt: string;
  warehouseLocation: string | null;
  deliveryNoteRef: string | null;
  vehiclePlate: string | null;
  notes: string | null;
  order: { orderNumber: string; total: number | null };
  hotel: { name: string };
  supplier: { name: string };
  lineItems: GrnLineItem[];
}

type StatusTab = "ALL" | "PENDING" | "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" },
  RECEIVING: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Receiving" },
  INSPECTING: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400", label: "Inspecting" },
  ACCEPTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Accepted" },
  PARTIALLY_ACCEPTED: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400", label: "Partial" },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Rejected" },
};

function GrnStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function ReceivingPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);
  const [selectedGrn, setSelectedGrn] = useState<Grn | null>(null);

  const tabs: StatusTab[] = ["ALL", "PENDING", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"];

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);

  const { data, loading: isLoading } = useApi<{ grns: Grn[]; pagination: { total: number; totalPages: number } }>(
    `/api/v1/grn?${params}`
  );

  const grns = data?.grns ?? [];
  const filtered = activeTab === "ALL" ? grns : grns.filter((g) => g.status === activeTab);
  const pagination = data?.pagination;

  const stats = {
    total: grns.length,
    pending: grns.filter((g) => g.status === "PENDING" || g.status === "RECEIVING" || g.status === "INSPECTING").length,
    accepted: grns.filter((g) => g.status === "ACCEPTED").length,
    rejected: grns.filter((g) => g.status === "REJECTED").length,
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-6 p-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-white">Goods Receipt Notes</h1>
        <p className="mt-1 text-sm text-foreground-tertiary">Track deliveries, inspect goods, and confirm receipts for your orders.</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total GRNs", value: stats.total, icon: Package, color: "text-white" },
          { label: "Pending Receipt", value: stats.pending, icon: Clock, color: "text-amber-400" },
          { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Rejected", value: stats.rejected, icon: AlertTriangle, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-tertiary">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Search + Tabs */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by GRN number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border-subtle bg-surface-2 py-2 pl-10 pr-4 text-sm text-white placeholder-foreground-muted outline-none focus:border-accent-base/50"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-2 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab
                  ? "bg-accent-base/20 text-accent-base"
                  : "text-foreground-muted hover:text-foreground-secondary"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeInUp} className="overflow-hidden rounded-xl border border-border-subtle bg-surface-2">
        {isLoading ? (
          <LoadingTable rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="package"
            title="No GRNs found"
            description="Goods receipt notes will appear here once deliveries are recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-foreground-muted">
                  <th className="px-4 py-3 font-medium">GRN #</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((grn) => {
                  const totalReceived = grn.lineItems.reduce((s, li) => s + li.receivedQuantity, 0);
                  const totalAccepted = grn.lineItems.reduce((s, li) => s + li.acceptedQuantity, 0);
                  return (
                    <tr key={grn.id} className="hover:bg-surface-2 transition">
                      <td className="px-4 py-3 font-mono text-xs text-accent-base">{grn.grnNumber}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{grn.order.orderNumber}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{grn.supplier.name}</td>
                      <td className="px-4 py-3 text-foreground-secondary">{grn.lineItems.length}</td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        <span className="text-emerald-400">{totalAccepted}</span>
                        <span className="text-foreground-muted"> / {totalReceived}</span>
                      </td>
                      <td className="px-4 py-3"><GrnStatusBadge status={grn.status} /></td>
                      <td className="px-4 py-3 text-foreground-tertiary">{new Date(grn.receivedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedGrn(grn)} className="text-foreground-muted hover:text-accent-base transition">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-foreground-tertiary hover:bg-surface-2 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-xs text-foreground-muted">Page {page} of {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-foreground-tertiary hover:bg-surface-2 disabled:opacity-30"
          >
            Next
          </button>
        </motion.div>
      )}

      {/* Detail Panel */}
      {selectedGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedGrn(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedGrn.grnNumber}</h2>
              <button onClick={() => setSelectedGrn(null)} className="text-foreground-muted hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-foreground-muted">Order:</span> <span className="text-white">{selectedGrn.order.orderNumber}</span></div>
              <div><span className="text-foreground-muted">Supplier:</span> <span className="text-white">{selectedGrn.supplier.name}</span></div>
              <div><span className="text-foreground-muted">Status:</span> <GrnStatusBadge status={selectedGrn.status} /></div>
              <div><span className="text-foreground-muted">Received:</span> <span className="text-white">{new Date(selectedGrn.receivedAt).toLocaleString()}</span></div>
              {selectedGrn.warehouseLocation && <div><span className="text-foreground-muted">Location:</span> <span className="text-white">{selectedGrn.warehouseLocation}</span></div>}
              {selectedGrn.deliveryNoteRef && <div><span className="text-foreground-muted">Delivery Note:</span> <span className="text-white">{selectedGrn.deliveryNoteRef}</span></div>}
              {selectedGrn.vehiclePlate && <div><span className="text-foreground-muted">Vehicle:</span> <span className="text-white">{selectedGrn.vehiclePlate}</span></div>}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground-secondary">Line Items</h3>
              <div className="rounded-lg border border-border-subtle overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-foreground-muted">
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-right font-medium">Ordered</th>
                      <th className="px-3 py-2 text-right font-medium">Received</th>
                      <th className="px-3 py-2 text-right font-medium">Accepted</th>
                      <th className="px-3 py-2 text-right font-medium">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedGrn.lineItems.map((li) => (
                      <tr key={li.id} className="hover:bg-surface-2">
                        <td className="px-3 py-2 text-foreground-secondary">
                          {li.product.name}
                          <span className="ml-1 text-foreground-muted">({li.product.sku})</span>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground-tertiary">{li.orderedQuantity}</td>
                        <td className="px-3 py-2 text-right text-foreground-secondary">{li.receivedQuantity}</td>
                        <td className="px-3 py-2 text-right text-emerald-400">{li.acceptedQuantity}</td>
                        <td className="px-3 py-2 text-right text-red-400">{li.rejectedQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedGrn.notes && (
              <div className="text-sm"><span className="text-foreground-muted">Notes:</span> <span className="text-foreground-secondary">{selectedGrn.notes}</span></div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
