"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrefs } from "@/i18n/provider";

/* ---------------------------------------------------------------
   The HotelsVendors brand film.
   Four chapters that walk the network's value chain — guest
   operations → F&B supply → housekeeping → warehouse & fulfilment.
   Stock footage, muted, crossfaded, streaming (range requests) so
   only the chapter on screen is downloaded.
   --------------------------------------------------------------- */

const thumb = (id: number, name: string) =>
  `https://images.pexels.com/videos/${id}/${name}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1920&h=1080`;

export interface Chapter {
  key: "c1" | "c2" | "c3" | "c4";
  src: string;
  poster: string;
  hold: number;
}

export const FILM_CHAPTERS: Chapter[] = [
  {
    key: "c1",
    src: "https://videos.pexels.com/video-files/6474635/6474635-uhd_4096_2160_25fps.mp4",
    poster: thumb(6474635, "pexels-photo-6474635"),
    hold: 8000,
  },
  {
    key: "c2",
    src: "https://videos.pexels.com/video-files/4253721/4253721-uhd_4096_2160_25fps.mp4",
    poster: thumb(4253721, "pexels-photo-4253721"),
    hold: 8000,
  },
  {
    key: "c3",
    src: "https://videos.pexels.com/video-files/9472830/9472830-uhd_3840_2160_24fps.mp4",
    poster: thumb(9472830, "pexels-photo-9472830"),
    hold: 8000,
  },
  {
    key: "c4",
    src: "https://videos.pexels.com/video-files/32243654/13751478_3840_2160_25fps.mp4",
    poster: thumb(32243654, "pexels-photo-32243654"),
    hold: 8000,
  },
];

export const LOGISTICS_FILM = {
  src: "https://videos.pexels.com/video-files/32838797/13996856_3840_2160_30fps.mp4",
  poster: thumb(32838797, "copells-32838797"),
};

/* ---------------- shared state ---------------- */

interface FilmState {
  index: number;
  playing: boolean;
  muted: boolean;
  ready: boolean;
  reduced: boolean;
  toggle: () => void;
  toggleMute: () => void;
  go: (i: number) => void;
  chapters: Chapter[];
}

const Ctx = createContext<FilmState | null>(null);
const useFilm = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFilm outside HeroFilm");
  return v;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------- icons ---------------- */

const IcPlay = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);
const IcPause = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </svg>
);
const IcSound = ({ on, className = "" }: { on: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9.5h3L12 5.5v13L7 14.5H4v-5Z" />
    {on ? <path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.5 7.5 0 0 1 0 10.8" /> : <path d="m16.5 9.5 5 5m0-5-5 5" />}
  </svg>
);

/* ---------------- hero shell ---------------- */

export function HeroFilm({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  const go = useCallback((i: number) => {
    setIndex(((i % FILM_CHAPTERS.length) + FILM_CHAPTERS.length) % FILM_CHAPTERS.length);
  }, []);

  const value = useMemo<FilmState>(
    () => ({
      index,
      playing,
      muted,
      ready,
      reduced,
      toggle: () => setPlaying((p) => !p),
      toggleMute: () => setMuted((m) => !m),
      go,
      chapters: FILM_CHAPTERS,
    }),
    [index, playing, muted, ready, reduced, go]
  );

  return (
    <Ctx.Provider value={value}>
      <section className="sf-void air-glow relative overflow-hidden text-white">
        <HeroFilmBackground />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
          {children}
        </div>
      </section>
    </Ctx.Provider>
  );
}

/* ---------------- background media ---------------- */

export function HeroFilmBackground() {
  const { index, playing, muted, go, chapters, reduced } = useFilm();
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  /* advance chapters while playing */
  useEffect(() => {
    if (!playing || reduced) return;
    const t = window.setTimeout(() => go(index + 1), chapters[index].hold);
    return () => window.clearTimeout(t);
  }, [index, playing, reduced, go, chapters]);

  /* pause the film when the hero scrolls away — saves bandwidth */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      {/* poster bed — always painted first so the hero is never empty */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${chapters[0].poster})`, opacity: 1 }}
      />

      {chapters.map((c, i) => {
        const active = i === index;
        const near = active || i === (index + 1) % chapters.length;
        return (
          <video
            key={c.key}
            ref={(el) => {
              if (!el) return;
              if (active && playing && inView && !reduced) {
                const p = el.play();
                if (p && typeof p.catch === "function") p.catch(() => undefined);
              } else {
                el.pause();
              }
            }}
            src={near ? c.src : undefined}
            poster={c.poster}
            muted={muted}
            loop={false}
            playsInline
            preload={i === 0 ? "metadata" : "none"}
            onCanPlay={() => setLoaded((l) => (l[i] ? l : { ...l, [i]: true }))}
            onEnded={() => active && go(index + 1)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
              active && loaded[i] ? "opacity-100" : "opacity-0"
            }`}
            style={{
              filter: "saturate(0.86) contrast(1.05)",
              transform: active ? "scale(1.02)" : "scale(1.06)",
              transition: "opacity 1200ms ease-out, transform 9000ms linear",
            }}
          />
        );
      })}

      {/* legibility scrim — heavier at the top and bottom for type */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/55 to-ink-950/92" />
      <div className="absolute inset-0 via-transparent bg-[radial-gradient(120%_80%_at_80%_0%,rgba(200,163,91,0.18),transparent_60%)]" />
      <div className="grid-ink absolute inset-0 opacity-[0.35]" />
    </div>
  );
}

/* ---------------- controls ---------------- */

export function HeroFilmControls() {
  const { t } = usePrefs();
  const { index, playing, muted, toggle, toggleMute, go, chapters } = useFilm();

  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label={playing ? t("film.pause") : t("film.play")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15"
        >
          {playing ? <IcPause className="text-base" /> : <IcPlay className="text-base" />}
        </button>
        <button
          onClick={toggleMute}
          aria-label={muted ? t("film.muted") : t("film.unmuted")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/15"
        >
          <IcSound on={!muted} className="text-base" />
        </button>
      </div>

      <div className="flex items-center gap-1" role="tablist" aria-label={t("film.label")}>
        {chapters.map((c, i) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={i === index}
            onClick={() => go(i)}
            className="group flex items-center gap-2 rounded-full px-1 py-1"
          >
            <span
              className={`block h-[3px] rounded-full transition-all duration-500 ${
                i === index ? "w-10 bg-brass-400" : "w-6 bg-white/30 group-hover:bg-white/60"
              }`}
            />
          </button>
        ))}
      </div>

      <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink-300">
        {t(`film.${chapters[index].key}`)}
      </span>

      <span className="hidden text-[11px] text-ink-500 lg:inline">
        {t("film.caption", {
          a: t("film.c1"),
          b: t("film.c2"),
          c: t("film.c3"),
          d: t("film.c4"),
        })}
      </span>
    </div>
  );
}

/* ---------------- inline section film (in-view playback) ---------------- */

export function SectionFilm({
  src,
  poster,
  alt,
  className = "",
}: {
  src: string;
  poster: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => setLive(e.isIntersecting && e.intersectionRatio > 0.25),
      { threshold: [0, 0.25, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (live && !reduced) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    } else {
      el.pause();
    }
  }, [live, reduced]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden="true"
      />
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        onCanPlay={() => setReady(true)}
        className={`relative h-full w-full object-cover transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
