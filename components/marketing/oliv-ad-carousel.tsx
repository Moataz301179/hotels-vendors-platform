"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, QrCode } from "lucide-react";
import { OlivLogo } from "@/components/partners/oliv-logo";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";

/**
 * Oliv Ad Carousel — Replaces the text-only marquee ticker in the hero section.
 *
 * Features:
 * - Image-based advertisement slides (not just text)
 * - Auto-playing Framer Motion transitions
 * - CTA button linking through the /api/v1/oliv/click route (which appends
 *   the referral code CHV000 as the `ref` param)
 * - QR code/barcode on each slide for mobile users to scan → opens Oliv
 *   registration page with CHV000 pre-filled
 * - RTL support + i18n translations
 */

interface OlivAdSlide {
  id: number;
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  ctaText: string;
  ctaHref: string;
  qrText: string;
}

// The Oliv click API route already injects referral code CHV000
const OLIV_CLICK_URL = "/api/v1/oliv/click?ref=CHV000";

// QR code that encodes the Oliv apply URL with referral code CHV000
const OLIV_APPLY_QR =
  "https://api.qrserver.com/v1/api/qr-code/?size=160x160&data=" +
  encodeURIComponent("https://oliv.finance/apply?ref=CHV000&source=hotelsvendors");

// Static slide skeleton — translatable strings are injected inside the component
const SLIDE_SKELETON: Omit<OlivAdSlide, "title" | "subtitle" | "badge" | "ctaText" | "qrText">[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1582192688549-e38c0329be50?w=1920&q=85",
    alt: "Business team reviewing financial documents",
    badgeColor: "var(--success)",
    ctaHref: OLIV_CLICK_URL,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1581091012933-6dc5ce5f532c?w=1920&q=85",
    alt: "Digital payment processing interface",
    badgeColor: "var(--accent-base)",
    ctaHref: OLIV_CLICK_URL,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1551288040-b9147c221ab3?w=1920&q=85",
    alt: "Warehouse and logistics operations",
    badgeColor: "var(--purple-base)",
    ctaHref: OLIV_CLICK_URL,
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1519052537548-9b1eba2f6f4f?w=1920&q=85",
    alt: "FRA-licensed financial institution branding",
    badgeColor: "var(--success)",
    ctaHref: OLIV_CLICK_URL,
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export function OlivAdCarousel() {
  const { t } = useTranslation("homepage");

  // Build slides with translated strings
  const SLIDES: OlivAdSlide[] = SLIDE_SKELETON.map((s) => {
    const num = s.id;
    return {
      ...s,
      title: t(`olivCarousel.slide${num}.title`),
      subtitle: t(`olivCarousel.slide${num}.subtitle`),
      badge: t(`olivCarousel.slide${num}.badge`),
      ctaText: t(`olivCarousel.slide${num}.ctaText`),
      qrText: t(`olivCarousel.slide${num}.qrText`),
    };
  });
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border will-change-transform"
      style={{
        borderColor: "rgba(var(--accent-base-rgb),0.25)",
        background: "linear-gradient(135deg, rgba(12,12,18,0.96) 0%, rgba(18,18,26,0.99) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(var(--accent-base-rgb),0.12)",
      }}
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="relative h-56 sm:h-64 md:h-72"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />

          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col md:flex-row items-center gap-4 md:gap-8 p-6 md:p-8">
            {/* Left: text + logo + CTA */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <OlivLogo size="sm" variant="dark" />
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: `${slide.badgeColor}20`,
                    color: slide.badgeColor,
                    borderColor: `${slide.badgeColor}40`,
                  }}
                >
                  {slide.badge}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                {slide.title}
              </h3>

              <p className="text-sm text-white/60 max-w-md leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={slide.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-lg transition-all group"
                  style={{ backgroundColor: slide.badgeColor, color: "var(--surface)", boxShadow: "0 0 0 0px transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${slide.badgeColor}40`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 0px transparent"; }}
                >
                  {slide.ctaText}
                  <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <span>Referral code:</span>
                <span className="font-mono font-semibold text-accent-base tracking-wider">CHV000</span>
              </div>
            </div>

            {/* Right: QR code / barcode */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="rounded-xl bg-white p-2 shadow-lg">
                <img
                  src={OLIV_APPLY_QR}
                  alt="QR code to apply on Oliv with referral code CHV000"
                  className="w-28 h-28 object-contain"
                  width={112}
                  height={112}
                />
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-medium text-white/80 mb-0.5 flex items-center gap-1">
                  <QrCode size={10} /> Scan to Apply
                </span>
                <span className="text-[9px] text-white/40 whitespace-pre-line">
                  {slide.qrText}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all z-10"
        aria-label="Previous ad"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all z-10"
        aria-label="Next ad"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot indicators + counter */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-accent-base" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-white/30 tabular-nums">
          {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
