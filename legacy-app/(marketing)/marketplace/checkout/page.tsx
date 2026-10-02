"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, CreditCard, CheckCircle } from "lucide-react";

export default function MarketplaceCheckoutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Checkout</h1>
          <p className="text-sm text-foreground-muted">Review your cart, confirm delivery, and complete procurement. No automatic execution; orders require approval.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-foreground-muted" /> Order Flow</h2>
          <p className="text-xs text-foreground-muted mb-4">This checkout connects to the existing <code className="text-foreground-subtle">/api/v1/checkout</code> endpoint used by the hotel procurement portal. Orders proceed through approval stages (Draft → Pending Approval → Approved → Confirmed) per the Authority Matrix. No autonomous execution.</p>
          <div className="flex items-center gap-3">
            <a href="/hotel/checkout" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-xs text-foreground-subtle hover:text-white transition-colors">
              <CreditCard size={14} /> Hotel Procurement Checkout
            </a>
            <button onClick={() => router.push("/marketplace")} className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-lg text-xs text-foreground-subtle hover:text-white transition-colors">
              <ArrowRight size={14} /> Back to Marketplace
            </button>
          </div>
        </div>

        <div className="bg-ink-950 border border-white/5 rounded-xl p-5">
          <h3 className="text-xs font-medium text-white mb-3">Procurement Continuity Note</h3>
          <p className="text-[11px] text-foreground-muted leading-relaxed">
            The marketplace catalog links to supplier central and the hotel procurement portal. Checkout uses the same transactional fee engine (1.5–2.5%) and requires <code className="text-foreground-subtle">paymentGuaranteed = true</code> before any transition to <span className="text-amber-300">CONFIRMED</span>, <span className="text-amber-300">IN_TRANSIT</span>, or <span className="text-amber-300">DELIVERED</span>. The Authority Matrix governs multi-level approvals; admin overrides require dual authorization. This checkout surface completes the intelligence → opportunity → action → procurement flow without opening speculative infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
