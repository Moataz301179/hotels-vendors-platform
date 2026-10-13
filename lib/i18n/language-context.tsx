"use client";

import { createContext, useContext, useSyncExternalStore, useCallback, useEffect, type ReactNode } from "react";
import type { Locale } from "./translations";
import { isRTL } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "hv_locale";
function subscribeLocale(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("hv-locale-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("hv-locale-change", listener);
  };
}

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "ar" || saved === "en") return saved;
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getInitialLocale, () => "en" as Locale);

  const setLocale = useCallback((newLocale: Locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
      window.dispatchEvent(new Event("hv-locale-change"));
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRTL(newLocale) ? "rtl" : "ltr";
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ar" : "en");
  }, [locale, setLocale]);

  // Sync on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
    }
  }, [locale]);

  const value: LanguageContextValue = {
    locale,
    setLocale,
    toggleLocale,
    dir: isRTL(locale) ? "rtl" : "ltr",
    isRTL: isRTL(locale),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
