"use client";

import { useState, useEffect } from "react";
import { CreditCard, Barcode, Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy } from "lucide-react";

interface PaymentMethodsProps {
  orderId: string;
  amount: number;
  currency?: string;
  onPaymentComplete?: () => void;
}

interface UserInfo {
  email: string;
  name: string;
  phone: string;
}

const barcodeBars = [
  { w: 2, gap: 1 }, { w: 4, gap: 2 }, { w: 1, gap: 1 }, { w: 3, gap: 2 },
  { w: 2, gap: 1 }, { w: 5, gap: 2 }, { w: 1, gap: 1 }, { w: 2, gap: 2 },
  { w: 4, gap: 1 }, { w: 1, gap: 2 }, { w: 3, gap: 1 }, { w: 2, gap: 2 },
  { w: 1, gap: 1 }, { w: 5, gap: 2 }, { w: 2, gap: 1 }, { w: 3, gap: 2 },
  { w: 1, gap: 1 }, { w: 2, gap: 2 }, { w: 4, gap: 1 }, { w: 1, gap: 2 },
];

export function PaymentMethods({ orderId, amount, currency = "EGP", onPaymentComplete }: PaymentMethodsProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"card" | "fawry" | null>(null);

  const [paymobLoading, setPaymobLoading] = useState(false);
  const [paymobError, setPaymobError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const [fawryLoading, setFawryLoading] = useState(false);
  const [fawryError, setFawryError] = useState("");
  const [fawryData, setFawryData] = useState<{
    referenceNumber: string;
    paymentAmount: number;
    expirationTime: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setUser({
            email: json.data.email || "",
            name: json.data.name || "",
            phone: json.data.phone || "01000000000",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handlePaymob = async () => {
    setSelectedMethod("card");
    setPaymobLoading(true);
    setPaymobError("");
    try {
      const res = await fetch("/api/v1/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email: user?.email || "",
          firstName: user?.name?.split(" ")[0] || "",
          lastName: user?.name?.split(" ").slice(1).join(" ") || "",
          phone: user?.phone || "01000000000",
          description: `Payment for order ${orderId}`,
          referenceType: "MARKETPLACE_COMMISSION",
          referenceId: orderId,
        }),
      });
      const json = await res.json();
      const url = json.data?.paymentUrl ?? json.paymentUrl;
      if (json.success && url) {
        setPaymentUrl(url);
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setPaymobError(json.error || json.data?.error || "Failed to create payment");
      }
    } catch {
      setPaymobError("Network error");
    } finally {
      setPaymobLoading(false);
    }
  };

  const handleFawry = async () => {
    setSelectedMethod("fawry");
    setFawryLoading(true);
    setFawryError("");
    try {
      const res = await fetch("/api/v1/payments/fawry-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerEmail: user?.email || "",
          customerMobile: user?.phone || "01000000000",
          customerName: user?.name || "",
          amount,
          description: "Order deposit payment",
        }),
      });
      const json = await res.json();
      const d = json.data ?? json;
      if (json.success && d?.referenceNumber) {
        setFawryData({
          referenceNumber: d.referenceNumber,
          paymentAmount: d.paymentAmount,
          expirationTime: d.expirationTime,
        });
      } else {
        setFawryError(json.error || d?.error || "Failed to create Fawry charge");
      }
    } catch {
      setFawryError("Network error");
    } finally {
      setFawryLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op fallback */
    }
  };

  const formatExpiry = (timestamp: number) =>
    new Date(timestamp).toLocaleString("en-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const methodSelector = (
    <div className="flex gap-2 mb-3">
      <button
        onClick={handlePaymob}
        disabled={paymobLoading}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
          selectedMethod === "card" && paymentUrl
            ? "bg-accent-base/20 border-accent-base/30 text-accent-base"
            : "bg-surface-raised border-subtle text-foreground-tertiary hover:border-accent-base/30 hover:text-accent-base"
        }`}
      >
        <CreditCard size={14} />
        Pay with Card (Paymob)
      </button>
      <button
        onClick={handleFawry}
        disabled={fawryLoading}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
          selectedMethod === "fawry" && fawryData
            ? "bg-accent-base/20 border-accent-base/30 text-accent-base"
            : "bg-surface-raised border-subtle text-foreground-tertiary hover:border-accent-base/30 hover:text-accent-base"
        }`}
      >
        <Barcode size={14} />
        Pay at Fawry
      </button>
    </div>
  );

  if (fawryData) {
    return (
      <div className="space-y-3">
        {methodSelector}
        <div className="p-5 rounded-xl bg-surface-raised border border-subtle">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Fawry Reference Created</span>
          </div>

          <div className="text-center mb-4">
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1">Reference Number</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold font-mono tracking-widest text-foreground">
                {fawryData.referenceNumber}
              </span>
              <button
                onClick={() => copyToClipboard(fawryData.referenceNumber)}
                className="p-2 rounded-lg hover:bg-surface-raised text-foreground-muted hover:text-foreground-tertiary transition-colors"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
              {barcodeBars.map((bar, i) => (
                <rect
                  key={i}
                  x={barcodeBars.slice(0, i).reduce((acc, b) => acc + b.w + b.gap, 0)}
                  y={0}
                  width={bar.w}
                  height={40}
                  fill="#000"
                />
              ))}
            </svg>
            <p className="text-[9px] text-gray-400 text-center font-mono tracking-[0.5em] mt-1">
              {fawryData.referenceNumber}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs mb-4">
            <span className="text-foreground-muted">Expires</span>
            <span className="text-foreground-tertiary font-medium">
              {formatExpiry(fawryData.expirationTime)}
            </span>
          </div>

          <p className="text-xs text-foreground-muted text-center mb-4">
            Pay at any Fawry machine or Fawry app using the reference code above
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(fawryData.referenceNumber)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-base/10 border border-accent-base/20 text-accent-base text-sm font-medium hover:bg-accent-base/20 transition-colors flex-1"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy Reference"}
            </button>
            <button
              onClick={() => onPaymentComplete?.()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors flex-1"
            >
              <CheckCircle2 size={14} />
              I&apos;ve Paid
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="space-y-3">
        {methodSelector}
        <div className="p-4 rounded-xl bg-accent-base/10 border border-accent-base/20">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink size={14} className="text-accent-base" />
            <span className="text-xs font-medium text-accent-base">Payment page opened</span>
          </div>
          <p className="text-xs text-foreground-tertiary mb-3">
            Complete your payment in the new tab. If the window didn&apos;t open, click the button below.
          </p>
          <div className="flex gap-2">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-base/20 border border-accent-base/30 text-accent-base text-sm font-medium hover:bg-accent-base/30 transition-colors"
            >
              <ExternalLink size={14} />
              Open Payment Page
            </a>
            <button
              onClick={() => onPaymentComplete?.()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle2 size={14} />
              I&apos;ve Paid
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methodSelector}

      {paymobError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle size={14} /> {paymobError}
        </div>
      )}

      {fawryError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle size={14} /> {fawryError}
        </div>
      )}

      {selectedMethod === "card" && paymobLoading && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-surface-raised border border-subtle text-foreground-tertiary text-sm">
          <Loader2 size={14} className="animate-spin" />
          Creating payment...
        </div>
      )}

      {selectedMethod === "fawry" && fawryLoading && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-surface-raised border border-subtle text-foreground-tertiary text-sm">
          <Loader2 size={14} className="animate-spin" />
          Generating Fawry reference...
        </div>
      )}
    </div>
  );
}
