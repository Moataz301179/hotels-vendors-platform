"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, Loader2, AlertCircle, FileText,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { RequireAuth } from "@/components/AppShell";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  deliveryDate: string | null;
  hotel: { id: string; name: string };
  supplier: { id: string; name: string };
  items: { id: string; product: { id: string; name: string; sku: string } }[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_FILTERS = [
  { id: "all", label: "All Orders" },
  { id: "DRAFT", label: "Draft" },
  { id: "PENDING_APPROVAL", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  // Build query string
  const queryParams = new URLSearchParams();
  if (filter !== "all") queryParams.set("status", filter);
  if (q.trim()) queryParams.set("search", q.trim());
  queryParams.set("page", "1");
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<OrdersResponse>(
    `/api/v1/orders?${queryParams.toString()}`
  );

  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "text-gray-400 bg-gray-500/10";
      case "PENDING_APPROVAL": return "text-amber-400 bg-amber-500/10";
      case "APPROVED": return "text-blue-400 bg-blue-500/10";
      case "IN_TRANSIT": return "text-purple-400 bg-purple-500/10";
      case "DELIVERED": return "text-green-400 bg-green-500/10";
      case "REJECTED": return "text-red-400 bg-red-500/10";
      default: return "text-gray-400 bg-gray-500/10";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <RequireAuth>
      <AppShell active="/orders">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Orders</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} total orders` : "Purchase orders"}
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
              <Plus size={16} />
              New Order
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 overflow-x-auto">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    filter === f.id
                      ? "border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950"
                      : "border-line bg-white text-ink-600 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs sm:ms-auto">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <input
                type="text"
                placeholder="Search by PO # or supplier..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Content */}
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
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
              <FileText size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Orders Yet</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                Create your first purchase order to start procuring from suppliers.
                Orders will appear here with full tracking.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                <Plus size={16} />
                Create First Order
              </button>
            </div>
          ) : (
            <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Supplier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`} className="text-accent hover:underline font-medium">
                          {order.orderNumber}
                        </Link>
                        <div className="text-xs text-foreground-muted">
                          {order.items.length} items • {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-secondary">{order.supplier.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {formatMoney(order.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">
                        {formatDate(order.deliveryDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
