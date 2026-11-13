import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { messages, type Language, type MessageKey } from "./messages";

type LocaleValue = {
  language: Language;
  isRtl: boolean;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ initial = "en", children }: { initial?: Language; children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initial);
  const value = useMemo<LocaleValue>(() => ({
    language,
    isRtl: language === "ar",
    setLanguage,
    t: (key) => messages[language][key] ?? messages.en[key],
  }), [language]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is required");
  return value;
}
