"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "hv-cookie-consent";

type ConsentLevel = "essential" | "analytics" | "all";

interface ConsentState {
  level: ConsentLevel;
  timestamp: number;
}

function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function storeConsent(level: ConsentLevel) {
  const state: ConsentState = { level, timestamp: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = (level: ConsentLevel) => {
    storeConsent(level);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9998] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-border-subtle bg-surface-1/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-white font-medium mb-1">
              We use cookies to improve your experience
            </p>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Essential cookies keep the platform secure. Analytics cookies help
              us understand usage. You can choose which to accept.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => accept("essential")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle text-foreground-tertiary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Essential Only
            </button>
            <button
              onClick={() => accept("analytics")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle text-foreground-tertiary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              + Analytics
            </button>
            <button
              onClick={() => accept("all")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-base text-surface hover:bg-accent-light transition-colors cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
