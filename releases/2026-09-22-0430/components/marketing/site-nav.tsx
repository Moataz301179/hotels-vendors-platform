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
    {
      label: ar ? "المنتجات" : "Products",
      items: [
        { href: "/marketplace", label: ar ? "السوق" : "Marketplace", desc: ar ? "تصفح موردي الفنادق والكتالوج" : "Browse hotel suppliers & catalog" },
        { href: "/#invo", label: "INVO", desc: ar ? "طبقة سوق الموردين" : "Vendor marketplace sub-layer" },
        { href: "/compliance", label: ar ? "الامتثال" : "Compliance", desc: ar ? "الفوترة الإلكترونية و FRA" : "ETA e-invoicing & FRA" },
      ],
    },
    {
      label: ar ? "التمويل" : "Financing",
      items: [
        { href: "/factoring-service", label: ar ? "تمويل الفواتير" : "Invoice Factoring", desc: ar ? "تمويل فواتير غير ارتجاعي" : "Non-recourse invoice financing" },
        { href: "/financing/oliv", label: "Oliv " + (ar ? "التمويل" : "Financing"), desc: ar ? "خط ائتمان يصل إلى 10 مليون ج.م" : "Up to EGP 10M credit line" },
        { href: "/oliv/referral", label: "Oliv " + (ar ? "إحالة" : "Referral"), desc: ar ? "احصل على إحالة ومعالجة أولوية" : "Get referred & priority processing" },
      ],
    },
    {
      label: ar ? "الحلول" : "Solutions",
      items: [
        { href: "/hotels/join", label: ar ? "للفنادق" : "For Hotels", desc: ar ? "المشتريات وإدارة المصروفات" : "Procurement & spend management" },
        { href: "/suppliers/join", label: ar ? "للموردين" : "For Suppliers", desc: ar ? "اعرض منتجاتك واحصل على أموالك خلال 48 ساعة" : "List products & get paid in 48h" },
        { href: "/#how", label: ar ? "كيف تعمل" : "How It Works", desc: ar ? "نظرة عامة على المنصة وسير العمل" : "Platform overview & workflow" },
      ],
    },
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
      <button className={`flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-sans ${ar ? "font-cairo" : ""}`}>
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

  const isLight = theme === "light";
  const logoVariant = isLight ? "dark" : "light";
  const textColor = isLight ? "var(--foreground)" : "var(--foreground)";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border-subtle bg-canvas/90 backdrop-blur-xl ${ar ? "font-cairo" : ""}`}>
      <Link href="/" className="flex items-center gap-2.5 shrink-0 rtl:order-last" dir="ltr">
        {/* Mobile: icon-only, smaller */}
        <BrandLogo variant={logoVariant} size="sm" showText={false} className="md:hidden" />
        {/* Desktop: icon + wordmark */}
        <span className="hidden md:flex items-center gap-2.5">
          <BrandLogo variant={logoVariant} size="md" showText={false} />
          <span className="font-semibold uppercase text-[15px]" style={{ letterSpacing: "0.2em", fontFamily: "var(--font-display), 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", color: textColor }}>
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
          className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {ar ? "التمثيل الذكي" : "Sandbox"}
        </Link>
        <Link
          href="/pricing"
          className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
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
          className="text-sm px-4 py-2 text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent font-sans"
        >
          {ar ? "تسجيل الدخول" : "Sign In"}
        </Link>
        <Link
          href="/register"
          className={`text-sm px-4 py-2 font-semibold cursor-pointer rounded-md bg-accent-base text-surface ${ar ? "font-cairo" : ""}`}
        >
          {ar ? "جرّب التجربة" : "Try the Demo"}
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
            {ar ? "جرّب التجربة" : "Try the Demo"}
          </Link>
        </div>
      )}
    </nav>
  );
}
