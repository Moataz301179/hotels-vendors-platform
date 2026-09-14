"use client";

import { Landmark, ArrowRight, ExternalLink } from "lucide-react";
import { OlivLogo } from "@/components/partners/oliv-logo";

interface OlivReferralCTAProps {
  orderId?: string;
  invoiceId?: string;
  amount?: number;
  variant?: "banner" | "card" | "inline";
}

/**
 * Oliv Referral CTA — shown on order/invoice pages for suppliers.
 * Phase 1: Redirects to Oliv for financing application.
 */
export function OlivReferralCTA({
  orderId,
  invoiceId,
  amount,
  variant = "card",
}: OlivReferralCTAProps) {
  const params = new URLSearchParams();
  if (orderId) params.set("orderId", orderId);
  if (invoiceId) params.set("invoiceId", invoiceId);
  if (amount) params.set("amount", String(amount));
  const qs = params.toString();
  const referralUrl = `/api/v1/oliv/click${qs ? `?${qs}` : ""}`;

  if (variant === "banner") {
    return (
      <div className="rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ borderColor: "rgba(var(--success-rgb),0.22)", backgroundColor: "rgba(var(--success-rgb),0.08)" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(var(--success-rgb),0.15)", border: "1px solid var(--success)25" }}>
            <Landmark size={18} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">Need Working Capital?</div>
            <div className="text-[12px] text-white/40">
              {amount
                ? `Finance this EGP ${amount.toLocaleString()} invoice via Oliv — funded in 48h`
                : "Get your invoices financed in 48 hours via Oliv"}
            </div>
          </div>
        </div>
        <a
          href={referralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg transition-all hover:shadow-[0_0_20px_rgba(var(--success-rgb),0.2)] shrink-0"
          style={{ backgroundColor: "var(--success)", color: "#ffffff" }}
        >
          Apply on Oliv <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={referralUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-80"
        style={{ color: "var(--success)" }}
      >
        <Landmark size={13} />
        Finance via Oliv
        <ExternalLink size={10} />
      </a>
    );
  }

  // Default: card
  return (
    <div className="rounded-xl border bg-[#12121a] p-5 hover:border-white/[0.10] transition-all" style={{ borderColor: "rgba(var(--success-rgb),0.22)" }}>
      <div className="flex items-center gap-3 mb-3">
        <OlivLogo size="sm" variant="green" />
      </div>
      <h3 className="text-[14px] font-semibold text-white mb-1.5">Invoice Financing</h3>
      <p className="text-[12px] text-white/40 leading-relaxed mb-4">
        Finance your verified invoices against instant credit approval. No paperwork. No tech integration needed.
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
          FRA Licensed
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-base)" }} />
          48h Funding
        </div>
      </div>
      <a
        href={referralUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold rounded-lg transition-all hover:shadow-[0_0_20px_rgba(var(--success-rgb),0.15)]"
        style={{ backgroundColor: "var(--success)", color: "#ffffff" }}
      >
        Get Financed <ArrowRight size={13} />
      </a>
    </div>
  );
}
