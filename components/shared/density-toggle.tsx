"use client";

import { useEffect, useCallback } from "react";
import { createBrowserStore } from "../../lib/browser-storage";
import { Rows3, Rows2 } from "lucide-react";

const STORAGE_KEY = "hv_density";

type Density = "compact" | "comfortable";
const densityStore = createBrowserStore<Density>(STORAGE_KEY, "comfortable", (value) =>
  value === "compact" ? "compact" : "comfortable");

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

export function DensityToggle() {
  const density = densityStore.useValue();

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  const toggle = useCallback(() => {
    const next = density === "compact" ? "comfortable" : "compact";
    densityStore.update(() => next);
    applyDensity(next);
  }, [density]);

  return (
    <button
      onClick={toggle}
      className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-white/[0.05] transition-all hidden sm:flex"
      aria-label={`Switch to ${density === "compact" ? "comfortable" : "compact"} density`}
      title={density === "compact" ? "Comfortable spacing" : "Compact spacing"}
    >
      {density === "compact" ? <Rows3 size={18} /> : <Rows2 size={18} />}
    </button>
  );
}
