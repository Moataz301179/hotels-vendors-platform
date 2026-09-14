"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { CATEGORIES, supplierById } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  EmptyState,
  Img,
  PageHead,
  Select,
  Skeleton,
  StatePill,
  TextInput,
  btnCls,
} from "@/components/ui";
import { IcCart, IcPen, IcSearch } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function MarketplacePage() {
  const { t, lang } = usePrefs();
  const { data, cartAdd, cart, toast, user } = useApp();
  const [cat, setCat] = useState<string>("all");
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
    let out = data.products.filter((p) => p.stock !== "out");
    if (cat !== "all") out = out.filter((p) => p.categoryId === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.nameAr.includes(q.trim()) ||
          p.sku.toLowerCase().includes(s) ||
          (supplierById(p.supplierId)?.name ?? "").toLowerCase().includes(s)
      );
    }
    out = [...out].sort((a, b) =>
      sort === "priceAsc"
        ? a.price - b.price
        : sort === "priceDesc"
          ? b.price - a.price
          : a.name.localeCompare(b.name)
    );
    return out;
  }, [data.products, cat, q, sort]);

  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <Guard roles={[...HOTEL, "platform_admin"]}>
          <PageHead kicker={t("market.k")} title={t("nav.marketplace")} sub={t("market.sub")} />

          {/* filters */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <CatChip on={cat === "all"} onClick={() => setCat("all")}>
                {t("market.allCat")}
              </CatChip>
              {CATEGORIES.map((c) => (
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
                  placeholder={t("market.searchPh")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label={t("common.search")}
                />
              </div>
              <div className="sm:w-52">
                <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t("market.sortLabel")}>
                  <option value="name">{t("market.sortName")}</option>
                  <option value="priceAsc">{t("market.sortPriceAsc")}</option>
                  <option value="priceDesc">{t("market.sortPriceDesc")}</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="mb-4 text-[13px] font-medium text-ink-500 dark:text-ink-400">
            {loading ? t("common.loading") : t("market.count", { n: list.length })}
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
            <EmptyState
              icon={<IcSearch />}
              title={t("common.noData")}
              sub={t("market.count", { n: 0 })}
              action={
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setCat("all");
                  }}
                >
                  {t("common.clear")}
                </Btn>
              }
            />
          ) : (
            <div className="grid grid-air sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((p) => {
                const sup = supplierById(p.supplierId);
                const inCart = cart.find((l) => l.productId === p.id);
                const isHotel = user && HOTEL.includes(user.role);
                return (
                  <Card key={p.id} className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                    <Link href={`/marketplace/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-fog-100">
                      <Img src={p.img} alt={p.alt} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]" />
                      <div className="absolute start-3 top-3">
                        <StatePill s={p.stock} label={t(`state.${p.stock === "in" ? "in_stock" : p.stock === "low" ? "low_stock" : "out_of_stock"}`)} />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
                        {sup ? nm(sup.name, sup.nameAr) : ""}
                      </div>
                      <Link href={`/marketplace/${p.id}`} className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:underline">
                        {nm(p.name, p.nameAr)}
                      </Link>
                      <div className="mt-1 text-[11px] text-ink-400">
                        {p.sku} · {nm(p.unit, p.unitAr)} · {t("market.leadD", { n: p.leadDays })}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <span className="tnum text-lg font-bold text-ink-950 dark:text-white">
                          {fmtMoney(p.price, lang)}
                        </span>
                        <span className="text-[11px] text-ink-400">{t("market.moq")} {p.moq}</span>
                      </div>
                      {isHotel ? (
                        <div className="mt-4 flex gap-2">
                          <Btn
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const addQty = inCart ? p.moq : p.moq;
                              cartAdd(p.id, addQty);
                              toast(t("toast.cartAdd", { p: nm(p.name, p.nameAr) }));
                            }}
                          >
                            <IcCart className="text-sm" /> {inCart ? t("market.added") : t("market.addToCart")}
                          </Btn>
                          <Link href={`/marketplace/${p.id}#rfq`} className={btnCls("outline", "sm")} aria-label={t("market.requestQuote")}>
                            <IcPen className="text-sm" />
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
