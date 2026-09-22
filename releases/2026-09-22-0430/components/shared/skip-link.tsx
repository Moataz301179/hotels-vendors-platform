"use client";

import { useEffect, useState } from "react";

export function SkipLink() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-semibold focus:bg-accent-base focus:text-surface focus:outline-none focus:ring-2 focus:ring-accent-base/50 focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
