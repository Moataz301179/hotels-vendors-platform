"use client";

import { useState, useEffect, useCallback } from "react";
import { Rows3, Rows2 } from "lucide-react";

const STORAGE_KEY = "hv_density";

type Density = "compact" | "comfortable";

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

export function DensityToggle() {
  const [density, setDensity] = useState<Density>("comfortable");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Density | null;
    const initial = saved === "compact" || saved === "comfortable" ? saved : "comfortable";
    setDensity(initial);
    applyDensity(initial);
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next = density === "compact" ? "comfortable" : "compact";
    setDensity(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyDensity(next);
  }, [density]);

  return (
    <button
      onClick={toggle}
      className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all hidden sm:flex"
      aria-label={`Switch to ${density === "compact" ? "comfortable" : "compact"} density`}
      title={density === "compact" ? "Comfortable spacing" : "Compact spacing"}
    >
      {mounted && density === "compact" ? <Rows3 size={18} /> : <Rows2 size={18} />}
    </button>
  );
}
