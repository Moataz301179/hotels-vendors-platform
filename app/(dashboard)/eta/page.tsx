"use client";

import { motion } from "framer-motion";
import {
  FileCheck, Send, Clock, CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  etaUuid: string | null;
  etaStatus: string | null;
  issuedAt: string;
  amount: number;
  hotel: { name: string } | null;
  supplier: { name: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACCEPTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "DEMO: Accepted" },
    VALIDATED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "DEMO: Validated" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "DEMO: Pending" },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "DEMO: Rejected" },
    SUBMITTED: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "DEMO: Submitted" },
    DRAFT: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-foreground-muted", label: "DEMO: Draft" },
  };
  const c = config[status] || config.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function EtaCenterPage() {
  const { data: invoicesData, loading, refetch } = useApi<{ invoices: Invoice[]; pagination: { total: number } }>(
    "/api/v1/invoices?page=1&limit=50"
  );

  const invoices = invoicesData?.invoices ?? [];
  const metrics = {
    total: invoices.length,
    submitted: invoices.filter((i) => i.etaStatus === "SUBMITTED" || i.etaStatus === "ACCEPTED").length,
    accepted: invoices.filter((i) => i.etaStatus === "ACCEPTED" || i.etaStatus === "VALIDATED").length,
    rejected: invoices.filter((i) => i.etaStatus === "REJECTED").length,
  };

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* DEMO MODE WARNING — This is a simulated ETA integration, NOT connected to the Egyptian Tax Authority */}
      <motion.div variants={fadeInUp} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400">DEMO MODE — This is a simulated ETA integration. Not connected to the Egyptian Tax Authority.</p>
            <p className="text-xs text-amber-400/60 mt-0.5">All ETA UUIDs, statuses, and submission responses are fake. Do not treat as real tax compliance.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ETA E-Invoicing Center</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Egyptian Tax Authority compliance — submit, validate, and track invoices</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-xs text-foreground-secondary transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </motion.div>

      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Invoices", value: metrics.total.toString(), icon: FileCheck },
          { label: "Submitted to ETA", value: metrics.submitted.toString(), icon: Send },
          { label: "ETA Accepted", value: metrics.accepted.toString(), icon: CheckCircle2 },
          { label: "ETA Rejected", value: metrics.rejected.toString(), icon: AlertTriangle },
        ].map((m) => (
          <motion.div key={m.label} variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{m.label}</span>
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <m.icon size={15} className="text-foreground-muted" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{m.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto table-scroll-wrapper">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-base rounded-full animate-spin mx-auto" />
            <p className="text-xs text-foreground-muted mt-3">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileCheck size={32} className="text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">No invoices yet.</p>
            <p className="text-xs text-foreground-muted mt-1">Invoices will appear here once orders are placed.</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Hotel</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Supplier</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">ETA Status <span className="text-amber-400/60">(DEMO)</span></th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">ETA UUID <span className="text-amber-400/60">(DEMO)</span></th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-foreground-secondary">{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white">{inv.hotel?.name || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-foreground-muted">{inv.supplier?.name || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-white">EGP {inv.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.etaStatus || "DRAFT"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-foreground-muted">
                      {inv.etaUuid ? `${inv.etaUuid.slice(0, 8)}...` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-foreground-muted">
                      {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
