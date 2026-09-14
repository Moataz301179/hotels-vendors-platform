"use client";

import { useEffect, useCallback, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  width?: string;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "w-full max-w-[480px]",
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Detail panel"}
        className={`relative ${width} h-full flex flex-col bg-canvas/95 backdrop-blur-xl border-l border-border-subtle shadow-2xl animate-slide-in-right`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
              )}
              {description && (
                <p className="text-xs text-foreground-muted mt-0.5 truncate">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
