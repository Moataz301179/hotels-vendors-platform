"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/stubs-export";
import {
  CARRIERS,
  CATEGORIES,
  HERO_IMG,
  WAREHOUSE_IMG,
} from "@/lib/stubs-export";
import { fmtMoney } from "@/lib/stubs-export";
import { btnCls, Img } from "@/lib/stubs-export";
import PublicHeader from "@/lib/stubs-export";
import { HeroFilmNarrative } from "@/lib/stubs-export";
import {
  IcArrow,
  IcBuilding,
  IcCard,
  IcCheck,
  IcDoc,
  IcHand,
  IcLock,
  IcReceipt,
  IcShield,
  IcStamp,
  IcThermo,
  IcTruck,
  IcWarehouse,
  Logo,
} from "@/lib/stubs-export";

export default function HomePage() {
  const { t, lang } = usePrefs();
  const { data } = useApp();
  const nm = (en: string, ar: string) => (lang === "ar" ? ar : en);

  /* Live network figures — computed from the verified pilot dataset only. */
  const net = (() => {
    const valid = data.orders.filter((o) => o.approval.state !== "rejected");
    const open = valid.filter((o) => o.receipt !== "complete").length;
    const transit = data.deliveries.filter((d) =>
      ["picked_up", "in_transit", "out_for_delivery"].includes(d.status)
    ).length;
    const done = data.deliveries.filter((d) => d.status === "delivered");
    const onTime = done.length
      ? Math.round((done.filter((d) => !d.delayed).length / done.length) * 100)
      : 100;
    const awaiting = data.invoices
      .filter((i) => i.status === "submitted" || i.status === "approved")
      .reduce((a, i) => a + i.total, 0);
    const financed = data.financing
      .filter((f) => f.status === "funded")
      .reduce((a, f) => a + f.amount, 0);
    const grn = valid.length
      ? Math.round((valid.filter((o) => o.receipt === "complete").length / valid.length) * 100)
      : 0;
    const stages = [
      { l: t("state.pending"), n: valid.filter((o) => o.approval.state === "pending").length },
      { l: t("state.acknowledged"), n: valid.filter((o) => o.fulfillment === "acknowledged").length },
      { l: t("state.preparing"), n: valid.filter((o) => o.fulfillment === "preparing").length },
      { l: t("state.in_transit"), n: valid.filter((o) =>
          ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
      { l: t("state.delivered"), n: valid.filter((o) => o.fulfillment === "delivered" && o.receipt !== "complete").length },
      { l: t("state.complete"), n: valid.filter((o) => o.receipt === "complete").length },
    ];
    return { open, transit, onTime, awaiting, financed, grn, stages,
      maxStage: Math.max(1, ...stages.map((s) => s.n)) };
  })();
  const stats = [
    { v: data.hotels.length.toString(), l: lang === "ar" ? "فنادق" : "Hotels" },
    { v: data.suppliers.length.toString(), l: lang === "ar" ? "مورّدون" : "Suppliers" },
    { v: data.partners.length.toString(), l: lang === "ar" ? "شركاء تمويل" : "Financing Partners" },
    { v: data.categories.length.toString(), l: lang === "ar" ? "فئات" : "Categories" },
  ];
  const steps = [
    { n: "01", tt: lang === "ar" ? "فنادق" : "Hotels — Buyers", d: lang === "ar" ? "بوابة الشراء + لوحة التحكم المالية" : "Procurement Portal + Financial Dashboard" },
    { n: "02", tt: lang === "ar" ? "مورّدون" : "Suppliers — Sellers", d: lang === "ar" ? "مركز المورد + أدوات التسعير" : "Supplier Central + Marketing Tools" },
    { n: "03", tt: lang === "ar" ? "لوجستيات" : "Logistics — Fulfillment", d: lang === "ar" ? "شبكة التوصيل + تحسين المسار" : "Shared-Route Fulfillment Network" },
    { n: "04", tt: lang === "ar" ? "تمويل" : "Factoring — Liquidity", d: lang === "ar" ? "تسهيلات السيولة + إدارة الائتمان" : "Embedded Liquidity + Credit Marketplace" },
  ];
  const preview = PRODUCTS.filter((p) => p.stock !== "out").slice(0, 8);

  return (
    <div className="sf-page text-ink-950 dark:text-ink-100">
      <PublicHeader />

      {/* ================= EDITORIAL HERO — no video overlay ================= */}
      <section className="overflow-hidden text-ink-950 dark:text-white border-b border-line dark:border-linedark">
        <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-16 sm:px-6 sm:py-24 lg:py-28 lg:pe-16">
            <div className="anim-rise max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="signal-line h-px w-8" />
                <span className="kicker text-ink-500 dark:text-ink-300">{t("home.k1")}</span>
              </div>
              <h1 className="text-[42px] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                {t("home.h1a")} <span className="text-signal">{t("home.h1b")}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 dark:text-ink-300 sm:text-lg">{t("home.sub")}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/marketplace" className={btnCls("accent", "lg")}>
                  {t("home.cta1")} <IcArrow className="rtl:-scale-x-100" />
                </Link>
                <Link href="/login" className="inline-flex h-12 items-center rounded border border-ink-950/25 dark:border-white/25 px-6 text-[15px] font-medium text-ink-950 dark:text-white transition-colors hover:bg-ink-950/10 dark:hover:bg-white/10">
                  {t("home.cta2")}
                </Link>
              </div>
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden lg:min-h-[650px]">
            <Img src={HERO_IMG} alt="Premium hotel lobby interior" eager className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/25 via-transparent to-transparent rtl:bg-gradient-to-l dark:from-black/35" />
            <div className="absolute bottom-5 end-5 border border-line dark:border-white/20 bg-white/90 dark:bg-black/65 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-950 dark:text-white">
                <span className="signal-dot h-1.5 w-1.5 rounded-full" />
                {t("home.pilot")}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-line dark:border-white/10">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-line dark:bg-white/10 lg:grid-cols-5">
            <div className="col-span-2 flex items-center bg-fog-50 dark:bg-black px-5 py-4 lg:col-span-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">{t("home.pilot")}</div>
            </div>
            {stats.map((stat) => (
              <div key={stat.l} className="bg-fog-50 dark:bg-black px-5 py-4">
                <div className="tnum text-2xl font-bold text-ink-950 dark:text-white">{stat.v}</div>
                <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECOND FOLD: EDUCATIONAL FILM ================= */}
      <HeroFilm>
        <HeroFilmNarrative />
      </HeroFilm>

      {/* ================= WHY BOTH SIDES JOIN ================= */}
      <section className="sf-alt band-lg border-b border-line dark:border-linedark">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("why.k")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("why.t")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400 sm:text-base">
              {t("why.sub")}
            </p>
          </div>

          <div className="grid overflow-hidden rounded-lg border border-line dark:border-linedark lg:grid-cols-[1fr_180px_1fr]">
            {/* Hotel side */}
            <article className="sf-page p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded bg-ink-950 text-xl text-brass-300 dark:bg-white dark:text-brass-600">
                <IcBuilding />
              </span>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{t("why.hotelT")}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                {t("why.hotelD")}
              </p>
              <ul className="mt-6 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-700 dark:text-ink-200">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-[11px] text-emerald-700 dark:text-emerald-300">
                      <IcCheck />
                    </span>
                    {t(`why.hotel${n}`)}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`${btnCls("outline", "sm")} mt-7`}>
                {t("why.hotelCta")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </article>

            {/* Shared transaction rail */}
            <div className="sf-ink relative flex flex-row items-center justify-between gap-1 px-4 py-6 text-white lg:flex-col lg:justify-center lg:px-5">
              <div className="absolute start-8 end-8 top-1/2 h-px -translate-y-1/2 bg-white/15 lg:inset-y-10 lg:start-1/2 lg:end-auto lg:top-auto lg:h-auto lg:w-px lg:-translate-x-1/2 lg:translate-y-0 rtl:lg:translate-x-1/2" />
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="relative z-10 flex flex-col items-center gap-1.5 bg-ink-900 px-1 lg:bg-transparent lg:px-0">
                  <span className="tnum flex h-7 w-7 items-center justify-center rounded-full border border-brass-400 bg-ink-950 text-[10px] font-bold text-brass-300">
                    0{n}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-300">
                    {t(`why.bridge${n}`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Supplier side */}
            <article className="sf-page p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded bg-brass-500 text-xl text-white">
                <IcWarehouse />
              </span>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{t("why.supplierT")}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                {t("why.supplierD")}
              </p>
              <ul className="mt-6 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-700 dark:text-ink-200">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-500/10 text-[11px] text-brass-700 dark:text-brass-300">
                      <IcCheck />
                    </span>
                    {t(`why.supplier${n}`)}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`${btnCls("accent", "sm")} mt-7`}>
                {t("why.supplierCta")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </article>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] text-ink-500 dark:text-ink-400">
            <IcShield className="shrink-0 text-brass-600 dark:text-brass-400" />
            {t("why.neutral")}
          </div>
        </div>
      </section>

      {/* ================= TENANT ROSTER ================= */}
      <section className="sf-alt band-lg border-b border-line dark:border-linedark">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("home.rosterK")}</div>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">{t("home.rosterT")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">{t("home.rosterSub")}</p>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line dark:border-linedark dark:bg-linedark lg:grid-cols-2">
            <div className="bg-white p-6 dark:bg-ink-900">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {t("home.colHotel")}
              </div>
              <ul className="divide-y divide-line dark:divide-linedark">
                {data.hotels.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div>
                      <div className="text-[15px] font-semibold">{nm(h.name, h.nameAr)}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">{nm(h.city, h.cityAr)}</div>
                    </div>
                    <div className="tnum text-end text-xs text-ink-500 dark:text-ink-400">
                      <div>{h.rooms} {lang === "ar" ? "غرفة" : "rooms"}</div>
                      <div>{h.since}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 dark:bg-ink-900">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {t("home.colSupplier")}
              </div>
              <ul className="divide-y divide-line dark:divide-linedark">
                {data.suppliers.map((s) => (
                  <li key={s.id} className="py-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[15px] font-semibold">{nm(s.name, s.nameAr)}</div>
                      <div className="tnum text-xs text-ink-500 dark:text-ink-400">{s.since}</div>
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {s.city} · {s.categories.map((c) => nm(CATEGORIES.find((x) => x.id === c)?.name ?? "", CATEGORIES.find((x) => x.id === c)?.nameAr ?? "")).join(" / ")}
                    </div>
                  </li>
                ))}
                <li className="py-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[15px] font-semibold">{"NileBridge Capital"}</div>
                    <span className="rounded-full border border-brass-500/40 bg-brass-500/10 px-2.5 py-1 text-[11px] font-semibold text-brass-700 dark:text-brass-300">
                      {t("home.finLicensed")}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{"Licensed financing partner"}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FLOW (dark) ================= */}
      <section id="flow" className="sf-ink band-lg grid-ink glow-brass air-glow text-white">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <div className="kicker mb-3 text-brass-300">{t("home.flowK")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.1]">{t("home.flowT")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-300 sm:text-base">{t("home.flowSub")}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="bg-ink-950/85 p-6 transition-colors hover:bg-ink-900">
                <div className="tnum text-sm font-bold text-brass-400">{s.n}</div>
                <div className="mt-8 text-[15px] font-semibold">{s.tt}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-300">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ================= NETWORK DASHBOARD ================= */}
      <section className="sf-page band-lg border-b border-line dark:border-linedark">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("net.k")}</div>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">{t("net.t")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                {t("net.sub")}
              </p>
            </div>
            <Link href="/dashboard" className={btnCls("outline", "sm")}>
              {t("net.openDash")}
              <IcArrow className="rtl:-scale-x-100" />
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line dark:border-linedark dark:bg-linedark sm:grid-cols-2 xl:grid-cols-5">
            {[
              { l: t("net.open"), v: String(net.open), s: t("net.openSub") },
              { l: t("net.transit"), v: String(net.transit), s: t("net.transitSub") },
              { l: t("net.onTime"), v: `${net.onTime}%`, s: t("net.onTimeSub") },
              { l: t("net.await"), v: fmtMoney(net.awaiting, lang), s: t("net.awaitSub") },
              { l: t("net.fin"), v: fmtMoney(net.financed, lang), s: t("net.finSub") },
            ].map((k) => (
              <div key={k.l} className="sf-page p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                  {k.l}
                </div>
                <div className="tnum mt-2.5 text-[28px] font-bold leading-none tracking-tight">{k.v}</div>
                <div className="mt-2 text-[12px] leading-snug text-ink-500 dark:text-ink-400">{k.s}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-lg border border-line p-6 lg:col-span-2 dark:border-linedark">
              <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {t("net.pipeline")}
              </div>
              <div className="space-y-3.5">
                {net.stages.map((s) => (
                  <div key={s.l}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{s.l}</span>
                      <span className="tnum text-ink-500">{s.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div
                        className="h-full rounded-full bg-ink-950 dark:bg-white"
                        style={{ width: `${(s.n / net.maxStage) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line p-6 dark:border-linedark">
              <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {t("net.grn")}
              </div>
              <div className="tnum text-5xl font-bold leading-none tracking-tight">{net.grn}%</div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                {t("net.grnSub")}
              </p>
              <div className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                <div className="flex justify-between">
                  <span className="text-ink-500">{t("net.hotels")}</span>
                  <span className="tnum font-semibold">{HOTELS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">{t("net.suppliers")}</span>
                  <span className="tnum font-semibold">{SUPPLIERS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">{t("net.partners")}</span>
                  <span className="tnum font-semibold">{PARTNERS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">{t("net.carriers")}</span>
                  <span className="tnum font-semibold">{CARRIERS.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="sf-page band-lg">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("home.catK")}</div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.catT")}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">{t("home.catSub")}</p>
            </div>
            <Link href="/marketplace" className={`${btnCls("outline", "sm")}`}>
              {t("common.viewAll")}
              <IcArrow className="rtl:-scale-x-100" />
            </Link>
          </div>
          <div className="grid grid-air-lg sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const count = PRODUCTS.filter((p) => p.categoryId === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/marketplace?cat=${c.id}`}
                  className="group relative overflow-hidden rounded-lg border border-line dark:border-linedark"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <Img
                      src={c.img}
                      alt={nm(c.name, c.nameAr)}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="text-xl font-bold tracking-tight">{nm(c.name, c.nameAr)}</div>
                    <div className="tnum mt-1 text-xs text-ink-200">
                      {count} {t("home.prodCount")}
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brass-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {t("common.view")} <IcArrow className="rtl:-scale-x-100" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MARKETPLACE PREVIEW ================= */}
      <section className="sf-grey band-lg border-y border-line dark:border-linedark">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("home.prevK")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.prevT")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{t("home.prevSub")}</p>
          </div>
          <div className="grid grid-air sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((p) => {
              const sup = SUPPLIERS.find((s) => s.id === p.supplierId);
              return (
                <Link
                  key={p.id}
                  href={`/marketplace/${p.id}`}
                  className="group overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-lg dark:border-linedark dark:bg-ink-900"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-fog-100">
                    <Img
                      src={p.img}
                      alt={p.alt}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
                      {sup ? nm(sup.name, sup.nameAr) : ""}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{nm(p.name, p.nameAr)}</div>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="tnum text-base font-bold text-ink-950 dark:text-white">
                        {fmtMoney(p.price, lang)}
                      </span>
                      <span className="text-[11px] text-ink-400">{nm(p.unit, p.unitAr)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PROCUREMENT CONTROL (dark) ================= */}
      <section className="sf-void band-lg grid-ink air-glow text-white">
        <div className="mx-auto grid max-w-[1400px] grid-air-lg px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="kicker mb-3 text-brass-300">{t("home.controlsK")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.1]">{t("home.controlsT")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">{t("home.controlsSub")}</p>
            <div className="mt-8 flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <IcShield className="mt-0.5 shrink-0 text-lg text-brass-300" />
              <p className="text-[13px] leading-relaxed text-ink-200">{t("home.auditNote")}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/12">
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <div className="text-sm font-semibold">{t("home.ruleT")}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-start text-[11px] uppercase tracking-[0.14em] text-ink-400">
                  <th className="px-5 py-3 text-start font-semibold">{t("home.colBand")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("home.colApprover")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("home.colSla")}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { b: t("home.bandAuto"), a: t("home.apAuto"), s: t("home.sla0") },
                  { b: t("home.bandMid"), a: t("home.apMid"), s: t("home.sla24") },
                  { b: t("home.bandHigh"), a: t("home.apHigh"), s: t("home.sla48") },
                ].map((r) => (
                  <tr key={r.b} className="border-b border-white/8 last:border-0">
                    <td className="tnum px-5 py-4 font-medium">{r.b}</td>
                    <td className="px-5 py-4 text-ink-200">{r.a}</td>
                    <td className="tnum px-5 py-4 text-brass-300">{r.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= LOGISTICS ================= */}
      <section id="logistics" className="sf-page band-lg">
        <div className="mx-auto grid max-w-[1400px] grid-air-lg items-center px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative order-2 overflow-hidden rounded-lg lg:order-1">
            <SectionFilm
              src={LOGISTICS_FILM.src}
              poster={LOGISTICS_FILM.poster}
              alt="Warehouse and logistics"
              className="aspect-[4/3] w-full"
            />
            <div className="absolute bottom-4 start-4 flex items-center gap-2 rounded bg-ink-950/80 px-3 py-2 text-xs font-medium text-white backdrop-blur">
              <IcTruck className="text-brass-300" />
              {CARRIERS.length} {lang === "ar" ? "ناقلان معتمدان" : "assigned carriers"} · ETA
              {lang === "ar" ? " حية" : " live"}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("home.logK")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.1]">{t("home.logT")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-400 sm:text-base">{t("home.logSub")}</p>
            <div className="mt-8 space-y-5">
              {[
                { I: IcTruck, tt: t("home.log1t"), d: t("home.log1d") },
                { I: IcThermo, tt: t("home.log2t"), d: t("home.log2d") },
                { I: IcReceipt, tt: t("home.log3t"), d: t("home.log3d") },
              ].map((f) => (
                <div key={f.tt} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-ink-950 text-xl text-brass-300 dark:bg-white/10">
                    <f.I />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{f.tt}</div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINANCING ================= */}
      <section id="financing" className="sf-alt band-lg border-t border-line dark:border-linedark">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <div className="kicker mb-3 text-brass-600 dark:text-brass-400">{t("home.finK")}</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.finT")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400 sm:text-base">{t("home.finSub")}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line dark:border-linedark dark:bg-linedark sm:grid-cols-2 lg:grid-cols-4">
            {[
              { tt: t("home.fin1t"), d: t("home.fin1d") },
              { tt: t("home.fin2t"), d: t("home.fin2d") },
              { tt: t("home.fin3t"), d: t("home.fin3d") },
              { tt: t("home.fin4t"), d: t("home.fin4d") },
            ].map((s, i) => (
              <div key={s.tt} className="bg-white p-6 dark:bg-ink-900">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-ink-950 text-[13px] font-bold text-brass-300 dark:bg-white/10">
                    {i + 1}
                  </span>
                  <div className="text-[15px] font-semibold">{s.tt}</div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-brass-500/30 bg-brass-500/8 p-5">
            <div className="flex items-center gap-3">
              <IcCard className="text-2xl text-brass-600 dark:text-brass-300" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-700 dark:text-brass-300">
                  {t("home.finPartner")}
                </div>
                <div className="text-base font-bold">{"NileBridge Capital"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-medium text-ink-600 dark:text-ink-300">
              <IcCheck className="text-emerald-600" />
              {t("home.finLicensed")} — {"Licensed financing partner"}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PARTNERS CTA ================= */}
      <section className="sf-void band-lg glow-brass air-glow text-white">
        <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6">
          <div className="kicker mb-3 text-brass-300">{t("home.partnerK")}</div>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.1]">
            {t("home.partnerT")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base">{t("home.partnerSub")}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className={btnCls("accent", "lg")}>
              {t("home.partnerCta")}
              <IcArrow className="rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="sf-ink border-t border-white/10 py-14 text-ink-300">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <Logo className="h-10 w-auto" />
                <div className="leading-none">
                  <div className="text-lg font-bold tracking-tight text-white">HOTELS VENDORS</div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">Egyptian Hospitality Neural Network</div>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-ink-400">{t("home.footD")}</p>
              <div className="mt-5 flex items-center gap-2 text-[12px] text-ink-500">
                <IcWarehouse className="text-base" />
                {CARRIERS.map((c) => nm(c.name, c.nameAr)).join(" · ")}
              </div>
            </div>
            {(
              [
                [t("home.footMarket"), ["/marketplace", "/suppliers", "/marketplace", "/cart"]],
                [t("home.footProc"), ["/orders", "/receiving", "/invoices", "/eta-compliance"]],
                [t("home.footPartners"), ["/supplier-central", "/deliveries", "/financing", "/admin"]],
                [t("home.footLegal"), ["/login", "/login", "/financing", "/settings"]],
              ] as [string, string[]][]
            ).map(([head, hrefs], idx) => (
              <div key={head}>
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">{head}</div>
                <ul className="space-y-2.5 text-[13px]">
                  {(
                    [
                      t("home.footMarketplace"),
                      t("home.footSuppliers"),
                      t("home.footRFQ"),
                      t("common.cart"),
                      t("home.footOrders"),
                      t("home.footReceiving"),
                      t("home.footInvoices"),
                      t("home.footETA"),
                      t("home.footSupplier"),
                      t("home.footCarrier"),
                      t("home.footFinPartner"),
                      t("home.footAdmin"),
                      t("home.footTerms"),
                      t("home.footPrivacy"),
                      t("home.footFinNote"),
                      t("settings.title"),
                    ] as string[]
                  ).slice(idx * 4, idx * 4 + 4).map((l, i) => (
                    <li key={i}>
                      <Link href={hrefs[i] ?? "/"} className="transition-colors hover:text-white">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-ink-500">
            <span>{t("home.rights")}</span>
            <span className="flex items-center gap-1.5">
              <IcStamp className="text-sm" />
              {t("home.footFinNote")}: HotelsVendors {lang === "ar" ? "ليست مقرضاً." : "is not a lender."}
            </span>
          </div>
        </div>
      </footer>

      {/* icons used as decorative anchors */}
      <span className="hidden">
        <IcDoc /> <IcHand /> <IcCheck /> <IcArrow />
      </span>
    </div>
  );
}