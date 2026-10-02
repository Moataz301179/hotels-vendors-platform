"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0c0c12] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-white text-2xl font-semibold tracking-tight">HotelsVendors</div>
          <p className="mt-2 text-white/50 text-sm">Enter your workspace securely with Clerk.</p>
        </div>
        <SignIn path="/login" routing="path" signUpUrl="/register" fallbackRedirectUrl="/dashboard" />
      </div>
    </main>
  );
}
