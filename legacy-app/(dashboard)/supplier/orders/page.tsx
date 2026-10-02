"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Package, Loader2, AlertCircle } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  hotel: { id: string; name: string; city: string };
  items: { id: string; product: { id: string; name: string } }[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: { page: number; limit: number; total: number };
}

export default function SupplierOrdersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  if (filter !== "all") queryParams.set("status", filter);
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<OrdersResponse>(
    `/api/v1/orders?${queryParams.toString()}`
  );

  const orders = data?.orders || [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "EGP", maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  return (
    <RequireAuth>
      <AppShell active="/supplier/orders">
        <Guard roles={["supplier_manager"]}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Orders</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} orders` : "Orders from hotels"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by order #..."
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
                <option value="PENDING_APPROVAL">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
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
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <Package size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">No Orders Yet</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto">
                  When hotels place orders, they'll appear here with status tracking.
                  Update order status as you fulfill them.
                </p>
              </div>
            ) : (
              <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Order</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Hotel</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Date</th>
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
                            {order.items.length} items
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-secondary">{order.hotel.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === "DELIVERED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            order.status === "PENDING_APPROVAL" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">{formatMoney(order.total)}</td>
                        <td className="px-4 py-3 text-sm text-foreground-muted">{formatDate(order.createdAt)}</td>
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
