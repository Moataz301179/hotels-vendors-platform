"use client";

import { useLanguage } from "./language-context";
import { useTranslation } from "./hooks/use-translation";
import { useCallback, type ReactNode } from "react";

export function I18nProvider({ children }: { children: ReactNode }) {
  useLanguage();
  return children;
}

export function usePrefs() {
  const { locale, setLocale, toggleLocale, dir, isRTL } = useLanguage();
  const { t } = useTranslation();
  return {
    lang: locale,
    t: useCallback(
      (key: string, fallback?: string) => {
        try {
          const val = t(key);
          return val !== key ? val : fallback || key;
        } catch {
          return fallback || key;
        }
      },
      [t]
    ),
    setLang: setLocale,
    toggleLang: toggleLocale,
    dir,
    isRTL,
  };
}
