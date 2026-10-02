"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Eye,
  Download,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { InvoiceDetailPanel } from "@/components/shared/invoice-detail-panel";

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
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  issueDate: string;
  dueDate: string | null;
  hotel: { name: string } | null;
  supplier: { name: string } | null;
}

type StatusTab = "ALL" | "PENDING" | "PAID" | "OVERDUE";

function InvoiceStatusBadge({ paymentStatus, dueDate }: { paymentStatus: string; dueDate: string | null }) {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const isOverdue = due && due < now && paymentStatus !== "PAID";

  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Paid" },
    UNPAID: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" },
    PARTIAL: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Partial" },
    REFUNDED: { bg: "bg-surface-2", text: "text-foreground-muted", dot: "bg-surface-3", label: "Refunded" },
  };

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Overdue
      </span>
    );
  }

  const c = config[paymentStatus] || config.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

export default function HotelInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoicesData, loading, error } = useApi<Invoice[]>("/api/v1/invoices?page=1&limit=50&sortOrder=desc");

  const invoices = invoicesData ?? [];

  const filtered = useMemo(() => {
    let list = [...invoices];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.hotel?.name?.toLowerCase().includes(q) ||
          inv.supplier?.name?.toLowerCase().includes(q)
      );
    }

    const now = new Date();

    if (activeTab === "PAID") {
      list = list.filter((inv) => inv.paymentStatus === "PAID");
    } else if (activeTab === "PENDING") {
      list = list.filter((inv) => inv.paymentStatus === "UNPAID" && (!inv.dueDate || new Date(inv.dueDate) >= now));
    } else if (activeTab === "OVERDUE") {
      list = list.filter((inv) => {
        const due = inv.dueDate ? new Date(inv.dueDate) : null;
        return inv.paymentStatus !== "PAID" && due && due < now;
      });
    }

    return list;
  }, [invoices, searchQuery, activeTab]);

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "PAID", label: "Paid" },
    { key: "OVERDUE", label: "Overdue" },
  ];

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoice Management</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Track and manage all invoices across your properties</p>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-accent-base text-white"
                  : "text-foreground-muted hover:text-foreground-secondary hover:bg-surface-1"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-lg bg-surface-1 border border-border-subtle text-xs text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent-base/50 w-64"
          />
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <LoadingTable rows={5} />
      ) : error ? (
        <EmptyState title="Error loading invoices" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description={searchQuery || activeTab !== "ALL" ? "Try adjusting your filters." : "Invoices will appear here once created."}
        />
      ) : (
        <motion.div variants={fadeInUp} className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto table-scroll-wrapper">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Hotel</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Supplier</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Issue Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Due Date</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-foreground-muted" />
                      <span className="text-xs font-mono text-foreground-secondary">{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white">{invoice.hotel?.name || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-secondary">{invoice.supplier?.name || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-white">{formatCurrency(invoice.total, invoice.currency)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge paymentStatus={invoice.paymentStatus} dueDate={invoice.dueDate} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-foreground-muted">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-foreground-muted">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors"
                        aria-label={`View invoice ${invoice.invoiceNumber}`}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors"
                        aria-label="Download invoice"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <InvoiceDetailPanel
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onViewFull={(inv) => window.open(`/invoices/${inv.id}`, "_self")}
      />
    </motion.div>
  );
}
