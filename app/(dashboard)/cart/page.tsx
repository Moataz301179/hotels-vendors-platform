"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Trash2, Loader2, AlertCircle, ShoppingCart, Package,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  notes: string | null;
  unitPrice: number | null;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    stockQuantity: number;
    supplier: { id: string; name: string; city: string };
  };
}

interface CartResponse {
  cart: {
    id: string;
    items: CartItem[];
  };
}

export default function CartPage() {
  const { data, loading, error, refetch } = useApi<CartResponse>("/api/v1/cart");
  const [submitting, setSubmitting] = useState(false);

  const cart = data?.cart;
  const items = cart?.items || [];

  const handleAdd = async (productId: string) => {
    try {
      await fetch("/api/v1/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      refetch();
    } catch {
      // Error handled by useApi
    }
  };

  const handleUpdate = async (itemId: string, quantity: number) => {
    try {
      await fetch("/api/v1/cart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      refetch();
    } catch {
      // Error handled by useApi
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await fetch(`/api/v1/cart?itemId=${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      refetch();
    } catch {
      // Error handled by useApi
    }
  };

  const handleClear = async () => {
    try {
      await fetch("/api/v1/cart", {
        method: "DELETE",
        credentials: "include",
      });
      refetch();
    } catch {
      // Error handled by useApi
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const total = items.reduce((sum, item) => sum + (item.unitPrice || item.product?.unitPrice || 0) * item.quantity, 0);

  return (
    <RequireAuth>
      <AppShell active="/cart">
        <Guard roles={["hotel_admin", "gm", "finance_director"]}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Cart</h1>
                <p className="text-sm text-foreground-muted">
                  {items.length} items in cart
                </p>
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-foreground-muted hover:text-red-400 text-sm transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-accent animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
                <p className="text-foreground-muted text-sm">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
                <ShoppingCart size={32} className="mx-auto text-foreground-muted mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">Cart Empty</h3>
                <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                  Browse the marketplace and add products to your cart.
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                  {items.map((item) => {
                    const price = item.unitPrice || item.product?.unitPrice || 0;
                    return (
                      <div key={item.id} className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-foreground-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/marketplace/${item.productId}`} className="text-white font-medium hover:text-accent transition-colors">
                            {item.product?.name}
                          </Link>
                          <div className="text-xs text-foreground-muted">
                            {item.product?.supplier?.name} • {item.product?.sku}
                          </div>
                          <div className="text-accent font-semibold mt-1">{formatMoney(price)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdate(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-white/5 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-12 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdate(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-white/5 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="w-24 text-right text-white font-semibold">
                          {formatMoney(price * item.quantity)}
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-foreground-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-surface-1 border border-border-subtle rounded-xl p-5 xl:sticky xl:top-24 h-fit">
                  <h2 className="text-white font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Subtotal</span>
                      <span>{formatMoney(total)}</span>
                    </div>
                    <div className="flex justify-between text-foreground-muted">
                      <span>VAT (14%)</span>
                      <span>{formatMoney(total * 0.14)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-subtle pt-2 text-white font-semibold">
                      <span>Total</span>
                      <span>{formatMoney(total * 1.14)}</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                    Submit for Approval
                  </button>
                </div>
              </div>
            )}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
