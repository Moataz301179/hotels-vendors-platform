"use client";

import { useState, useEffect } from "react";

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://hotelsvendors.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="flex flex-col h-full">
      <p className="bento-label mb-3">PWA APP INSTALLATION</p>
      <p className="text-[#9a9696] text-xs font-light mb-4">
        Install Native Platform App
      </p>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-1"
          style={{ background: "#181916", border: "1px solid rgba(140,108,44,0.15)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 16L12 8M12 16L9 13M12 16L15 13" stroke="#8c6c2c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V16" stroke="#8c6c2c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {isInstalled ? (
          <div className="text-center">
            <p className="text-[#ce5112] text-sm font-medium">App Installed</p>
            <p className="text-[#9a9696] text-xs font-light mt-1">
              Running in standalone mode
            </p>
          </div>
        ) : (
          <>
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: "#8c6c2c", color: "#0f100e" }}
              >
                Install App
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: "#181916", color: "#ffffff", border: "1px solid rgba(140,108,44,0.20)" }}
              >
                {copied ? "Link Copied" : "Copy App Link"}
              </button>
            )}
            <p className="text-[#9a9696] text-xs font-light text-center max-w-[200px]">
              Add to home screen for native-like experience
            </p>
          </>
        )}
      </div>
    </div>
  );
}
