"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoCheckout() {
  const [placed, setPlaced] = useState(false);
  const [orderId] = useState(() => `DEMO-${Math.random().toString(36).slice(2, 9).toUpperCase()}`);

  function placeOrder() {
    // Mock placing an order — in a real demo this would call an API
    setPlaced(true);
  }

  return (
    <div className="min-h-screen bg-[#0c0c12] text-white p-6">
      <div className="max-w-3xl mx-auto">
        {!placed ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">Demo Checkout</h1>
            <p className="text-sm text-white/60 mb-4">This demo skips the payment step. Click to place the order and see a successful flow.</p>

            <div className="p-4 bg-white/3 rounded mb-4">
              <h2 className="font-semibold">Order Summary</h2>
              <p className="text-sm text-white/50">This demo uses the cart stored in the browser. In production the backend persists the order and triggers workflows.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={placeOrder} className="px-4 py-2 bg-accent-base text-black rounded font-semibold">Place Order (No Payment)</button>
              <Link href="/sandbox" className="px-4 py-2 bg-white/5 border border-white/10 rounded">Back to Sandbox</Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Order Placed</h1>
            <p className="text-white/60 mb-4">Order ID: <strong className="text-white">{orderId}</strong></p>
            <p className="mb-6 text-white/60">In a real demo this would enqueue ETA submission, create delivery, and trigger factoring workflows.</p>
            <Link href="/" className="px-4 py-2 bg-white text-black rounded">Return Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
