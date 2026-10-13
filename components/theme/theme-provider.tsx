"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";

export type AccentMode = "orange" | "lime";
function readAccent(): AccentMode {
  return localStorage.getItem("hv-accent-mode") === "lime" ? "lime" : "orange";
}
function subscribeAccent(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("hv-accent-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("hv-accent-change", listener);
  };
}

interface ThemeContextType {
  accent: AccentMode;
  setAccent: (mode: AccentMode) => void;
  toggleAccent: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  accent: "orange",
  setAccent: () => {},
  toggleAccent: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const accent = useSyncExternalStore(subscribeAccent, readAccent, () => "orange" as AccentMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  const setAccent = (mode: AccentMode) => {
    localStorage.setItem("hv-accent-mode", mode);
    window.dispatchEvent(new Event("hv-accent-change"));
    document.documentElement.setAttribute("data-accent", mode);
  };

  const toggleAccent = () => {
    const next = accent === "orange" ? "lime" : "orange";
    setAccent(next);
  };

  return (
    <ThemeContext.Provider value={{ accent, setAccent, toggleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
