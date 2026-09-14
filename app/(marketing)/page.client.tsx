"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { OlivAdCarousel } from "@/components/marketing/oliv-ad-carousel";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  FileText,
  CheckCircle2,
  Truck,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Package,
  MapPin,
  Building2,
  Search,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   COUNT-UP ANIMATION (stat counters)
   ────────────────────────────────────────────────────────────── */
function useCountUp(end: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Robust animation: start on mount (after a tick so the DOM is present) and
    // ALWAYS settle on the real end value, even if IntersectionObserver never
    // fires (e.g. reduced-motion, headless, or observer quirks). Serving a stuck
    // "0+" reads as placeholders — the end value must be guaranteed.
    let raf = 0;
    let settled = false;
    const run = (startNow: number) => {
      const tick = (now: number) => {
        const p = Math.min((now - startNow) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * end));
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          settled = true;
          setValue(end);
        }
      };
      tick(startNow);
    };

    const startWhenVisible = (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && !started.current) {
        started.current = true;
        run(performance.now());
      }
    };

    const startTimer = window.setTimeout(() => {
      // If the observer hasn't kicked in yet, start the animation anyway so the
      // numbers never remain at 0.
      if (!started.current) {
        started.current = true;
        run(performance.now());
      }
    }, 300);

    const el = ref.current;
    let obs: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      obs = new IntersectionObserver(startWhenVisible, { threshold: 0.1 });
      obs.observe(el);
    }

    const forceSettle = window.setTimeout(() => {
      if (!settled) setValue(end);
    }, duration + 400);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(startTimer);
      window.clearTimeout(forceSettle);
      obs?.disconnect();
    };
  }, [end, duration]);

  return { value, ref };
}

function StatCounter({ end, suffix, label }: { end: number; suffix?: string; label: string }) {
  const { value, ref } = useCountUp(end);
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-foreground" ref={ref}>
        {value}
        {suffix}
      </div>
      <div className="text-[11px] md:text-xs text-foreground-secondary mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SCROLL ANIMATION HOOK
   ────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".animate-on-scroll");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────── */
export default function MarketingPage() {
  useScrollReveal();
  const { t, locale } = useTranslation("homepage");
  const router = useRouter();
  const [layer, setLayer] = useState<"hv" | "invo">("hv");
  const [tab, setTab] = useState<"hotel" | "vendor" | "chat">("hotel");
  const [query, setQuery] = useState("");

  const ar = locale === "ar";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <main className="min-h-screen bg-canvas text-foreground font-sans">

      {/* ═══════════ HERO ═══════════ */}
      <section className="pt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
          {/* ── Mobile & Desktop: Oliv carousel replaces hero image on the right ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Text content */}
            <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wider uppercase mb-6 border animate-fade-in" style={{ borderColor: "var(--border-accent)", background: "var(--accent-muted)", color: "var(--accent-base)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-base animate-pulse" />
              {t("hero.badge")}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4 animate-fade-in-up">
              {t("hero.headline1")}<br />
              <span className="text-[#8a6d3b]">{t("hero.headline2")}</span>
            </h1>

            <p className="text-base md:text-lg max-w-xl leading-relaxed animate-fade-in-up animation-delay-100" style={{ color: "rgba(var(--hero-text-rgb), 0.8)" }}>
              {t("hero.subtitle")}
            </p>

            {/* Interactive search bar — app-like entry point */}
            <form onSubmit={handleSearch} className="flex items-stretch gap-2 max-w-xl mx-auto mb-8 animate-fade-in-up animation-delay-150">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 text-white/40 ${ar ? "right-3" : "left-3"}`} size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  className={`w-full h-12 rounded-lg bg-surface-1 border border-white/10 text-foreground text-sm placeholder:text-white/40 outline-none focus:border-accent-base/50 transition-colors ${ar ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 rounded-lg bg-accent-base text-surface text-sm font-semibold hover:bg-accent-light transition-colors shrink-0"
              >
                {t("hero.search")}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in-up animation-delay-200">
              <span className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: "var(--border-accent)", color: "var(--accent-base)", background: "var(--accent-muted)" }}>ETA</span>
              <span className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: "var(--orange-muted)", color: "var(--orange-base)", background: "var(--orange-muted)" }}>FRA</span>
              <span className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: "var(--purple-muted)", color: "var(--purple-base)", background: "var(--purple-muted)" }}>ISO 27001</span>
              <span className="px-3 py-1 rounded-full border text-xs font-medium" style={{ borderColor: "var(--border-accent)", color: "var(--accent-base)", background: "var(--accent-muted)" }}>{t("hero.freeToStart")}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 animate-fade-in-up animation-delay-300">
              <Link href="/register" className="text-sm px-8 py-3.5 font-semibold rounded-lg inline-flex items-center justify-center gap-2 bg-accent-base text-surface hover:bg-accent-light transition-colors">
                {t("hero.startFree")}
                <svg className={ar ? "rotate-180" : ""} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <Link href="/sandbox" className="text-sm px-8 py-3.5 font-semibold rounded-lg border inline-flex items-center justify-center gap-2 bg-surface-1 hover:bg-surface-2 transition-colors" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                {t("hero.exploreSandbox")}
              </Link>
            </div>

            {/* Animated stat counters — visible on all screen sizes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 max-w-3xl mx-auto mt-12 pt-8 border-t border-white/5 animate-fade-in-up animation-delay-400">
              <StatCounter end={200} suffix="+" label={t("hero.stats.hotels")} />
              <StatCounter end={1200} suffix="+" label={t("hero.stats.suppliers")} />
              <StatCounter end={2} suffix="B" label={t("hero.stats.gmv")} />
              <StatCounter end={48} suffix="h" label={t("hero.stats.delivery")} />
            </div>
          </div>

          {/* Right: Oliv Ad Carousel (replaces hero image) */}
          <div className="mt-12 lg:mt-0 animate-fade-in-up animation-delay-200">
            <OlivAdCarousel />
          </div>
        </div>
      </div>

        {/* ═══════════ HERO IMAGE (below the fold, full-width on all screens) ═══════════ */}
        <div className="w-full px-6 md:px-12 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
              <img
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80&fm=webp"
                alt="Premium hotel lobby and reception"
                className="w-full h-48 sm:h-64 md:h-80 object-cover object-center"
                width={1920}
                height={1080}
              />
              {/* Gradient overlay for text legibility below */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(12,12,18,0.95) 100%)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR — Client Logos ═══════════ */}
      <section className="py-8 border-y border-border-invisible bg-surface-2">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs text-foreground-muted uppercase tracking-widest mb-6">
            {t("trust.label")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-30">
            {["Mövenpick", "IHG", "Sofitel", "Marriott", "Hilton", "Kempinski"].map((name) => (
              <span key={name} className="text-sm md:text-base font-semibold tracking-wider uppercase text-foreground-tertiary">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="relative py-14 animate-on-scroll">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: t("pricing.free.price"), label: t("stats.free.label"), color: "var(--accent-base)" },
            { value: "1%", label: t("stats.bank.label"), color: "var(--orange-base)" },
            { value: "1.5–3%", label: t("stats.factoring.label"), color: "var(--purple-base)" },
            { value: "48h", label: t("stats.payout.label"), color: "var(--accent-base)" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl mb-1 font-semibold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-foreground-muted leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PRODUCT SHOWCASE ═══════════ */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14 animate-on-scroll">
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--orange-base)" }}>
            {t("products.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl mt-3 mb-3 text-foreground font-semibold">
            {t("products.title")}
          </h2>
          <p className="text-foreground-secondary text-base max-w-xl mx-auto text-balance">
            {t("products.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { img: "photo-1616627547584-bf28cee262db", name: t("products.linen.name"), price: t("products.linen.price"), color: "var(--accent-base)" },
            { img: "photo-1564540583246-934409427776", name: t("products.bathroom.name"), price: t("products.bathroom.price"), color: "var(--orange-base)" },
            { img: "photo-1556909114-f6e7ad7d3136", name: t("products.kitchen.name"), price: t("products.kitchen.price"), color: "var(--purple-base)" },
            { img: "photo-1585421514284-efb74c2b69ba", name: t("products.cleaning.name"), price: t("products.cleaning.price"), color: "var(--accent-base)" },
            { img: "photo-1524758631624-e2822e304c36", name: t("products.furniture.name"), price: t("products.furniture.price"), color: "var(--orange-base)" },
            { img: "photo-1581094794329-c8112a89af12", name: t("products.hvac.name"), price: t("products.hvac.price"), color: "var(--purple-base)" },
            { img: "photo-1631049307264-da0ec9d70304", name: t("products.bedding.name"), price: t("products.bedding.price"), color: "var(--accent-base)" },
            { img: "photo-1571896349842-33c89424de2d", name: t("products.spa.name"), price: t("products.spa.price"), color: "var(--orange-base)" },
          ].map((p) => (
            <div key={p.name} className="animate-on-scroll group">
              <div className="rounded-xl border overflow-hidden bg-surface-1 transition-all duration-300 hover:scale-[1.02]" style={{ borderColor: `${p.color}22` }}>
                <div className="relative h-36 overflow-hidden">
                  <img src={`https://images.unsplash.com/${p.img}?w=400&q=75&fm=webp`} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" width={400} height={144} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                </div>
                <div className="px-4 py-3">
                   <div className="text-sm font-semibold text-foreground mb-0.5">{p.name}</div>
                  <div className="text-xs" style={{ color: `${p.color}cc` }}>{p.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14 animate-on-scroll">
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--accent-base)" }}>
            {t("how.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl mt-3 mb-3 text-foreground font-semibold">
            {t("how.title")}
          </h2>
          <p className="text-foreground-secondary text-base max-w-2xl mx-auto text-balance">
            {t("how.subtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-5 stagger-children">
          {[
            { num: "01", color: "var(--accent-base)", title: t("how.step1.title"), desc: t("how.step1.desc") },
            { num: "02", color: "var(--orange-base)", title: t("how.step2.title"), desc: t("how.step2.desc") },
            { num: "03", color: "var(--purple-base)", title: t("how.step3.title"), desc: t("how.step3.desc") },
            { num: "04", color: "var(--accent-base)", title: t("how.step4.title"), desc: t("how.step4.desc") },
          ].map((s) => (
            <div key={s.num} className="animate-on-scroll">
              <div
                className="neon-card relative rounded-2xl border bg-surface-1 p-5 h-full flex flex-col"
                style={{ borderColor: `${s.color}33` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px 2px ${s.color}30, inset 0 0 20px 0px ${s.color}08`; e.currentTarget.style.borderColor = `${s.color}88`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${s.color}33`; }}
              >
                <div className="text-3xl mb-3 opacity-15 font-semibold" style={{ color: s.color }}>{s.num}</div>
                <div className="text-sm mb-2 font-medium" style={{ color: s.color }}>{s.title}</div>
                <p className="text-foreground-secondary text-xs leading-relaxed flex-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ DUAL LAYERS ═══════════ */}
      <section id="invo" className="py-24 border-y border-border-invisible">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 animate-on-scroll">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--purple-base)" }}>
              {t("dual.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 text-foreground">
              {t("dual.title")}
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto text-balance">
              {t("dual.subtitle")}
            </p>
          </div>

          {/* Layer switcher */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex border rounded-xl p-1 gap-1 bg-canvas" style={{ borderColor: "var(--border-accent)" }}>
              <button onClick={() => setLayer("hv")} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer" style={{ background: layer === "hv" ? "var(--accent-base)" : "transparent", color: layer === "hv" ? "var(--bg-canvas)" : "rgba(160,160,176,1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /></svg>
                HotelsVendors
              </button>
              <button onClick={() => setLayer("invo")} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer" style={{ background: layer === "invo" ? "var(--orange-base)" : "transparent", color: layer === "invo" ? "var(--bg-canvas)" : "rgba(160,160,176,1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                INVO
              </button>
            </div>
          </div>

          {/* HotelsVendors Layer */}
          {layer === "hv" && (
            <div className="grid md:grid-cols-2 gap-10 items-center rtl-reverse">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-widest uppercase mb-4" style={{ borderColor: "var(--border-accent)", color: "var(--accent-base)", background: "var(--accent-muted)" }}>
                  {t("hv.badge")}
                </div>
                <h3 className="text-3xl font-extrabold mb-4 text-foreground">
                  {t("hv.title")}
                </h3>
                <p className="text-foreground-secondary leading-relaxed mb-6">
                  {t("hv.desc")}
                </p>
                <ul className="flex flex-col gap-3">
                  {[
                    t("hv.feature1"),
                    t("hv.feature2"),
                    t("hv.feature3"),
                    t("hv.feature4"),
                    t("hv.feature5"),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground" dir={ar ? "rtl" : "ltr"}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>{item}</li>
                  ))}
                </ul>
                <Link href="/marketplace" className="mt-8 font-semibold gap-2 cursor-pointer rounded-lg text-sm px-6 py-3 inline-flex items-center bg-accent-base text-surface hover:bg-accent-light transition-colors">
                  {t("hv.cta")} <svg className={ar ? "rotate-180" : ""} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border-accent)", boxShadow: "0 0 40px 2px var(--accent-glow)" }}>
                <img src="https://images.unsplash.com/photo-1646645409452-866ad2fb64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Hotel procurement dashboard" className="w-full h-72 object-cover opacity-70" width={1080} height={400} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl border backdrop-blur-sm" style={{ borderColor: "var(--border-accent)", background: "rgba(0,0,0,0.75)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-base)" }}>app.hotelsvendors.com/hotel/dashboard</div>
                  <div className="text-sm font-semibold text-foreground">{t("hv.cardTitle")}</div>
                </div>
              </div>
            </div>
          )}

          {/* INVO Layer */}
          {layer === "invo" && (
            <div className="grid md:grid-cols-2 gap-10 items-center rtl-reverse">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-widest uppercase mb-4" style={{ borderColor: "var(--orange-muted)", color: "var(--orange-base)", background: "var(--orange-base)10" }}>
                  {t("invo.badge")}
                </div>
                <h3 className="text-3xl font-extrabold mb-4 text-foreground">
                  {t("invo.title")}
                </h3>
                <p className="text-foreground-secondary leading-relaxed mb-6">
                  {t("invo.desc")}
                </p>
                <ul className="flex flex-col gap-3">
                  {[
                    t("invo.feature1"),
                    t("invo.feature2"),
                    t("invo.feature3"),
                    t("invo.feature4"),
                    t("invo.feature5"),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground" dir={ar ? "rtl" : "ltr"}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--orange-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>{item}</li>
                  ))}
                </ul>
                <Link href="/marketplace" className="mt-8 font-semibold gap-2 cursor-pointer rounded-lg text-sm px-6 py-3 inline-flex items-center bg-orange-base text-surface hover:bg-[#a68b5a] transition-colors">
                  {t("invo.cta")} <svg className={ar ? "rotate-180" : ""} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: "var(--orange-base)33", boxShadow: "0 0 40px 2px var(--orange-base)18" }}>
                <img src="https://images.unsplash.com/photo-1690935986319-c11e6cae84f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="INVO vendor marketplace" className="w-full h-72 object-cover opacity-70" width={1080} height={400} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl border backdrop-blur-sm" style={{ borderColor: "var(--orange-muted)", background: "rgba(0,0,0,0.75)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--orange-base)" }}>app.hotelsvendors.com/invo/marketplace</div>
                  <div className="text-sm font-semibold text-foreground">{t("invo.cardTitle")}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ AI AGENTS ═══════════ */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14 animate-on-scroll">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--orange-base)" }}>
            {t("ai.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 text-foreground">
            {t("ai.title")}
          </h2>
          <p className="text-foreground-secondary text-lg max-w-2xl mx-auto text-balance">
            {t("ai.subtitle")}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 stagger-children">
          {[
            { color: "var(--accent-base)", title: t("ai.onboarding.title"), desc: t("ai.onboarding.desc") },
            { color: "var(--purple-base)", title: t("ai.forecast.title"), desc: t("ai.forecast.desc") },
            { color: "var(--orange-base)", title: t("ai.compliance.title"), desc: t("ai.compliance.desc") },
            { color: "var(--accent-base)", title: t("ai.factoring.title"), desc: t("ai.factoring.desc") },
            { color: "var(--purple-base)", title: t("ai.chatbot.title"), desc: t("ai.chatbot.desc") },
            { color: "var(--orange-base)", title: t("ai.integration.title"), desc: t("ai.integration.desc") },
          ].map((a) => (
            <div key={a.title} className="animate-on-scroll">
              <div
                className="neon-card rounded-2xl border bg-surface-1 p-5 h-full"
                style={{ borderColor: `${a.color}33` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px 2px ${a.color}30, inset 0 0 20px 0px ${a.color}08`; e.currentTarget.style.borderColor = `${a.color}88`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${a.color}33`; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 border" style={{ background: `${a.color}15`, borderColor: `${a.color}40`, color: a.color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                </div>
                <div className="font-semibold text-sm mb-2 text-foreground">{a.title}</div>
                <p className="text-foreground-secondary text-xs leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ DEMO SANDBOX ═══════════ */}
      <section className="py-20 border-y border-border-invisible">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10 animate-on-scroll">
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--accent-base)" }}>
              {t("sandbox.badge")}
            </span>
            <h2 className="text-3xl md:text-4xl mt-3 mb-3 text-foreground font-semibold">
              {t("sandbox.title")}
            </h2>
            <p className="text-foreground-secondary text-sm max-w-xl mx-auto">
              {t("sandbox.subtitle")}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8 flex-wrap gap-2">
            {([
              { key: "hotel" as const, label: t("sandbox.tab1"), color: "var(--accent-base)" },
              { key: "vendor" as const, label: t("sandbox.tab2"), color: "var(--orange-base)" },
              { key: "chat" as const, label: t("sandbox.tab3"), color: "var(--purple-base)" },
            ]).map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border"
                style={{
                  background: tab === tb.key ? tb.color : "transparent",
                  color: tab === tb.key ? "var(--bg-canvas)" : "rgba(160,160,176,1)",
                  borderColor: tab === tb.key ? tb.color : `${tb.color}33`,
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* Hotel Dashboard Tab */}
          {tab === "hotel" && (
            <div className="rounded-2xl border overflow-hidden bg-canvas" style={{ borderColor: "var(--border-accent)", boxShadow: "0 0 40px 2px var(--accent-glow)" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-surface-1/60">
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#ff5f57" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#febc2e" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "var(--accent-base)" }} />
                <div className="flex-1 mx-4 bg-canvas/50 rounded px-3 py-1 text-xs text-foreground-secondary border border-border-subtle/50 font-mono">app.hotelsvendors.com/hotels/dashboard</div>
              </div>
              <div className="p-6 min-h-[440px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{t("hotel.title")}</h3>
                    <p className="text-foreground-secondary text-sm">{t("hotel.subtitle")} <span style={{ color: "var(--accent-base)" }}>{t("hotel.savings")}</span></p>
                  </div>
                  <button className="text-sm px-4 py-2 font-semibold cursor-pointer rounded-md inline-flex items-center gap-1 bg-accent-base text-surface">{t("hotel.aiAssist")}</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: t("hotel.activeOrders"), value: "34", color: "var(--accent-base)", sub: "+8%" },
                    { label: t("hotel.monthlySpend"), value: "EGP 182K", color: "var(--orange-base)", sub: `${t("overview.forecast")} EGP 168K` },
                    { label: t("hotel.vendorNetwork"), value: "47", color: "var(--purple-base)", sub: "via INVO" },
                    { label: t("hotel.factoringRequests"), value: "6", color: "var(--accent-base)", sub: t("hotel.factoringPending") },
                  ].map((c) => (
                    <div key={c.label} className="rounded-xl border bg-surface-1 p-4" style={{ borderColor: `${c.color}33` }}>
                      <div className="text-xs text-foreground-secondary mb-1">{c.label}</div>
                      <div className="text-2xl font-semibold text-foreground">{c.value}</div>
                      <div className="text-xs mt-1" style={{ color: c.color }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border bg-surface-1 overflow-hidden" style={{ borderColor: "var(--border-accent)" }}>
                  <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{t("hotel.recentOrders")}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border-accent)", color: "var(--accent-base)" }}>{t("hotel.allVerified")}</span>
                  </div>
                  {[
                    { vendor: "Luxe Linen Co.", item: t("hotel.sheetItem"), price: "EGP 14,400", status: t("overview.delivered"), color: "var(--accent-base)" },
                    { vendor: "ProClean Supplies", item: t("hotel.amenityItem"), price: "EGP 3,250", status: t("overview.inTransit"), color: "var(--orange-base)" },
                    { vendor: "GourmetSource", item: t("hotel.coffeeItem"), price: "EGP 2,100", status: t("overview.factoringActive"), color: "var(--purple-base)" },
                  ].map((o, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i < 2 ? "border-b border-border-invisible" : ""}`}>
                      <div><div className="font-medium text-foreground">{o.vendor}</div><div className="text-foreground-secondary text-xs">{o.item}</div></div>
                      <div className="text-right"><div className="font-semibold text-foreground">{o.price}</div><div className="text-xs" style={{ color: o.color }}>{o.status}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vendor Tab */}
          {tab === "vendor" && (
            <div className="rounded-2xl border overflow-hidden bg-canvas" style={{ borderColor: "var(--orange-muted)", boxShadow: "0 0 40px 2px var(--orange-base)14" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-surface-1/60">
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#ff5f57" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#febc2e" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "var(--accent-base)" }} />
                <div className="flex-1 mx-4 bg-canvas/50 rounded px-3 py-1 text-xs text-foreground-secondary border border-border-subtle/50 font-mono">app.hotelsvendors.com/invo/marketplace</div>
              </div>
              <div className="p-6 min-h-[440px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{t("vendor.title")}</h3>
                    <p className="text-foreground-secondary text-sm">{t("vendor.aggregated")} · <span style={{ color: "var(--orange-base)" }}>{t("vendor.buyers")}</span></p>
                  </div>
                  <button className="text-sm px-4 py-2 font-semibold cursor-pointer rounded-md bg-orange-base text-surface">{t("vendor.listProducts")}</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: t("vendor.hotelBuyers"), value: "340", color: "var(--orange-base)" },
                    { label: "MRR", value: "EGP 94K", color: "var(--accent-base)" },
                    { label: t("vendor.avgOrder"), value: "EGP 2.8K", color: "var(--purple-base)" },
                    { label: t("vendor.reorderRate"), value: "74%", color: "var(--orange-base)" },
                  ].map((c) => (
                    <div key={c.label} className="rounded-xl border bg-surface-1 p-4" style={{ borderColor: `${c.color}33` }}>
                      <div className="text-xs text-foreground-secondary mb-1">{c.label}</div>
                      <div className="text-2xl font-semibold text-foreground">{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border bg-surface-1 overflow-hidden" style={{ borderColor: "var(--orange-base)22" }}>
                  <div className="px-4 py-3 border-b border-border-subtle font-semibold text-sm text-foreground">{t("vendor.topProducts")}</div>
                  {[
                    { name: t("vendor.cottonSheet"), units: t("vendor.unitsSold"), revenue: "EGP 120K", badge: true },
                    { name: t("vendor.duvetSet"), units: t("vendor.duvetSold"), revenue: "EGP 74K", badge: false },
                    { name: t("vendor.poolTowel"), units: t("vendor.towelSold"), revenue: "EGP 34K", badge: true },
                  ].map((p, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i < 2 ? "border-b border-border-invisible" : ""}`}>
                      <div><div className="font-medium text-foreground">{p.name}</div><div className="text-foreground-secondary text-xs">{p.units}</div></div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold" style={{ color: "var(--accent-base)" }}>{p.revenue}</span>
                        {p.badge && <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--orange-base)55", color: "var(--orange-base)" }}>⚡ 48h</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {tab === "chat" && (
            <div className="rounded-2xl border overflow-hidden bg-canvas" style={{ borderColor: "var(--purple-muted)", boxShadow: "0 0 40px 2px var(--purple-base)14" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-surface-1/60">
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#ff5f57" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "#febc2e" }} />
                <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: "var(--accent-base)" }} />
                <div className="flex-1 mx-4 bg-canvas/50 rounded px-3 py-1 text-xs text-foreground-secondary border border-border-subtle/50 font-mono">app.hotelsvendors.com/ai-agent</div>
              </div>
              <div className="p-6 min-h-[440px] flex flex-col">
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl border" style={{ borderColor: "var(--purple-base)33", background: "var(--purple-base)08" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--purple-base)20", color: "var(--purple-base)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{t("chat.agentTitle")}</div>
                    <div className="text-xs text-foreground-secondary">{t("chat.agentSubtitle")}</div>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent-base)" }} />
                </div>
                <div className="flex-1 flex flex-col gap-4 overflow-auto mb-4">
                  <div className="flex justify-start">
                    <div dir={ar ? "rtl" : "ltr"} className="max-w-xs rounded-2xl rounded-tl-none p-3 text-sm text-foreground" style={{ background: "var(--purple-base)18", border: "1px solid var(--purple-base)33" }}>
                      {t("chat.welcome")}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div dir={ar ? "rtl" : "ltr"} className="max-w-xs rounded-2xl rounded-tr-none p-3 text-sm bg-surface-1 border border-border-subtle text-foreground">
                      {t("chat.userMessage1")}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div dir={ar ? "rtl" : "ltr"} className="max-w-sm rounded-2xl rounded-tl-none p-3 text-sm text-foreground" style={{ background: "var(--purple-base)18", border: "1px solid var(--purple-base)33" }}>
                      {t("chat.aiReply1")}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div dir={ar ? "rtl" : "ltr"} className="max-w-xs rounded-2xl rounded-tr-none p-3 text-sm bg-surface-1 border border-border-subtle text-foreground">
                      {t("chat.userMessage2")}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div dir={ar ? "rtl" : "ltr"} className="max-w-sm rounded-2xl rounded-tl-none p-3 text-sm text-foreground" style={{ background: "var(--purple-base)18", border: "1px solid var(--purple-base)33" }}>
                      {t("chat.aiReply2")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl border border-border-subtle bg-surface-1/50 px-4 py-2.5 text-sm text-foreground-secondary">{t("chat.inputPlaceholder")}</div>
                  <button className="text-sm px-4 py-2 font-semibold cursor-pointer rounded-md bg-[var(--purple-base)] text-surface">{t("chat.send")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ FACTORING ═══════════ */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center rtl-reverse">
          <div className="animate-on-scroll">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--orange-base)" }}>
              {t("factoring.badge")}
            </span>
            <h2 className="text-4xl font-extrabold mt-3 mb-4 text-balance text-foreground">
              {t("factoring.title")}
            </h2>
            <p className="text-foreground-secondary text-lg leading-relaxed mb-8">
              {t("factoring.desc")}
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                { color: "var(--accent-base)", text: t("factoring.step1") },
                { color: "var(--orange-base)", text: t("factoring.step2") },
                { color: "var(--purple-base)", text: t("factoring.step3") },
                { color: "var(--accent-base)", text: t("factoring.step4") },
                { color: "var(--orange-base)", text: t("factoring.step5") },
              ].map((s) => (
                <div key={s.text} className="flex items-center gap-3" dir={ar ? "rtl" : "ltr"}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0 text-xs font-semibold" style={{ borderColor: `${s.color}55`, color: s.color, background: `${s.color}10` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>
                  <div className="text-sm text-foreground">{s.text}</div>
                </div>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--orange-base)" }} dir={ar ? "rtl" : "ltr"}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {t("factoring.feeNote")}
            </div>
          </div>
          <div className="flex flex-col gap-4 animate-on-scroll">
            <div
              className="neon-card rounded-2xl border bg-surface-1 p-5"
              style={{ borderColor: "var(--orange-base)33" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 18px 2px var(--orange-base)30, inset 0 0 20px 0px var(--orange-base)08"; e.currentTarget.style.borderColor = "var(--orange-base)88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--orange-base)33"; }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">{t("factoring.requestLabel")} #F-2847</div>
                  <div className="font-semibold text-foreground">Luxe Linen Co.</div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--accent-muted)", color: "var(--accent-base)" }}>{t("factoring.active")}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="rounded-lg p-2 bg-canvas/60">
                  <div className="text-xl font-semibold" style={{ color: "var(--orange-base)" }}>EGP 14.4K</div>
                  <div className="text-xs text-foreground-secondary">{t("factoring.invoiceValue")}</div>
                </div>
                <div className="rounded-lg p-2 bg-canvas/60">
                  <div className="text-xl font-semibold" style={{ color: "var(--accent-base)" }}>$13.9K</div>
                  <div className="text-xs text-foreground-secondary">{t("factoring.disbursed")}</div>
                </div>
                <div className="rounded-lg p-2 bg-canvas/60">
                  <div className="text-xl font-semibold" style={{ color: "var(--purple-base)" }}>38h</div>
                  <div className="text-xs text-foreground-secondary">{t("factoring.timeToPay")}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  t("factoring.verified"),
                  t("factoring.approved"),
                  t("factoring.fraComplete"),
                  t("factoring.fundsDisbursed"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-foreground" dir={ar ? "rtl" : "ltr"}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6 9 17l-5-5" /></svg>{item}</div>
                ))}
              </div>
            </div>

            <div
              className="neon-card rounded-2xl border bg-surface-1 p-5"
              style={{ borderColor: "var(--purple-base)33" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 18px 2px var(--purple-base)30, inset 0 0 20px 0px var(--purple-base)08"; e.currentTarget.style.borderColor = "var(--purple-base)88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--purple-base)33"; }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--purple-base)" }}>{t("pricingTransparency.badge")}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-accent)" }}>
                  <div className="text-xl font-semibold" style={{ color: "var(--accent-base)" }}>1%</div>
                  <div className="text-xs text-foreground-secondary mt-0.5">{t("pricingTransparency.bankFee")}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--orange-base)33" }}>
                  <div className="text-xl font-semibold" style={{ color: "var(--orange-base)" }}>1.5–3%</div>
                  <div className="text-xs text-foreground-secondary mt-0.5">{t("pricingTransparency.factoringFee")}</div>
                </div>
              </div>
              <p className="text-xs text-foreground-secondary mt-3">{t("pricingTransparency.note")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ COMPLIANCE ═══════════ */}
      <section className="py-24 border-y border-border-invisible">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 animate-on-scroll">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--purple-base)" }}>
              {t("compliance.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 text-foreground">
              {t("compliance.title")}
            </h2>
            <p className="text-foreground-secondary text-lg max-w-2xl mx-auto text-balance">
              {t("compliance.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-12 stagger-children">
            {[
              { color: "var(--accent-base)", label: "ETA" },
              { color: "var(--orange-base)", label: "FRA" },
              { color: "var(--purple-base)", label: "ISO 27001" },
              { color: "var(--accent-base)", label: "PCI-DSS" },
              { color: "var(--orange-base)", label: "AML / KYC" },
              { color: "var(--purple-base)", label: "GDPR" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm animate-on-scroll" style={{ borderColor: `${b.color}55`, color: b.color, background: `${b.color}10` }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                {b.label}
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="neon-card rounded-2xl border bg-surface-1 p-5"
              style={{ borderColor: "var(--border-accent)" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 18px 2px rgba(var(--accent-base-rgb),0.19), inset 0 0 20px 0px rgba(var(--accent-base-rgb),0.03)"; e.currentTarget.style.borderColor = "rgba(var(--accent-base-rgb),0.53)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border-accent)"; }}
            >
              <div className="flex items-center gap-3 mb-3" dir={ar ? "rtl" : "ltr"}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ background: "var(--accent-muted)", borderColor: "var(--border-accent)", color: "var(--accent-base)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                </div>
                <div className="font-semibold text-foreground">{t("compliance.etaTitle")}</div>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {t("compliance.etaDesc")}
              </p>
            </div>
            <div
              className="neon-card rounded-2xl border bg-surface-1 p-5"
              style={{ borderColor: "var(--orange-base)33" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 18px 2px var(--orange-base)30, inset 0 0 20px 0px var(--orange-base)08"; e.currentTarget.style.borderColor = "var(--orange-base)88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--orange-base)33"; }}
            >
              <div className="flex items-center gap-3 mb-3" dir={ar ? "rtl" : "ltr"}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ background: "var(--orange-base)15", borderColor: "var(--orange-base)40", color: "var(--orange-base)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div className="font-semibold text-foreground">{t("compliance.fraTitle")}</div>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {t("compliance.fraDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14 animate-on-scroll">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent-base)" }}>
            {t("testimonials.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-3 text-foreground">
            {t("testimonials.title")}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {[
            { color: "var(--accent-base)", quote: t("testimonials.sophia.quote"), name: t("testimonials.sophia.name"), role: t("testimonials.sophia.role") },
            { color: "var(--orange-base)", quote: t("testimonials.carlos.quote"), name: t("testimonials.carlos.name"), role: t("testimonials.carlos.role") },
            { color: "var(--purple-base)", quote: t("testimonials.aisha.quote"), name: t("testimonials.aisha.name"), role: t("testimonials.aisha.role") },
          ].map((item) => (
            <div key={item.name} className="animate-on-scroll">
              <div
                className="neon-card rounded-2xl border bg-surface-1 p-5 h-full flex flex-col"
                style={{ borderColor: `${item.color}33` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px 2px ${item.color}30, inset 0 0 20px 0px ${item.color}08`; e.currentTarget.style.borderColor = `${item.color}88`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${item.color}33`; }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border mb-4" style={{ background: `${item.color}15`, borderColor: `${item.color}44`, color: item.color }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed flex-1 mb-5">{item.quote}</p>
                <div className="flex items-center gap-3">
                  <div><div className="font-semibold text-sm text-foreground">{item.name}</div><div className="text-xs text-foreground-secondary">{item.role}</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="py-24 border-y border-border-invisible">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 animate-on-scroll">
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--accent-base)" }}>
              {t("pricing.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 text-foreground">
              {t("pricing.title")}
            </h2>
            <p className="text-foreground-secondary text-lg">{t("pricing.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              { color: "var(--accent-base)", badge: t("pricing.free.badge"), title: t("pricing.free.title"), price: t("pricing.free.price"), unit: t("pricing.free.unit"), features: [t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3"), t("pricing.free.f4"), t("pricing.free.f5")] },
              { color: "var(--orange-base)", badge: t("pricing.bank.badge"), title: t("pricing.bank.title"), price: "1%", unit: t("pricing.bank.unit"), highlight: true, features: [t("pricing.bank.f1"), t("pricing.bank.f2"), t("pricing.bank.f3"), t("pricing.bank.f4"), t("pricing.bank.f5")] },
              { color: "var(--purple-base)", badge: t("pricing.factoring.badge"), title: t("pricing.factoring.title"), price: "1.5–3%", unit: t("pricing.factoring.unit"), features: [t("pricing.factoring.f1"), t("pricing.factoring.f2"), t("pricing.factoring.f3"), t("pricing.factoring.f4"), t("pricing.factoring.f5")] },
            ].map((p) => (
              <div key={p.title} className="animate-on-scroll">
                <div
                  className="neon-card rounded-2xl border bg-surface-1 p-5 flex flex-col h-full relative"
                  style={{ borderColor: `${p.color}33` }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px 2px ${p.color}30, inset 0 0 20px 0px ${p.color}08`; e.currentTarget.style.borderColor = `${p.color}88`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${p.color}33`; }}
                >
                  {p.highlight && <div className="absolute -top-3 left-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--orange-base)", color: "var(--bg-canvas)", transform: ar ? "translateX(50%)" : "translateX(-50%)" }}>{t("pricing.bank.highlight")}</div>}
                  <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: p.color }}>{p.badge}</div>
                  <div className="text-2xl font-semibold mb-1 text-foreground">{p.title}</div>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-foreground">{p.price}</span>
                    <span className="text-foreground-secondary pb-1 text-sm">{p.unit}</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1 mb-7">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground" dir={ar ? "rtl" : "ltr"}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6 9 17l-5-5" /></svg>{f}</li>
                    ))}
                  </ul>
                  <Link href="/register" className="w-full font-semibold cursor-pointer rounded-lg text-sm py-2.5 text-center block" style={{ background: p.color, color: "var(--bg-canvas)" }}>{t("pricing.cta")}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(to right, var(--accent-base) 1px, transparent 1px), linear-gradient(to bottom, var(--accent-base) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center animate-on-scroll">
          <div className="flex justify-center mb-6"><BrandLogo variant="dark" size="lg" showText={false} /></div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-balance leading-tight text-foreground">
            {t("cta.headline1")}<br /><span className="text-foreground">{t("cta.headline2")}</span>
          </h2>
          <p className="text-foreground-secondary text-lg mb-4 max-w-xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <p className="text-sm mb-10" style={{ color: "var(--orange-base)" }}>
            {t("cta.tagline")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="font-semibold px-10 py-3 cursor-pointer gap-2 text-base rounded-lg inline-flex items-center justify-center bg-accent-base text-surface hover:bg-accent-light transition-colors">
              {t("cta.startFree")}
            </Link>
            <Link href="/sandbox" className="font-semibold cursor-pointer text-base gap-2 rounded-lg border inline-flex items-center justify-center px-10 py-3 bg-surface-1 hover:bg-surface-2 transition-colors" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              {t("cta.bookDemo")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────
   SANDBOX CAROUSEL — Procurement flow: PO → Execution → Delivery → Payment
   ────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    step: 1,
    title: "Purchase Order",
    subtitle: "Hotel initiates procurement",
    color: "var(--accent-base)",
    icon: FileText,
    items: [
      { icon: ShoppingCart, text: "Browse supplier catalogs" },
      { icon: Building2, text: "Select items & quantities" },
      { icon: FileText, text: "Submit purchase order" },
    ],
    dashboard: {
      title: "New Purchase Order",
      table: [
        { item: "Premium Detergent (4×5L)", qty: "12 units", price: "EGP 4,200" },
        { item: "Cotton Bath Towels (500gsm)", qty: "200 pcs", price: "EGP 18,000" },
        { item: "Mineral Water (500ml×24)", qty: "50 cases", price: "EGP 3,750" },
      ],
      total: "EGP 25,950",
    },
  },
  {
    step: 2,
    title: "Execution",
    subtitle: "Supplier confirms & processes",
    color: "var(--orange-base)",
    icon: CheckCircle2,
    items: [
      { icon: CheckCircle2, text: "Supplier confirms order" },
      { icon: Package, text: "Picks & packs inventory" },
      { icon: FileText, text: "ETA e-invoice generated" },
    ],
    dashboard: {
      title: "Order Confirmed",
      table: [
        { item: "Order #HV-2026-0847", qty: "Status: Processing", price: "ETA UUID: ✓" },
        { item: "Supplier: CleanPro Egypt", qty: "Tier: Gold", price: "ETA Status: Accepted" },
        { item: "ETA Digital Signature", qty: "Verified", price: "Invoice #INV-4821" },
      ],
      total: "Payment guaranteed ✓",
    },
  },
  {
    step: 3,
    title: "Delivery",
    subtitle: "Logistics fulfills & ships",
    color: "var(--purple-base)",
    icon: Truck,
    items: [
      { icon: Truck, text: "Route optimization" },
      { icon: MapPin, text: "Real-time GPS tracking" },
      { icon: CheckCircle2, text: "Proof of delivery" },
    ],
    dashboard: {
      title: "Shipment Tracking",
      table: [
        { item: "Shipment #SHP-1192", qty: "Route: 6th Oct → Hurg", price: "ETA: 2h 15m" },
        { item: "Carrier: SwiftLog Egypt", qty: "Vehicle: Refrigerated", price: "Status: In Transit" },
        { item: "GPS Checkpoint 3/5", qty: "Cairo-Alex Rd.", price: "Temp: 4°C ✓" },
      ],
      total: "On-time delivery 98.2%",
    },
  },
  {
    step: 4,
    title: "Payment",
    subtitle: "Settlement & factoring",
    color: "#64b5f6",
    icon: CreditCard,
    items: [
      { icon: CreditCard, text: "Payment processed" },
      { icon: Building2, text: "Factoring liquidity" },
      { icon: CheckCircle2, text: "Revenue secured" },
    ],
    dashboard: {
      title: "Payment Settlement",
      table: [
        { item: "Invoice #INV-4821", qty: "Amount: EGP 25,950", price: "Status: Settled" },
        { item: "Platform Fee (2.5%)", qty: "EGP 648.75", price: "Deducted" },
        { item: "Factoring Spread", qty: "EGP 389.25", price: "To partner" },
      ],
      total: "Supplier paid: EGP 24,912",
    },
  },
];

export function SandboxCarousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { locale, isRTL } = useLanguage();
  const ar = locale === "ar";

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % STEPS.length), 6000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (dir: number) => {
    setActive((p) => (p + dir + STEPS.length) % STEPS.length);
    resetTimer();
  };

  const step = STEPS[active];

  return (
    <section className="py-20 border-y animate-on-scroll" style={{ borderColor: "var(--accent-glow)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--accent-base)" }}>Platform Demo</span>
          <h2 className="text-3xl md:text-4xl mt-3 mb-3 text-white font-medium">See It in Action</h2>
          <p className="text-foreground-secondary text-sm max-w-xl mx-auto">Follow a complete procurement cycle — from order placement to payment settlement.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.step}>
                {i > 0 && <div className="hidden sm:block w-8 h-px" style={{ background: i <= active ? step.color : "rgba(255,255,255,0.08)" }} />}
                <button
                  onClick={() => { setActive(i); resetTimer(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: i === active ? `${s.color}15` : "transparent",
                    border: i === active ? `1px solid ${s.color}33` : "1px solid transparent",
                    color: i === active ? s.color : "rgba(255,255,255,0.3)",
                  }}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Main card */}
        <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: `${step.color}44`, boxShadow: `0 0 50px 4px ${step.color}10` }}>
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-surface-1/80">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: step.color }} />
            <div className="flex-1 mx-4 bg-canvas/50 rounded px-3 py-1 text-xs text-foreground-muted border border-border-subtle/50">
              app.hotelsvendors.com — Step {step.step}: {step.title}
            </div>
          </div>

          {/* Content */}
          <div className="bg-canvas p-6 sm:p-8">
            <div className="grid sm:grid-cols-[1fr_1.5fr] gap-6 rtl-reverse">
              {/* Left: step details */}
                <div className="space-y-4">
                <div className="flex items-center gap-3" dir={ar ? "rtl" : "ltr"}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${step.color}15`, border: `1px solid ${step.color}33` }}>
                    <step.icon size={20} style={{ color: step.color }} />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-[15px]">Step {step.step}: {step.title}</h3>
                    <p className="text-foreground-muted text-[12px]">{step.subtitle}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {step.items.map((item, j) => {
                    const Icon = item.icon;
                    return (
                      <div key={j} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-border-invisible" dir={ar ? "rtl" : "ltr"}>
                        <Icon size={14} style={{ color: step.color }} className="shrink-0" />
                        <span className="text-foreground-secondary text-[13px]">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: mock dashboard */}
              <div className="rounded-xl border border-border-subtle bg-surface-1/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: step.color }} />
                  <span className="text-foreground-secondary text-[12px] font-medium">{step.dashboard.title}</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {step.dashboard.table.map((row, j) => (
                    <div key={j} className="flex items-center justify-between px-4 py-3">
                      <span className="text-foreground-secondary text-[12px]">{row.item}</span>
                      <span className="text-foreground-muted text-[12px]">{row.qty}</span>
                      <span className="text-[12px] font-medium" style={{ color: step.color }}>{row.price}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-foreground-muted text-[11px] uppercase tracking-wider">Summary</span>
                  <span className="text-[13px] font-semibold" style={{ color: step.color }}>{step.dashboard.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav arrows */}
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-1/80 border border-border-subtle flex items-center justify-center text-foreground-muted hover:text-foreground hover:border-border-visible transition-all cursor-pointer backdrop-blur-sm">
            {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-1/80 border border-border-subtle flex items-center justify-center text-foreground-muted hover:text-foreground hover:border-border-visible transition-all cursor-pointer backdrop-blur-sm">
            {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); resetTimer(); }}
              className="w-2 h-2 rounded-full transition-all cursor-pointer"
              style={{
                background: i === active ? s.color : "rgba(255,255,255,0.1)",
                boxShadow: i === active ? `0 0 8px ${s.color}44` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
