"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AuthCompletePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || ran.current) return;
    ran.current = true;
    const role = new URLSearchParams(window.location.search).get("role") || String(user.unsafeMetadata?.hvRole || "HOTEL");
    fetch("/api/v1/auth/clerk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      router.replace("/onboarding");
    }).catch(() => {
      ran.current = false;
    });
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || !isSignedIn) return <main className="min-h-screen grid place-items-center bg-[#f5f6f7] dark:bg-[#0b0d10] text-slate-500">Completing secure sign-in…</main>;
  return <main className="min-h-screen grid place-items-center bg-[#f5f6f7] dark:bg-[#0b0d10] text-slate-500">Setting up your workspace…</main>;
}
