"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentMode = "orange" | "lime";

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
  const [accent, setAccentState] = useState<AccentMode>("orange");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("hv-accent-mode") as AccentMode | null;
    if (saved === "lime" || saved === "orange") {
      setAccentState(saved);
      document.documentElement.setAttribute("data-accent", saved);
    } else {
      document.documentElement.setAttribute("data-accent", "orange");
    }
  }, []);

  const setAccent = (mode: AccentMode) => {
    setAccentState(mode);
    localStorage.setItem("hv-accent-mode", mode);
    document.documentElement.setAttribute("data-accent", mode);
  };

  const toggleAccent = () => {
    const next = accent === "orange" ? "lime" : "orange";
    setAccent(next);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ accent, setAccent, toggleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
