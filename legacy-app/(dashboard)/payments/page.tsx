"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Wallet,
  ArrowUpRight, ArrowDownRight, Search, Download, TrendingUp,
} from "lucide-react";
import { OlivReferralCTA } from "@/components/partners/oliv-referral-cta";
import { useApi } from "@/lib/hooks/use-api";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  hotel: { name: string } | null;
  supplier: { name: string } | null;
}

interface PaymentSummary {
  totalProcessed: number;
  pending: number;
  completed: number;
  failed: number;
  transactionCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Completed" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" },
    FAILED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Failed" },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const METHOD_COLORS: Record<string, string> = {
  factoring: "bg-accent-base/10 text-accent-base",
  credit: "bg-amber-500/10 text-amber-400",
  bank_transfer: "bg-blue-500/10 text-blue-400",
  oliv: "bg-purple-500/10 text-purple-400",
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: paymentsData, loading } = useApi<{ transactions: Transaction[]; summary: PaymentSummary }>(
    "/api/v1/payments?page=1&limit=50"
  );

  const transactions = paymentsData?.transactions ?? [];
  const summary = paymentsData?.summary ?? { totalProcessed: 0, pending: 0, completed: 0, failed: 0, transactionCount: 0 };

  const filteredTxns = transactions.filter(
    (t) =>
      (filterStatus === "all" || t.status === filterStatus) &&
      (!searchQuery ||
        t.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = [
    { label: "Total Processed", value: `EGP ${(summary.totalProcessed / 1000).toFixed(1)}K`, change: `${summary.transactionCount} transactions`, up: true, icon: Wallet },
    { label: "Pending", value: `EGP ${(summary.pending / 1000).toFixed(1)}K`, change: "Awaiting settlement", up: true, icon: Clock },
    { label: "Completed", value: `EGP ${(summary.completed / 1000).toFixed(1)}K`, change: summary.completed > 0 ? `${Math.round((summary.completed / summary.totalProcessed) * 100)}% success` : "No data", up: true, icon: CheckCircle2 },
    { label: "Failed", value: `EGP ${(summary.failed / 1000).toFixed(1)}K`, change: summary.failed > 0 ? "Requires attention" : "No failures", up: summary.failed === 0, icon: AlertTriangle },
  ];

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payments & Transactions</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Monitor payment flows, factoring settlements, and transaction history</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-xs text-foreground-secondary transition-all">
          <Download size={14} />
          Export Report
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={fadeInUp}
            className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <s.icon size={15} className="text-foreground-muted" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {s.up ? <ArrowUpRight size={12} className="text-emerald-400" /> : <ArrowDownRight size={12} className="text-red-400" />}
              <span className={`text-[11px] font-medium ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.change}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Oliv Referral Banner */}
      <motion.div variants={fadeInUp}>
        <OlivReferralCTA variant="banner" />
      </motion.div>

      {/* Search + Table */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent-base/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-xs text-foreground-secondary focus:outline-none"
          >
            <option value="all" className="bg-surface-2">All Status</option>
            <option value="COMPLETED" className="bg-surface-2">Completed</option>
            <option value="PENDING" className="bg-surface-2">Pending</option>
            <option value="FAILED" className="bg-surface-2">Failed</option>
          </select>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto table-scroll-wrapper">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-base rounded-full animate-spin mx-auto" />
              <p className="text-xs text-foreground-muted mt-3">Loading transactions...</p>
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard size={32} className="text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-muted">
                {searchQuery || filterStatus !== "all" ? "No matching transactions." : "No transactions yet."}
              </p>
              <p className="text-xs text-foreground-muted mt-1">Transactions will appear here once payments are processed.</p>
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border-subtle">
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Transaction ID</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Hotel</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Supplier</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Amount</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Method</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t) => (
                  <tr key={t.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-foreground-secondary">{t.id.slice(0, 12)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white">{t.hotel?.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-foreground-muted">{t.supplier?.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-white">EGP {t.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${METHOD_COLORS[t.method] || "bg-surface-2 text-foreground-muted"}`}>
                        {t.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-foreground-muted">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
