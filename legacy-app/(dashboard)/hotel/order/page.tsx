"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Calendar,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function OrderBuilderPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice: subtotal, clearCart } = useCart();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const vatRate = 0.14;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  async function handleSubmit() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      // Group by supplier — for simplicity, use the first supplier
      const supplierId = items[0].supplierId;
      const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const idempotencyKey = crypto.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          orderNumber,
          supplierId,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.price,
            notes: "",
          })),
          deliveryDate: deliveryDate || undefined,
          deliveryInstructions: instructions || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        clearCart();
      } else {
        setError(json.error || "Failed to submit order");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent-emerald/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-accent-emerald" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Order Submitted!</h2>
        <p className="text-foreground-muted text-center max-w-md">
          Your purchase order has been sent for approval. You will be notified once it is reviewed.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => router.push("/hotel")}
            className="px-5 py-2.5 rounded-xl bg-surface border border-border-default text-foreground font-medium hover:border-border-strong transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => { setSubmitted(false); router.push("/hotel/catalog"); }}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/hotel/catalog")}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Order</h1>
          <p className="text-sm text-foreground-muted">Review your cart and submit for approval</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <ShoppingBag size={48} className="mx-auto text-foreground-faint" />
          <h3 className="text-lg font-semibold text-foreground">Your cart is empty</h3>
          <p className="text-foreground-muted">Browse the catalog to add products to your order.</p>
          <button
            onClick={() => router.push("/hotel/catalog")}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle">
              <h3 className="font-semibold text-foreground">Order Items ({items.length})</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} className="text-foreground-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                    <p className="text-xs text-foreground-muted">{item.sku} · {item.supplierName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-surface-hover transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover:bg-surface-hover transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-semibold text-foreground">{(item.quantity * item.price).toLocaleString()}</p>
                    <p className="text-xs text-foreground-faint">EGP</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-lg hover:bg-brand-900/30 text-foreground-faint hover:text-brand-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Delivery Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">Delivery Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-default text-foreground focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-foreground-muted uppercase tracking-wider mb-1.5 block">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any special delivery instructions..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-default text-foreground placeholder:text-foreground-faint focus:border-brand-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">Subtotal</span>
              <span className="text-foreground font-medium">{subtotal.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">VAT (14%)</span>
              <span className="text-foreground font-medium">{vatAmount.toLocaleString()} EGP</span>
            </div>
            <div className="pt-3 border-t border-border-subtle flex justify-between">
              <span className="text-foreground font-semibold">Total</span>
              <span className="text-xl font-bold text-foreground metric-value">{total.toLocaleString()} EGP</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-brand-900/20 border border-brand-700/30 text-brand-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/hotel/catalog")}
              className="px-5 py-2.5 rounded-xl bg-surface border border-border-default text-foreground font-medium hover:border-border-strong transition-colors"
            >
              Add More Items
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
