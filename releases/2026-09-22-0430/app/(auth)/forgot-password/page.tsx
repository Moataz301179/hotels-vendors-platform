"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-full bg-accent-base/10 border border-accent-base/20 flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-accent-base" />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold text-white mb-2">Check your email</h1>
          <p className="text-white/40 text-[14px] max-w-sm mx-auto">
            If an account exists for {email}, we have sent password reset instructions.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-[13px] font-medium hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-base/[0.08] border border-accent-base/15 text-accent-base text-[11px] font-medium uppercase tracking-[0.15em] mb-5">
          <KeyRound size={11} />
          Password Reset
        </div>
        <h1 className="text-[28px] font-semibold text-white tracking-[-0.02em]">
          Reset Password
        </h1>
        <p className="mt-2 text-[14px] text-white/40">
          Enter your registered email and we will send you reset instructions.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-white/50">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@hotel.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[14px] placeholder:text-white/15 focus:border-accent-base/30 focus:outline-none focus:ring-1 focus:ring-accent-base/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-base text-surface text-[13px] font-semibold hover:bg-accent-base/90 disabled:opacity-50 transition-all hover:shadow-accent"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Send Reset Link
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[13px] text-white/30">
        Remember your password?{" "}
        <Link href="/login" className="text-accent-base hover:opacity-80 font-medium transition-opacity">
          Sign in
        </Link>
      </p>
    </div>
  );
}
