"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/format";
import { Btn, EmptyState } from "./ui";
import {
  IcCart,
  IcCheck,
  IcGlobe,
  IcLock,
  IcMenu,
  IcMoon,
  IcOut,
  IcSun,
  IcX,
  Logo,
} from "./icons";

interface NavItem {
  href: string;
  key: string;
  badge?: number;
}

export function navFor(role: Role, cartCount: number): NavItem[] {
  switch (role) {
    case "hotel_admin":
    case "gm":
    case "finance_director":
      return [
        { href: "/dashboard", key: "nav.dashboard" },
        { href: "/marketplace", key: "nav.marketplace" },
        { href: "/suppliers", key: "nav.suppliers" },
        { href: "/cart", key: "nav.cart", badge: cartCount },
        { href: "/orders", key: "nav.orders" },
        { href: "/receiving", key: "nav.receiving" },
        { href: "/invoices", key: "nav.invoices" },
        { href: "/eta-compliance", key: "nav.eta" },
        { href: "/financing", key: "nav.financing" },
        { href: "/analytics", key: "nav.analytics" },
        { href: "/settings", key: "nav.settings" },
      ];
    case "supplier_manager":
      return [
        { href: "/supplier-central", key: "nav.central" },
        { href: "/supplier-central/catalog", key: "nav.catalog" },
        { href: "/supplier-central/orders", key: "nav.ordersSup" },
        { href: "/invoices", key: "nav.invoices" },
        { href: "/eta-compliance", key: "nav.eta" },
        { href: "/settings", key: "nav.settings" },
      ];
    case "partner_officer":
      return [
        { href: "/financing", key: "nav.financing" },
        { href: "/settings", key: "nav.settings" },
      ];
    case "carrier":
      return [
        { href: "/deliveries", key: "nav.deliveries" },
        { href: "/eta-compliance", key: "nav.eta" },
        { href: "/settings", key: "nav.settings" },
      ];
    case "platform_admin":
      return [
        { href: "/admin", key: "nav.overview" },
        { href: "/admin/tenants", key: "nav.tenants" },
        { href: "/admin/users", key: "nav.users" },
        { href: "/admin/rules", key: "nav.rules" },
        { href: "/admin/audit", key: "nav.audit" },
        { href: "/settings", key: "nav.settings" },
      ];
  }
}

export function homeFor(role: Role): string {
  switch (role) {
    case "supplier_manager":
      return "/supplier-central";
    case "partner_officer":
      return "/financing";
    case "carrier":
      return "/deliveries";
    case "platform_admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

function LangThemeControls({ compact }: { compact?: boolean }) {
  const { lang, setLang, theme, toggleTheme } = usePrefs();
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className="flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-ink-200 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="language"
      >
        <IcGlobe className="text-base" />
        <span>{lang === "en" ? "عربي" : "EN"}</span>
      </button>
      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded text-ink-200 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="theme"
      >
        {theme === "dark" ? <IcSun className="text-base" /> : <IcMoon className="text-base" />}
      </button>
      {!compact ? null : null}
    </div>
  );
}

export function ToastHost() {
  const { toasts } = useApp();
  const { t } = usePrefs();
  void t;
  return (
    <div className="pointer-events-none fixed bottom-4 start-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rtl:translate-x-1/2 flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`anim-rise pointer-events-auto flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.tone === "ok"
              ? "border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : toast.tone === "warn"
                ? "border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                : "border-red-600/30 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          <IcCheck className="mt-0.5 shrink-0" />
          <span className="leading-snug">{toast.msg}</span>
        </div>
      ))}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !user) window.location.href = "/login";
  }, [ready, user]);
  if (!user) return null;
  return <>{children}</>;
}

export function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useApp();
  const { t } = usePrefs();
  if (user && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<IcLock />}
          title={t("guard.t")}
          sub={t("guard.sub")}
          action={
            <Link href="/login">
              <Btn variant="outline" size="sm">{t("guard.toLogin")}</Btn>
            </Link>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}

export default function AppShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const { t } = usePrefs();
  const { user, cartCount, logout } = useApp();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = navFor(user.role, cartCount);

  return (
    <div className="sf-alt min-h-screen">
      {/* Top bar — black architectural surface */}
      <header className="sf-ink sticky top-0 z-40 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <button
            className="rounded p-2 text-ink-200 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t("nav.menu")}
          >
            <IcMenu className="text-xl" />
          </button>
          <Link href={homeFor(user.role)} className="flex items-center gap-2.5">
            <Logo className="h-8 w-8 text-white" />
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight">HotelsVendors</div>
              <div className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400 sm:block">
                {t("brand.tag")}
              </div>
            </div>
          </Link>
          <nav className="ms-6 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex [scrollbar-width:none]" aria-label="primary">
            {items.map((it) => {
              const isActive = active === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex h-16 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-brass-400"
                      : "text-ink-300 hover:text-white"
                  }`}
                >
                  {it.key === "nav.cart" ? <IcCart className="text-sm" /> : null}
                  {t(it.key)}
                  {it.badge ? (
                    <span className="tnum rounded-full bg-brass-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {it.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            {user.role !== "supplier_manager" && user.role !== "platform_admin" && user.role !== "partner_officer" && user.role !== "carrier" ? (
              <Link
                href="/cart"
                className="relative hidden h-9 w-9 items-center justify-center rounded text-ink-200 hover:bg-white/10 sm:flex"
                aria-label={t("nav.cart")}
              >
                <IcCart className="text-lg" />
                {cartCount > 0 ? (
                  <span className="tnum absolute -top-0.5 end-0 rounded-full bg-brass-500 px-1.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
            <LangThemeControls />
            <div className="hidden items-center gap-2.5 rounded bg-white/5 px-2.5 py-1.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-brass-500 text-[11px] font-bold text-white">
                {initials(user.name)}
              </span>
              <div className="leading-tight">
                <div className="text-[12px] font-semibold">{user.name}</div>
                <div className="text-[10px] text-ink-400">{t(`role.${user.role}`)}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("nav.signOut")}
              title={t("nav.signOut")}
            >
              <IcOut className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label={t("nav.close")} className="absolute inset-0 bg-ink-950/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[300px] flex-col bg-ink-950 p-4 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo className="h-7 w-7 text-white" />
                <span className="font-bold tracking-tight">HotelsVendors</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded p-2 text-ink-300 hover:bg-white/10" aria-label={t("nav.close")}>
                <IcX className="text-lg" />
              </button>
            </div>
            <div className="mb-4 rounded bg-white/5 px-3 py-2.5">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-ink-400">{t(`role.${user.role}`)}</div>
            </div>
            <nav className="flex-1 overflow-y-auto" aria-label="mobile">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded px-3 py-3 text-sm font-medium ${
                    active === it.href ? "bg-brass-500/15 text-brass-300" : "text-ink-200 hover:bg-white/5"
                  }`}
                >
                  {t(it.key)}
                  {it.badge ? (
                    <span className="tnum rounded-full bg-brass-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{it.badge}</span>
                  ) : null}
                </Link>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 rounded border border-white/15 px-3 py-3 text-sm font-medium text-ink-200 hover:bg-white/5"
            >
              <IcOut className="text-base" />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      ) : null}

      <main className="shell main-pad min-h-[calc(100vh-4rem)]">{children}</main>

      <footer className="sf-page border-t border-line py-6 dark:border-linedark">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-ink-400 sm:px-6">
          <span>HotelsVendors — {t("home.footK")}</span>
          <span>{t("home.rights")}</span>
        </div>
      </footer>
    </div>
  );
}
