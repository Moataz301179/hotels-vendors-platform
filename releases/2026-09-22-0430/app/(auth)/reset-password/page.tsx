"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-base/[0.08] border border-accent-base/15 text-accent-base text-[11px] font-medium uppercase tracking-[0.15em] mb-5">
          <Lock size={11} />
          Password Reset
        </div>
        <h1 className="text-[28px] font-semibold text-white tracking-[-0.02em]">Create new password</h1>
        <p className="mt-2 text-[14px] text-white/40">Enter a new password for your account.</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-6 sm:p-8">
        {success ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-accent-base/10 border border-accent-base/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-accent-base" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-[16px]">Password updated</h3>
              <p className="text-white/40 text-[14px] mt-1">Your password has been reset. Redirecting to sign in...</p>
            </div>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-base text-surface text-[13px] font-semibold hover:bg-accent-base/90 transition-all hover:shadow-accent">
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-white/50">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[14px] text-white placeholder:text-white/15 outline-none focus:border-accent-base/30 focus:ring-1 focus:ring-accent-base/10 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-white/50">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" />
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password" required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[14px] text-white placeholder:text-white/15 outline-none focus:border-accent-base/30 focus:ring-1 focus:ring-accent-base/10 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={loading || !token}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-base text-surface text-[13px] font-semibold hover:bg-accent-base/90 transition-all hover:shadow-accent disabled:opacity-50">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Reset Password <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-[13px] text-white/30">
        <Link href="/login" className="text-accent-base hover:opacity-80 font-medium transition-opacity">Back to Sign In</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse">
        <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-8">
          <div className="h-6 bg-white/[0.04] rounded w-1/3 mb-4" />
          <div className="h-12 bg-white/[0.04] rounded mb-4" />
          <div className="h-12 bg-white/[0.04] rounded" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
