"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, FileText, Loader2, AlertCircle, Check, X,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string | null;
  issueDate: string;
  hotel: { id: string; name: string };
  supplier: { id: string; name: string };
  order: { id: string; orderNumber: string };
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number };
}

export default function InvoicesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  if (filter !== "all") queryParams.set("status", filter);
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<InvoicesResponse>(
    `/api/v1/invoices?${queryParams.toString()}`
  );

  const invoices = data?.invoices || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "text-gray-400 bg-gray-500/10";
      case "SUBMITTED": return "text-amber-400 bg-amber-500/10";
      case "APPROVED": return "text-green-400 bg-green-500/10";
      case "PAID": return "text-blue-400 bg-blue-500/10";
      case "REJECTED": return "text-red-400 bg-red-500/10";
      default: return "text-gray-400 bg-gray-500/10";
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <RequireAuth>
      <AppShell active="/invoices">
        <Guard roles={["hotel_admin", "gm", "finance_director", "supplier_manager", "platform_admin"]}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Invoices</h1>
                <p className="text-sm text-foreground-muted">
                  {data?.pagination ? `${data.pagination.total} total invoices` : "Invoice management"}
                </p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                <Plus size={16} />
                New Invoice
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by invoice #..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white focus:outline-none focus:border-accent"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-accent animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-foreground-muted text-sm">{error}</p>
                <button onClick={refetch} className="text-accent text-sm mt-2 hover:underline">Retry</button>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <FileText size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Invoices Yet</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  Invoices are created from delivered orders. When suppliers submit invoices,
                  they will appear here for review and approval.
                </p>
              </div>
            ) : (
              <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Invoice</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Order</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Party</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Due</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">{invoice.order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">{invoice.supplier.name}</td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">{formatDate(invoice.dueDate)}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">{formatMoney(invoice.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
