"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowRight, Loader2, CheckCircle2, X, RotateCcw } from "lucide-react";

function PairingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Generate 3 random numbers on mount
  useEffect(() => {
    const generateNumbers = () => {
      const correctNumber = Math.floor(100 + Math.random() * 900);
      const allNumbers = [correctNumber];
      while (allNumbers.length < 3) {
        const num = Math.floor(100 + Math.random() * 900);
        if (!allNumbers.includes(num)) allNumbers.push(num);
      }
      // Shuffle
      const shuffled = allNumbers.sort(() => Math.random() - 0.5);
      setNumbers(shuffled);
    };
    generateNumbers();
  }, []);

  const handleSelect = async (number: number) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingNumber: number }),
      });
      const data = await res.json();

      if (data.success) {
        setVerified(true);
        setSelectedNumber(number);
        setTimeout(() => router.push(redirectTo), 2000);
      } else {
        setError(data.error || "Invalid pairing number. Please try again.");
        setAttempts((prev) => prev + 1);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setNumbers((prev) => [...prev].sort(() => Math.random() - 0.5));
    setError("");
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#0c0c12" }}>
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto" style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)" }}>
            <CheckCircle2 size={40} style={{ color: "var(--accent-base)" }} />
          </div>
          <h1 className="text-[24px] font-semibold text-white">Accounts Linked!</h1>
          <p className="text-foreground-secondary text-[14px]">
            Your HOVIN account is now paired with HotelsVendors. Redirecting...
          </p>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--accent-base)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20" style={{ backgroundColor: "#0c0c12" }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium uppercase tracking-[0.15em] mb-4 mx-auto" style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)", color: "var(--accent-base)" }}>
            <Zap size={12} />
            Pair with HOVIN
          </div>
          <h1 className="text-[28px] font-semibold text-foreground tracking-[-0.02em] mb-2">
            Link Your Account
          </h1>
          <p className="text-[14px] text-foreground-secondary">
            Open the HOVIN mobile app. You&apos;ll see a 3-digit number displayed.
            Choose the matching number below to securely link your accounts.
          </p>
        </div>

        {/* Numbers Grid */}
        <div className="grid grid-cols-3 gap-3">
          {numbers.map((num, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(num)}
              disabled={loading}
              className="relative aspect-square rounded-xl border transition-all text-5xl font-bold"
              style={{
                borderColor: selectedNumber === num ? "var(--accent-base)" : "rgba(255,255,255,0.08)",
                backgroundColor: selectedNumber === num ? "rgba(var(--accent-base-rgb),0.08)" : "rgba(255,255,255,0.02)",
                color: selectedNumber === num ? "var(--accent-base)" : "rgba(255,255,255,0.4)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading && selectedNumber === num && <Loader2 size={24} className="animate-spin absolute inset-0 flex items-center justify-center" style={{ color: "var(--accent-base)" }} />}
              {loading && selectedNumber !== num && <X size={24} className="absolute inset-0 flex items-center justify-center" style={{ color: "rgba(220,38,38,0.5)" }} />}
              {!loading && selectedNumber === num && <CheckCircle2 size={28} className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--accent-base)" }} />}
              {!loading && !selectedNumber && num}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[13px] text-center">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-[12px] text-foreground-muted mb-3">
            Numbers change after 3 incorrect attempts
          </p>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} /> New Numbers
          </button>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(var(--accent-base-rgb),0.05)", border: "1px solid rgba(var(--accent-base-rgb),0.12)" }}>
          <p className="text-[12px] text-foreground-secondary leading-relaxed text-center">
            <strong style={{ color: "var(--accent-base)" }}>How it works:</strong> The HOVIN app generates a one-time pairing number. HotelsVendors shows 3 numbers — only one matches. Select the correct one to link your accounts securely without passwords.
          </p>
        </div>

        <p className="text-center text-[13px] text-foreground-muted">
          Don&apos;t have the HOVIN app?{" "}
          <Link href="/register" className="text-accent-base hover:opacity-80 font-medium transition-opacity">
            Download it first
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PairingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PairingContent />
    </Suspense>
  );
}