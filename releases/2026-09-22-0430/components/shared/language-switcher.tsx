"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-foreground-tertiary hover:text-white hover:bg-white/5 border border-border-subtle hover:border-border-visible transition-colors"
      aria-label="Toggle language"
    >
      <Globe size={14} />
      <span className="uppercase">{locale === "en" ? "AR" : "EN"}</span>
    </button>
  );
}
