"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { common } from "@/lib/i18n/translations/common";
import { marketplace } from "@/lib/i18n/translations/marketplace";
import { checkout } from "@/lib/i18n/translations/checkout";
import { homepage } from "@/lib/i18n/translations/homepage";

const namespaces = {
  common,
  marketplace,
  checkout,
  homepage,
};

export type Namespace = keyof typeof namespaces;

export function useTranslation(ns: Namespace = "common") {
  const { locale } = useLanguage();

  const t = (key: string): string => {
    const lang = locale as "en" | "ar";
    const dict = namespaces[ns];
    const langDict = dict[lang] || dict.en;
    return (langDict as Record<string, string>)[key] || key;
  };

  return { t, locale };
}
