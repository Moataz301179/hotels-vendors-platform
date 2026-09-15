"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { Btn, Field, TextInput } from "@/components/ui";
import PublicHeader from "@/components/PublicHeader";
import { IcLock, Logo } from "@/components/icons";

export default function LoginPage() {
  const { t, lang } = usePrefs();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Remove auto-login from store
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        const rolePaths: Record<string, string> = {
          platform_admin: "/admin",
          hotel_admin: "/hotel",
          gm: "/hotel",
          finance_director: "/hotel",
          supplier_manager: "/supplier",
          partner_officer: "/factoring",
          carrier: "/carrier",
        };
        router.replace(rolePaths[data.user.role] || "/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <PublicHeader solid />
      <div className="mx-auto grid max-w-[1400px] gap-0 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-16">
        <div className="relative hidden overflow-hidden rounded-lg bg-ink-950 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-ink-950 to-ink-950" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-semibold">HotelsVendors</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold leading-tight">
                {lang === "ar" ? "المشتريات الفندقية الذكية" : "Smart Hospitality Procurement"}
              </h1>
              <p className="mt-3 text-ink-300">
                {lang === "ar"
                  ? "منصة المشتريات B2B لإدارة سلسلة التوريد الفندقية في مصر"
                  : "B2B procurement platform for Egyptian hospitality supply chain management"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-ink-950 dark:text-white">
                {t("login.signIn") || "Sign In"}
              </h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {t("login.subtitle") || "Access your procurement workspace"}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Field label={t("login.email") || "Email"} id="email">
                <TextInput
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field label={t("login.password") || "Password"} id="password">
                <TextInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />
              </Field>

              <Btn type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : t("login.submit") || "Sign In"}
              </Btn>
            </form>

            <div className="text-center text-sm">
              <Link href="/register" className="text-accent hover:underline">
                {t("login.noAccount") || "Don't have an account? Register"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
