"use client";

import {
  FileText,
  Calendar,
  Building2,
  Truck,
  ExternalLink,
  Download,
} from "lucide-react";
import { SlideOver } from "./slide-over";

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
  etaStatus?: string | null;
}

interface InvoiceDetailPanelProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFull?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
}

const paymentConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Paid" },
  UNPAID: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Unpaid" },
  PARTIAL: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Partial" },
  REFUNDED: { bg: "bg-white/10", text: "text-foreground-muted", dot: "bg-white/40", label: "Refunded" },
};

const etaConfig: Record<string, { bg: string; text: string; label: string }> = {
  ACCEPTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "ETA Accepted" },
  VALIDATED: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "ETA Validated" },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", label: "ETA Pending" },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", label: "ETA Rejected" },
};

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

function PaymentBadge({ paymentStatus, dueDate }: { paymentStatus: string; dueDate: string | null }) {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const isOverdue = due && due < now && paymentStatus !== "PAID";

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Overdue
      </span>
    );
  }

  const c = paymentConfig[paymentStatus] || paymentConfig.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function EtaBadge({ etaStatus }: { etaStatus?: string | null }) {
  if (!etaStatus) return null;
  const c = etaConfig[etaStatus] || { bg: "bg-white/10", text: "text-foreground-muted", label: etaStatus };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function InvoiceDetailPanel({
  invoice,
  isOpen,
  onClose,
  onViewFull,
  onDownload,
}: InvoiceDetailPanelProps) {
  if (!invoice) return null;

  const now = new Date();
  const due = invoice.dueDate ? new Date(invoice.dueDate) : null;
  const isOverdue = due && due < now && invoice.paymentStatus !== "PAID";

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice ${invoice.invoiceNumber}`}
      description={`${invoice.hotel?.name ?? "—"} ← ${invoice.supplier?.name ?? "—"}`}
    >
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Payment Status</p>
            <div className="mt-1.5">
              <PaymentBadge paymentStatus={invoice.paymentStatus} dueDate={invoice.dueDate} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Amount</p>
            <p className="text-sm font-semibold text-white mt-1">{formatCurrency(invoice.total, invoice.currency)}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-0 rounded-lg border border-border-invisible divide-y divide-white/[0.04]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <FileText size={13} className="text-foreground-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground-muted uppercase">Invoice #</p>
              <p className="text-xs text-foreground-secondary font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Building2 size={13} className="text-foreground-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground-muted uppercase">Hotel</p>
              <p className="text-xs text-foreground-secondary truncate">{invoice.hotel?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Truck size={13} className="text-foreground-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground-muted uppercase">Supplier</p>
              <p className="text-xs text-foreground-secondary truncate">{invoice.supplier?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Calendar size={13} className="text-foreground-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground-muted uppercase">Issue Date</p>
              <p className="text-xs text-foreground-secondary">{new Date(invoice.issueDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Calendar size={13} className={`${isOverdue ? "text-red-400" : "text-foreground-muted"} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-foreground-muted uppercase">Due Date</p>
              <p className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-foreground-secondary"}`}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                {isOverdue && " (Overdue)"}
              </p>
            </div>
          </div>
        </div>

        {/* ETA Status */}
        {invoice.etaStatus && (
          <div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-2">ETA E-Invoice Status</p>
            <EtaBadge etaStatus={invoice.etaStatus} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border-invisible">
          {onDownload && (
            <button
              onClick={() => onDownload(invoice)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-border-subtle text-foreground-secondary text-xs font-medium hover:text-white hover:bg-surface-2 transition-colors"
            >
              <Download size={13} />
              Download
            </button>
          )}
          {onViewFull && (
            <button
              onClick={() => onViewFull(invoice)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-border-subtle text-foreground-secondary text-xs font-medium hover:text-white hover:bg-surface-2 transition-colors"
            >
              <ExternalLink size={13} />
              View Full Invoice
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
