"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  const hasClerkConfiguration = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <section aria-label="Sign in to your workspace" className="w-full flex items-center justify-center px-2 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-[var(--hv-ink)] text-2xl font-semibold tracking-tight">Sign in to HotelsVendors</p>
          <p className="mt-2 text-slate-600 text-sm">Continue to your organization’s workspace.</p>
        </div>
        {hasClerkConfiguration ? (
          <SignIn routing="hash" signUpUrl="/register" fallbackRedirectUrl="/dashboard" />
        ) : (
          <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            Sign-in is temporarily unavailable because the workspace authentication service is not configured. Please contact support and include code <code className="font-semibold">AUTH_CONFIG_MISSING</code>.
          </div>
        )}
        <nav aria-label="Sign-in help and policies" className="flex flex-wrap justify-center gap-4 mt-5 text-sm text-[var(--hv-blue-ink)]">
          <Link href="/privacy" className="min-h-11 py-3">Privacy</Link>
          <Link href="/terms" className="min-h-11 py-3">Terms</Link>
          <Link href="/support" className="min-h-11 py-3">Help with sign-in</Link>
        </nav>
      </div>
    </section>
  );
}
