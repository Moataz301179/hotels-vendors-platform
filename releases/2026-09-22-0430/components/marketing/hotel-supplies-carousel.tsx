"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";

interface SupplyItem {
  id: number;
  label: string;
  color: string;
  href: string;
}

export function HotelSuppliesCarousel() {
  const { t } = useTranslation("homepage");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const supplies: SupplyItem[] = [
    { id: 1, label: t("supplies.linen"), color: "var(--accent-base)", href: "/marketplace?category=linen" },
    { id: 2, label: t("supplies.bathroom"), color: "var(--orange-base)", href: "/marketplace?category=bathroom" },
    { id: 3, label: t("supplies.kitchen"), color: "var(--purple-base)", href: "/marketplace?category=kitchen" },
    { id: 4, label: t("supplies.cleaning"), color: "var(--accent-base)", href: "/marketplace?category=cleaning" },
    { id: 5, label: t("supplies.furniture"), color: "var(--orange-base)", href: "/marketplace?category=furniture" },
    { id: 6, label: t("supplies.hvac"), color: "var(--purple-base)", href: "/marketplace?category=hvac" },
    { id: 7, label: t("supplies.bedding"), color: "var(--accent-base)", href: "/marketplace?category=bedding" },
    { id: 8, label: t("supplies.poolSpa"), color: "var(--orange-base)", href: "/marketplace?category=pool-spa" },
  ];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 320;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -amount : amount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 400);
    }
  };

  return (
    <section className="w-full py-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase border"
              style={{
                borderColor: "var(--border-accent)",
                background: "var(--accent-muted)",
                color: "var(--accent-base)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-base animate-pulse" />
              {t("supplies.badge")}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mt-2">
              {t("supplies.title")}
            </h2>
          </div>

          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-visible transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border-subtle text-foreground-muted hover:text-foreground hover:border-border-visible transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-px-1 pb-2 -mb-2"
        >
          {supplies.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="group flex-shrink-0 w-72 md:w-80 rounded-2xl border overflow-hidden bg-surface-1 transition-all duration-300 hover:scale-[1.03] hover:no-underline"
              style={{ borderColor: `${s.color}33` }}
            >
              <div
                className="h-40 flex items-center justify-center"
                style={{ background: `${s.color}15` }}
              >
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: s.color }}
                >
                  {s.label}
                </span>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">
                  {s.label}
                </div>
                <div className="text-xs text-foreground-secondary mt-0.5">
                  {t("supplies.shopCategory")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
