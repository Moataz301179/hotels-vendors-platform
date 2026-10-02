// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Btn } from "@/components/ui";
import { IcCart, IcPlus, IcMinus, IcBox } from "@/components/icons";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

export default function CartPage() {
  const { items, totalItems, totalPrice, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice ?? i.price,
            supplierId: i.supplierId,
          })),
          subtotal,
          total: totalPrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Checkout failed");
      }
      setCheckoutSuccess(true);
      clearCart();
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell role="hotel">
      <PageHeader
        title="Shopping Cart"
        description={`${totalItems} item${totalItems !== 1 ? "s" : ""} in your cart`}
        action={
          items.length > 0 ? (
            <Button size="sm" variant="outline" onClick={clearCart}>
              <IcTrash className="h-4 w-4" /> Clear Cart
            </Button>
          ) : null
        }
      />

      {checkoutSuccess && (
        <Card className="p-4 mb-6 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-300">Order placed successfully</p>
              <p className="text-xs text-emerald-400/70">You will be redirected to confirm your order shortly.</p>
            </div>
          </div>
        </Card>
      )}

      {checkoutError && (
        <Card className="p-4 mb-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-300">Checkout error</p>
              <p className="text-xs text-red-400/70">{checkoutError}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="h-14 w-14 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <IcCart className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Your cart is empty</h3>
              <p className="text-sm text-slate-400 mb-4">
                Browse the marketplace to add products to your cart.
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="/marketplace">Browse Marketplace</a>
              </Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-slate-700/30">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Product image placeholder */}
                    <div className="h-16 w-16 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0 border border-slate-700/30">
                      <IcBox className="h-6 w-6 text-slate-500" />
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-white truncate">
                            {item.name}
                          </h4>
                          {item.supplierName && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.supplierName}</p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-slate-600 font-mono mt-0.5">SKU: {item.sku}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <IcTrash className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-slate-700/40 rounded-md overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-slate-300 hover:bg-white/5 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <IcMinus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 py-1.5 text-sm text-white font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1.5 text-slate-300 hover:bg-white/5 transition-colors"
                          >
                            <IcPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            EGP {(item.price * item.quantity).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                          </div>
                          {item.unitPrice && item.unitPrice !== item.price && (
                            <div className="text-xs text-slate-500">
                              EGP {item.unitPrice.toLocaleString("en-EG", { minimumFractionDigits: 2 })} / unit
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-24">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subtotal ({totalItems} items)</span>
                <span className="text-white font-medium">
                  EGP {subtotal.toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Shipping</span>
                <span className="text-slate-300">Calculated at checkout</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">VAT (14%)</span>
                <span className="text-white font-medium">
                  EGP {(subtotal * 0.14).toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-slate-700/30 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-white">Total</span>
                <span className="text-base font-medium text-signal">
                  EGP {totalPrice.toLocaleString("en-EG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                size="sm"
                className="w-full h-11 text-base"
                onClick={handleCheckout}
                disabled={items.length === 0 || loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : "Proceed to Checkout"}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IcBox className="h-3.5 w-3.5" />
                Shipping & handling calculated after order confirmation
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
