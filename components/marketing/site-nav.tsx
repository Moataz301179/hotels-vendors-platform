"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeModeToggle, getStoredMode } from "@/components/theme/mode-toggle";
import { useLanguage } from "@/lib/i18n/language-context";

interface DropdownItem {
  href: string;
  label: string;
  desc?: string;
}

interface NavGroup {
  label: string;
  items: DropdownItem[];
}

function getGroups(ar: boolean): NavGroup[] {
  return [
    { label: ar ? "المشتريات" : "Procurement", items: [
      { href: "/marketplace", label: ar ? "السوق" : "Marketplace", desc: ar ? "كتالوج الموردين والشراء الفندقي" : "Hospitality catalog & purchasing" },
      { href: "/rfq", label: "RFQ", desc: ar ? "اطلب وقارن عروض الموردين" : "Request & compare supplier quotes" },
      { href: "/orders", label: ar ? "الطلبات" : "Orders", desc: ar ? "دورة الطلب من الشراء إلى الاستلام" : "From purchase order to receiving" },
    ] },
    { label: ar ? "الظل الافتراضي" : "Virtual Shadow", items: [
      { href: "/intelligence", label: ar ? "مركز الإشارات" : "Signal Center", desc: ar ? "اكتشاف التسربات والفرص" : "Find leaks, needs & opportunities" },
      { href: "/intelligence/findings", label: ar ? "الاكتشافات" : "Findings", desc: ar ? "أدلة وتحليلات قابلة للتنفيذ" : "Evidence-backed findings" },
      { href: "/intelligence/opportunities", label: ar ? "الفرص" : "Opportunities", desc: ar ? "حوّل الإشارة إلى إجراء" : "Turn signals into action" },
    ] },
    { label: ar ? "رأس المال" : "Capital Signals", items: [
      { href: "/working-capital", label: ar ? "التدفق النقدي" : "Cashflow", desc: ar ? "رؤية احتياج السيولة" : "See working-capital needs" },
      { href: "/factoring-service", label: ar ? "إحالات التمويل" : "Funding Referrals", desc: ar ? "إحالة لمقدمي التمويل" : "Qualified external funding referrals" },
      { href: "/financing/oliv", label: "Oliv", desc: ar ? "شريك تمويل خارجي" : "External funding partner" },
    ] },
    { label: ar ? "الشبكة" : "Network", items: [
      { href: "/hotels/join", label: ar ? "للفنادق" : "For Hotels", desc: ar ? "المشتريات والمصروفات" : "Procurement & spend" },
      { href: "/suppliers/join", label: ar ? "للموردين" : "For Suppliers", desc: ar ? "الكتالوج والطلبات" : "Catalog & orders" },
      { href: "/shipping", label: ar ? "لشركات النقل" : "For Carriers", desc: ar ? "التسليم والتتبع" : "Delivery & ETA" },
    ] },
  ];
}

function DropdownMenu({ group, ar }: { group: NavGroup; ar: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className={`flex items-center gap-1 text-sm text-white/50 hover:text-[var(--accent-base)] transition-colors cursor-pointer bg-transparent border-0 font-sans ${ar ? "font-cairo" : ""}`}>
        {group.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-surface-1 border border-border-subtle rounded-xl shadow-2xl backdrop-blur-xl"
        >
          <div className="py-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col gap-0.5 px-4 py-2.5 hover:bg-white/[0.04] transition-colors ${ar ? "font-cairo" : ""}`}
              >
                <span className="text-sm text-white/80">{item.label}</span>
                {item.desc && (
                  <span className="text-xs text-white/35">{item.desc}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const groups = getGroups(ar);

  useEffect(() => {
    setTheme(getStoredMode());
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      setTheme(isLight ? "light" : "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Public navigation stays on the dark-charcoal brand surface.
  // The white wordmark remains readable on every page and theme state.
  const logoVariant = "light" as const;
  const textColor = "#ffffff";

  return (
    <nav className={`sticky top-0 left-0 right-0 z-50 flex min-h-[72px] items-center justify-between px-5 md:px-10 lg:px-12 py-3 border-b border-white/10 bg-[#232831] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] ${ar ? "font-cairo" : ""}`}>
      <Link href="/" className="flex min-w-fit items-center gap-3 shrink-0 rtl:order-last" dir="ltr">
        {/* Mobile: icon-only, smaller */}
        <BrandLogo variant={logoVariant} size="sm" showText={false} className="md:hidden" />
        {/* Desktop: icon + wordmark */}
        <span className="hidden md:flex items-center gap-2.5">
          <BrandLogo variant={logoVariant} size="md" showText={false} />
          <span className="font-semibold uppercase text-[15px] whitespace-nowrap text-white" style={{ letterSpacing: "0.16em", fontFamily: "var(--font-display), 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", color: textColor }}>
            Hotels Vendors
          </span>
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-7 overflow-x-auto">
        {groups.map((g) => (
          <DropdownMenu key={g.label} group={g} ar={ar} />
        ))}
        <Link
          href="/sandbox"
          className="text-sm text-white/50 hover:text-[var(--accent-base)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {ar ? "التمثيل الذكي" : "Sandbox"}
        </Link>
        <Link
          href="/pricing"
          className="text-sm text-white/50 hover:text-[var(--accent-base)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {ar ? "الأسعار" : "Pricing"}
        </Link>
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-3 rtl:order-first shrink-0">
        <LanguageSwitcher />
        <ThemeModeToggle variant="icon" />
        <Link
          href="/login"
          className="text-sm px-4 py-2 text-white/50 hover:text-[var(--accent-base)] transition-colors cursor-pointer bg-transparent font-sans"
        >
          {ar ? "تسجيل الدخول" : "Sign In"}
        </Link>
        <Link
          href="/register"
          className={`text-sm px-4 py-2 font-semibold cursor-pointer rounded-md bg-accent-base text-surface ${ar ? "font-cairo" : ""}`}
        >
          {ar ? "ابدأ الآن" : "Get Started"}
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-white/50 cursor-pointer bg-transparent border-0 p-2 flex-shrink-0 ml-auto"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 border-b border-border-subtle px-6 py-4 flex flex-col gap-4 md:hidden bg-surface-1">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-1">
              <span className="text-xs text-white/30 uppercase tracking-widest font-semibold">{g.label}</span>
              {g.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm text-white/50 hover:text-white pl-3 ${ar ? "font-cairo" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-3 px-1">
            <LanguageSwitcher />
            <ThemeModeToggle variant="icon" />
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="text-sm text-white/50 hover:text-white"
            >
              {ar ? "الأسعار" : "Pricing"}
            </Link>
          </div>
          <hr className="border-white/[0.06]" />
          <Link
            href="/sandbox"
            onClick={() => setOpen(false)}
            className="text-sm text-white/50 hover:text-white"
          >
            {ar ? "التمثيل الذكي" : "Sandbox"}
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-sm text-white/50 hover:text-white"
          >
            {ar ? "تسجيل الدخول" : "Sign In"}
          </Link>
        <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={`text-sm px-4 py-2 font-semibold rounded-md bg-accent-base text-surface text-center ${ar ? "font-cairo" : ""}`}
            >
            {ar ? "ابدأ الآن" : "Get Started"}
          </Link>
        </div>
      )}
    </nav>
  );
}
