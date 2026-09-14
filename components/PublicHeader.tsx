"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { btnCls } from "./ui";
import { IcGlobe, IcMoon, IcSun, Logo } from "./icons";

export default function PublicHeader({ solid }: { solid?: boolean }) {
  const { t, lang, setLang, theme, toggleTheme } = usePrefs();
  const links = [
    { href: "/marketplace", label: t("nav.marketplace") },
    { href: "#flow", label: t("home.footProc") },
    { href: "#logistics", label: t("home.logK") },
    { href: "#financing", label: t("nav.financing") },
    { href: "/suppliers", label: t("nav.suppliers") },
  ];
  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        solid ? "sf-glass border-line dark:border-linedark" : "sf-ink border-white/10 text-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className={`h-8 w-8 ${solid ? "text-ink-950 dark:text-white" : "text-white"}`} />
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-tight">HotelsVendors</div>
            <div className={`mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.18em] sm:block ${solid ? "text-ink-500" : "text-ink-400"}`}>
              {t("brand.tag")}
            </div>
          </div>
        </Link>
        <nav className={`ms-8 hidden items-center gap-1 lg:flex`} aria-label="public">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded px-3 py-2 text-[13px] font-medium transition-colors ${
                solid
                  ? "text-ink-600 hover:bg-fog-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
                  : "text-ink-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className={`flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors ${
              solid ? "text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800" : "text-ink-300 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="language"
          >
            <IcGlobe className="text-base" />
            <span>{lang === "en" ? "عربي" : "EN"}</span>
          </button>
          <button
            onClick={toggleTheme}
            className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${
              solid ? "text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800" : "text-ink-300 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="theme"
          >
            {theme === "dark" ? <IcSun className="text-base" /> : <IcMoon className="text-base" />}
          </button>
          <Link href="/login" className={`${btnCls("accent", "sm")} ms-1.5 hidden h-10 sm:inline-flex`}>
            {t("nav.signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
