"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { IcSearch } from "@/components/icons";
import { Button as Btn } from "@/components/ui/button";
import { Card as PageHead, CardHeader as PageHeadHeader, CardTitle as PageHeadTitle } from "@/components/ui/card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge as StatePill } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input as TextInput } from "@/components/ui/input";

const CATEGORIES = [
  { id: "all", name: "All", nameAr: "الكل" },
  { id: "fb", name: "Food & Beverage", nameAr: "أغذية ومشروبات" },
  { id: "hk", name: "Housekeeping", nameAr: "تنظيف ومستلزمات" },
  { id: "ffe", name: "FF&E", nameAr: " Furnishing" },
  { id: "ose", name: "OS&E", nameAr: "مستلزمات تشغيلية" },
  { id: "eng", name: "Engineering", nameAr: "هندسة وصيانة" },
  { id: "lin", name: "Linens", nameAr: "منسوجات" },
  { id: "spa", name: "Spa & Wellness", nameAr: "スパ ورعاية" },
  { id: "sec", name: "Security", nameAr: "أمن وحماية" },
];

export default function MarketplacePage() {
  const { t, lang } = usePrefs();
  const { data, cartAdd, cart, toast, user } = useApp();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("cat");
    if (c) setCat(c);
    const id = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(id);
  }, [cat, q, sort]);

  const list = useMemo(() => {
    if (!data?.products) return [];
    let out = data.products.filter((p: any) => p.stock !== "out");
    if (cat !== "all") out = out.filter((p: any) => p.categoryId === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(s) ||
          p.sku?.toLowerCase().includes(s) ||
          (p.supplier?.name ?? "").toLowerCase().includes(s)
      );
    }
    out = [...out].sort((a: any, b: any) =>
      sort === "priceAsc"
        ? a.price - b.price
        : sort === "priceDesc"
          ? b.price - a.price
          : a.name.localeCompare(b.name)
    );
    return out;
  }, [data?.products, cat, q, sort]);

  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <Guard roles={["hotel_admin", "gm", "finance_director", "platform_admin"]}>
          <PageHead kicker={t("market.k") ?? "Marketplace"} title={t("nav.marketplace") ?? "Marketplace"} sub={t("market.sub") ?? "Browse products from verified suppliers"} />

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <CatChip on={cat === "all"} onClick={() => setCat("all")}>
                {t("market.allCat") ?? "All Categories"}
              </CatChip>
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <CatChip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
                  {nm(c.name, c.nameAr)}
                </CatChip>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
              <div className="relative sm:w-72">
                <IcSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <TextInput
                  className="ps-10"
                  placeholder={t("market.searchPh") ?? "Search products..."}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label={t("common.search") ?? "Search"}
                />
              </div>
              <div className="sm:w-52">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-medium text-ink-700 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
                  aria-label={t("market.sortLabel") ?? "Sort"}
                >
                  <option value="name">{t("market.sortName") ?? "Name"}</option>
                  <option value="priceAsc">{t("market.sortPriceAsc") ?? "Price: Low to High"}</option>
                  <option value="priceDesc">{t("market.sortPriceDesc") ?? "Price: High to Low"}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 text-[13px] font-medium text-ink-500 dark:text-ink-400">
            {loading ? (t("common.loading") ?? "Loading...") : t("market.count", { n: list.length }) ?? `${list.length} products`}
          </div>

          {loading ? (
            <div className="grid grid-air sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] rounded-none" />
                  <div className="space-y-2.5 p-4">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyStateWrapper
              icon={<IcSearch />}
              title={t("common.noData") ?? "No products found"}
              sub={t("market.count", { n: 0 }) ?? "0 products"}
              action={
                <button
                  className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink-700 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
                  onClick={() => { setQ(""); setCat("all"); }}
                >
                  {t("common.clear") ?? "Clear filters"}
                </button>
              }
            />
          ) : (
            <div className="grid grid-air sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((p: any) => {
                const inCart = cart?.find((l: any) => l.productId === p.id);
                const isHotel = user && ["hotel_admin", "gm", "finance_director"].includes(user.role);
                const imgSrc = p.image || `/images/suppliers/${p.supplierId?.slice(-1) || "1"}.jpg`;
                return (
                  <Card key={p.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                    <Link href={`/marketplace/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-fog-100">
                      <img src={imgSrc} alt={p.name} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05] object-cover" />
                      <div className="absolute start-3 top-3">
                        <StatePill
                          s={p.stock || "in"}
                          label={t(`state.${p.stock === "in" ? "in_stock" : p.stock === "low" ? "low_stock" : "out_of_stock"}`) ?? p.stock}
                        />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
                        {p.supplier?.name || ""}
                      </div>
                      <Link href={`/marketplace/${p.id}`} className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:underline">
                        {nm(p.name, p.nameAr)}{" "}
                      </Link>
                      <div className="mt-1 text-[11px] text-ink-400">
                        {p.sku} · {p.unit || "piece"} · {t("market.leadD", { n: p.leadDays }) ?? `${p.leadDays || 0} days`}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <span className="tnum text-lg font-medium text-ink-950 dark:text-white">
                          {p.price?.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-ink-400">{t("market.moq") ?? "MOQ"} {p.moq || 1}</span>
                      </div>
                      {isHotel ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            className="flex-1 rounded-lg bg-ink-950 px-4 py-2 text-[13px] font-medium text-white hover:bg-ink-850 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
                            onClick={() => {
                              const addQty = inCart ? p.moq : p.moq;
                              cartAdd(p.id, addQty);
                              toast?.(t("toast.cartAdd", { p: nm(p.name, p.nameAr) }) ?? "Added to cart");
                            }}
                          >
                            <IcCart size={14} /> {inCart ? t("market.added") ?? "Added" : t("market.addToCart") ?? "Add to cart"}
                          </button>
                          <Link href={`/marketplace/${p.id}#rfq`} className="rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-ink-700 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300 dark:hover:border-white">
                            <IcPen size={14} />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

function CatChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
        on
          ? "border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950"
          : "border-line bg-white text-ink-600 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyStateWrapper({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-white p-12 text-center dark:border-linedark dark:bg-ink-900">
      {icon}
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{sub}</p>
      {action}
    </div>
  );
}

function IcCart({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3.5h3l2.6 12.5h10.4l2-8.5H7" />
    </svg>
  );
}

function IcPen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}
