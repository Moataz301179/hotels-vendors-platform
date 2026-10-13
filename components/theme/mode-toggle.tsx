"use client";

import { Sun, Moon } from "lucide-react";
import { useCallback } from "react";
import { usePrefs } from "@/i18n/provider";

const STORAGE_KEY = "hv-theme-mode";

export function getStoredMode(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "light";
}

export function setThemeMode(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem("hv:theme", mode);
  } catch {
    // ignore
  }
  // Keep browser chrome aligned with the selected palette.
  const meta = document.getElementById("theme-color-meta") as HTMLMetaElement | null;
  if (meta) {
    meta.setAttribute("content", mode === "light" ? "#FFFFFF" : "#000000");
  }
}

export function initThemeMode() {
  const mode = getStoredMode();
  setThemeMode(mode);
  return mode;
}

interface ThemeModeToggleProps {
  variant?: "icon" | "button";
  className?: string;
}

export function ThemeModeToggle({ variant = "icon", className = "" }: ThemeModeToggleProps) {
  const { theme, setTheme } = usePrefs();
  const isLight = theme === "light";

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeMode(next);
  }, [theme, setTheme]);

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
          isLight
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
            : "bg-white/[0.06] text-white/70 hover:bg-white/[0.10] border-white/[0.08]"
        } ${className}`}
        aria-label="Toggle theme"
      >
        {isLight ? <Moon size={14} /> : <Sun size={14} />}
        <span className="hidden sm:inline">{isLight ? "Dark" : "Light"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors ${
        isLight
          ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          : "text-white/40 hover:text-white hover:bg-white/[0.06]"
      } ${className}`}
      aria-label="Toggle theme"
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
