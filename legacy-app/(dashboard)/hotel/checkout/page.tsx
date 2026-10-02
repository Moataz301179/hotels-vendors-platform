"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  CreditCard,
  MapPin,
  CheckCircle,
  Package,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { generateOlivCheckoutUrl } from "@/lib/payments/oliv-checkout";

interface UserData {
  userId: string;
  tenantId: string;
  hotelName: string;
}

interface Address {
  label?: string;
  address: string;
  city: string;
  governorate: string;
  phone: string;
}

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Shipping", icon: Truck },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Confirm", icon: CheckCircle },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice: subtotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orders, setOrders] = useState<Array<{ id: string; supplierId: string; supplier?: string; orderNumber?: string; total: number; status: string }>>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [creditInfo, setCreditInfo] = useState<{ creditLimit: number; creditUsed: number } | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setUserData(json.data);
          // Fetch credit info if hotel is linked
          if (json.data.hotelId) {
            fetch(`/api/v1/hotel/credit?hotelId=${json.data.hotelId}`)
              .then((r) => r.json())
              .then((cj) => {
                if (cj.success && cj.data) {
                  setCreditInfo({
                    creditLimit: cj.data.creditLimit ?? 0,
                    creditUsed: cj.data.creditUsed ?? 0,
                  });
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const [address, setAddress] = useState<Address>({
    address: "",
    city: "Cairo",
    governorate: "Cairo",
    phone: "",
  });

  const [shippingMethod, setShippingMethod] = useState<"express" | "standard" | "self">("standard");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [poNumber, setPoNumber] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [notes, setNotes] = useState("");

  const vatRate = 0.14;
  const vatAmount = subtotal * vatRate;
  const shippingCost = shippingMethod === "express" ? 150 : shippingMethod === "standard" ? 75 : 0;
  const grandTotal = subtotal + vatAmount + shippingCost;

  // Group by supplier
  const supplierGroups = items.reduce((acc, item) => {
    if (!acc[item.supplierName || "Unknown"]) acc[item.supplierName || "Unknown"] = [];
    acc[item.supplierName || "Unknown"].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          address,
          shippingMethod,
          paymentMethod,
          poNumber: poNumber || undefined,
          costCenter: costCenter || undefined,
          procurementNotes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
        setPlaced(true);
        clearCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Order Placed Successfully</h1>
        <p className="text-foreground-muted mb-6">Your orders have been submitted for approval.</p>
        <div className="space-y-3 mb-8">
          {orders.map((o) => (
            <div key={o.id} className="bg-surface-1 rounded-xl border border-border-subtle p-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-white">{o.orderNumber ?? o.id.slice(0, 8)}</p>
                  <p className="text-xs text-foreground-muted">{o.supplier ?? 'Supplier'}</p>
                </div>
                <span className="text-sm font-bold text-accent-base">EGP {o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/hotel/order")}
          className="px-6 py-3 rounded-xl bg-accent-base text-white font-medium hover:bg-accent-base/90 transition-colors"
        >
          Track Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step >= s.id;
          const isCurrent = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-accent-base text-white"
                    : isActive
                    ? "bg-accent-base/10 text-accent-base"
                    : "bg-surface-2 text-foreground-muted"
                }`}
              >
                <Icon size={14} />
                {s.label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-foreground-muted" />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-1 rounded-2xl border border-border-subtle p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-white">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">Address</label>
                    <input
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">City</label>
                    <input
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">Governorate</label>
                    <input
                      value={address.governorate}
                      onChange={(e) => setAddress({ ...address, governorate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+20 10..."
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!address.address || !address.phone}
                  className="w-full py-3 rounded-xl bg-accent-base text-white font-medium hover:bg-accent-base/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Shipping
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-1 rounded-2xl border border-border-subtle p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-white">Shipping Method</h2>
                <div className="space-y-3">
                  {[
                    { id: "express", label: "Express (48 hours)", cost: 150, desc: "Coastal & industrial clusters" },
                    { id: "standard", label: "Standard (3-5 days)", cost: 75, desc: "All of Egypt" },
                    { id: "self", label: "Supplier Self-Shipping", cost: 0, desc: "Arranged directly with supplier" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setShippingMethod(method.id as "express" | "standard" | "self")}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-left ${
                        shippingMethod === method.id
                          ? "border-accent-base bg-accent-base/5"
                          : "border-border-subtle hover:border-border-visible"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{method.label}</p>
                        <p className="text-xs text-foreground-muted">{method.desc}</p>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {method.cost === 0 ? "Free" : `EGP ${method.cost}`}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-border-subtle text-foreground-tertiary font-medium hover:bg-surface-2 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 rounded-xl bg-accent-base text-white font-medium hover:bg-accent-base/90 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-1 rounded-2xl border border-border-subtle p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-white">Review & Payment</h2>

                {/* B2B Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">PO Number</label>
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">Cost Center</label>
                    <input
                      value={costCenter}
                      onChange={(e) => setCostCenter(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "bank_transfer", label: "Bank Transfer" },
                      { id: "oliv_checkout", label: "Pay via Oliv", desc: "Net-60 terms", icon: Landmark },
                      { id: "invoice", label: "Invoice (Net 30)" },
                      { id: "credit_terms", label: "Credit Terms" },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          paymentMethod === pm.id
                            ? pm.id === "oliv_checkout"
                              ? "border-[var(--success)] bg-[var(--success)]/5 text-[var(--success)]"
                              : "border-accent-base bg-accent-base/5 text-accent-base"
                            : "border-border-subtle text-foreground-tertiary hover:border-border-visible"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {pm.icon && <pm.icon size={14} />}
                          <span>{pm.label}</span>
                        </div>
                        {pm.desc && (
                          <p className="text-xs text-foreground-muted mt-1">{pm.desc}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl border border-border-subtle text-foreground-tertiary font-medium hover:bg-surface-2 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      if (paymentMethod === "oliv_checkout") {
                        const result = await generateOlivCheckoutUrl({
                          hotelId: userData?.userId || "",
                          hotelName: userData?.hotelName || "",
                          orderId: "",
                          amount: grandTotal,
                          currency: "EGP",
                          items: items.map((i) => ({
                            name: i.name,
                            quantity: i.quantity,
                            price: i.price,
                          })),
                        });
                        window.open(result.checkoutUrl, "_blank");
                      } else {
                        handlePlaceOrder();
                      }
                    }}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-accent-base text-white font-medium hover:bg-accent-base/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Placing Order..." : paymentMethod === "oliv_checkout" ? `Pay via Oliv · EGP ${grandTotal.toFixed(2)}` : `Place Order · EGP ${grandTotal.toFixed(2)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart Items */}
          <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6">
            <h3 className="text-sm font-semibold text-foreground-secondary mb-4">Order Items</h3>
            {Object.entries(supplierGroups).map(([supplierName, supplierItems]) => (
              <div key={supplierName} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-subtle">
                  <Package size={14} className="text-foreground-muted" />
                  <span className="text-xs font-semibold text-foreground-tertiary">{supplierName}</span>
                </div>
                <div className="space-y-3">
                  {supplierItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center text-xs font-bold text-foreground-muted shrink-0">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-foreground-muted">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-border-subtle flex items-center justify-center text-foreground-muted hover:bg-surface-2 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium text-white w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-border-subtle flex items-center justify-center text-foreground-muted hover:bg-surface-2 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-white w-20 text-right">
                        EGP {(item.quantity * item.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface-1 rounded-2xl border border-border-subtle p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-foreground-secondary mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-foreground-tertiary">
                <span>Subtotal</span>
                <span>EGP {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-foreground-tertiary">
                <span>VAT (14%)</span>
                <span>EGP {vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-foreground-tertiary">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? "Free" : `EGP ${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-border-subtle pt-3 flex justify-between font-semibold text-white">
                <span>Grand Total</span>
                <span>EGP {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {creditInfo && creditInfo.creditLimit > 0 && (() => {
              const newExposure = creditInfo.creditUsed + grandTotal;
              const remaining = creditInfo.creditLimit - newExposure;
              const utilization = (newExposure / creditInfo.creditLimit) * 100;
              const willExceed = remaining < 0;
              return (
                <div className={`mt-4 p-3 rounded-lg border flex items-start gap-2 ${
                  willExceed
                    ? "bg-red-500/10 border-red-500/20"
                    : utilization > 80
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-surface-1 border-border-subtle"
                }`}>
                  <Landmark size={14} className={`shrink-0 mt-0.5 ${
                    willExceed ? "text-red-400" : utilization > 80 ? "text-amber-400" : "text-foreground-muted"
                  }`} />
                  <div className="text-xs space-y-1">
                    <p className={`font-semibold ${willExceed ? "text-red-300" : utilization > 80 ? "text-amber-300/80" : "text-foreground-tertiary"}`}>
                      Credit Impact
                    </p>
                    <div className="space-y-0.5 text-foreground-muted">
                      <div className="flex justify-between">
                        <span>Current usage</span>
                        <span>EGP {creditInfo.creditUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ This order</span>
                        <span>EGP {grandTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border-subtle pt-0.5">
                        <span>After checkout</span>
                        <span>EGP {newExposure.toLocaleString()} / {creditInfo.creditLimit.toLocaleString()}</span>
                      </div>
                    </div>
                    {willExceed && (
                      <p className="text-red-300/80 font-medium">
                        Exceeds limit by EGP {Math.abs(remaining).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {Object.keys(supplierGroups).length > 1 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  Your order will be split into {Object.keys(supplierGroups).length} separate orders for optimal fulfillment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
