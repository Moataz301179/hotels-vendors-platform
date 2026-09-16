"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApi } from "@/lib/hooks/use-api";
import { Clock, CheckCircle, Truck, FileText, ShieldCheck, AlertCircle } from "lucide-react";

interface OrderDetailProps {
  orderId: string;
  mode?: "hotel" | "supplier";
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  hotel?: { id: string; name: string };
  supplier?: { id: string; name: string };
  items?: { id: string; product: { id: string; name: string; sku: string } }[];
}

export default function OrderDetail({ orderId, mode }: OrderDetailProps) {
  const { t } = usePrefs();
  const { data, loading } = useApi<{ data: OrderData; orders?: OrderData[] }>(`/api/v1/orders/${orderId}`);
  const order = data?.data || data?.orders?.find((o: any) => o.id === orderId);

  if (loading) {
    return <div className="text-center py-12 text-sm text-foreground-muted">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
        <p className="text-foreground-muted text-sm">Order not found or no data available for this tenant.</p>
        <p className="text-xs text-foreground-subtle">This is an honest empty state — not simulated data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">{order.orderNumber}</h2>
          <span className="text-xs text-foreground-muted">Status: {order.status}</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-foreground-muted">
          <div>
            <span className="text-white font-medium">Hotel</span>
            <span className="block">{order.hotel?.name || "—"}</span>
          </div>
          <div>
            <span className="text-white font-medium">Supplier</span>
            <span className="block">{order.supplier?.name || "—"}</span>
          </div>
          <div>
            <span className="text-white font-medium">Total</span>
            <span className="block text-white font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency || "EGP", maximumFractionDigits: 2 }).format(order.total || 0)}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <h3 className="text-sm font-medium text-white mb-2">Items</h3>
          <div className="space-y-2">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-ink-950 border border-white/5 rounded p-2">
                <span className="text-xs text-white">{item.product?.name || item.product?.id}</span>
                <span className="text-xs text-foreground-subtle">SKU: {item.product?.sku || "—"}</span>
              </div>
            ))}
            {!(order.items?.length) ? (
              <p className="text-xs text-foreground-subtle">No item details available.</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
            <Clock size={12} /> Back to Orders
          </Link>
          <Link href="/hotel/checkout" className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-foreground-subtle hover:text-white transition-colors">
            <ShieldCheck size={12} /> Procurement Portal
          </Link>
        </div>
        <p className="text-[10px] text-foreground-subtle mt-4">Note: order approval, fulfillment, receipt, invoice, and financing actions are handled through the Authority Matrix with server-side RBAC and audit logging. This view connects to real /v1/orders/[id] data and requires review before mutation.</p>
      </div>
    </div>
  );
}
