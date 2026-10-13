"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ar, en, type Dict } from "./dictionaries";

export type Lang = "en" | "ar";
export type Theme = "light" | "dark";

interface Prefs {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  dir: "ltr" | "rtl";
  t: (path: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<Prefs | null>(null);

const DICTS: Record<Lang, Dict> = { en, ar };

function resolve(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  // Hydrate preferences from browser storage after mount; these state updates are intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const l = localStorage.getItem("hv:lang");
      if (l === "ar" || l === "en") setLangState(l);
      const th = localStorage.getItem("hv:theme");
      if (th === "dark" || th === "light") setThemeState(th);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches)
        setThemeState("dark");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
    document.getElementById("theme-color-meta")?.setAttribute("content", theme === "dark" ? "#000000" : "#FFFFFF");
    try {
      localStorage.setItem("hv-theme-mode", theme);
    } catch { /* ignore */ }
  }, [lang, theme, ready]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("hv:lang", l);
    } catch { /* ignore */ }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("hv:theme", t);
      localStorage.setItem("hv-theme-mode", t);
    } catch { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      let s = resolve(DICTS[lang], path) ?? resolve(en, path) ?? path;
      if (params) {
        for (const [k, v] of Object.entries(params))
          s = s.split(`{${k}}`).join(String(v));
      }
      return s;
    },
    [lang]
  );

  const value = useMemo<Prefs>(
    () => ({
      lang,
      theme,
      setLang,
      setTheme,
      toggleTheme,
      dir: lang === "ar" ? "rtl" : "ltr",
      t,
    }),
    [lang, theme, setLang, setTheme, toggleTheme, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}
