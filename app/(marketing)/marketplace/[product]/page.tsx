"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { CATEGORIES, productById, supplierById } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  Img,
  KV,
  Modal,
  StatePill,
  TextArea,
  TextInput,
  btnCls,
} from "@/components/ui";
import { IcCart, IcCheck, IcMail, IcMinus, IcPen, IcPhone, IcPin, IcPlus, IcWarehouse } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function ProductPage() {
  const { t, lang } = usePrefs();
  const params = useParams<{ product: string }>();
  const id = params?.product ?? "";
  const { data, cartAdd, cart, sendRfq, toast } = useApp();
  const p = useMemo(() => data.products.find((x) => x.id === id), [data.products, id]);

  const [qty, setQty] = useState(p?.moq ?? 1);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqQty, setRfqQty] = useState(10);
  const [rfqNote, setRfqNote] = useState("");
  const [err, setErr] = useState("");

  if (!p) {
    return (
      <RequireAuth>
        <AppShell active="/marketplace">
          <div className="mx-auto max-w-2xl py-10">
            <EmptyState
              icon={<IcWarehouse />}
              title={t("market.notFound")}
              sub={t("market.notFoundSub")}
              action={
                <Link href="/marketplace" className={btnCls("outline", "sm")}>
                  {t("market.backToMarket")}
                </Link>
              }
            />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  const sup = supplierById(p.supplierId)!;
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);
  const cat = CATEGORIES.find((c) => c.id === p.categoryId)!;
  const inCart = cart.find((l) => l.productId === p.id)?.qty ?? 0;
  const related = data.products.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);

  const add = () => {
    if (qty < p.moq) {
      setErr(t("market.minOrder", { n: p.moq, u: nm(p.unit, p.unitAr) }));
      return;
    }
    setErr("");
    cartAdd(p.id, qty);
    toast(t("toast.cartAdd", { p: nm(p.name, p.nameAr) }));
  };

  const submitRfq = () => {
    if (rfqQty < 1) return;
    sendRfq(p.id, rfqQty, rfqNote);
    setRfqOpen(false);
    toast(t("market.rfqSent", { s: nm(sup.name, sup.nameAr) }));
  };

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <Guard roles={[...HOTEL, "platform_admin"]}>
          {/* breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-[13px] text-ink-500 dark:text-ink-400" aria-label="breadcrumb">
            <Link href="/marketplace" className="hover:text-ink-950 dark:hover:text-white">
              {t("nav.marketplace")}
            </Link>
            <span>/</span>
            <Link href={`/marketplace?cat=${p.categoryId}`} className="hover:text-ink-950 dark:hover:text-white">
              {nm(cat.name, cat.nameAr)}
            </Link>
            <span>/</span>
            <span className="text-ink-950 dark:text-ink-100">{nm(p.name, p.nameAr)}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line dark:border-linedark">
              <Img src={p.img} alt={p.alt} eager className="aspect-[4/3] w-full" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Link href="/suppliers" className="text-[13px] font-semibold text-brass-600 hover:underline dark:text-brass-400">
                  {nm(sup.name, sup.nameAr)}
                </Link>
                <StatePill
                  s={p.stock}
                  label={t(`state.${p.stock === "in" ? "in_stock" : p.stock === "low" ? "low_stock" : "out_of_stock"}`)}
                />
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{nm(p.name, p.nameAr)}</h1>
              <div className="tnum mt-1 text-[13px] text-ink-400">
                {t("market.sku")} {p.sku} · {nm(p.unit, p.unitAr)}
              </div>

              <div className="mt-5 flex items-end gap-3">
                <span className="tnum text-4xl font-bold tracking-tight">{fmtMoney(p.price, lang)}</span>
                <span className="pb-1.5 text-sm text-ink-500">{t("common.perUnit")}</span>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {nm(p.desc, p.descAr)}
              </p>

              <dl className="mt-6 divide-y divide-line rounded-lg border border-line dark:divide-linedark dark:border-linedark">
                {p.specs.map((s) => (
                  <KV key={s.k} k={nm(s.k, s.kAr)} v={s.v} />
                ))}
                <KV k={t("market.lead")} v={t("market.leadD", { n: p.leadDays })} />
                <KV k={t("market.moq")} v={`${p.moq} × ${nm(p.unit, p.unitAr)}`} />
              </dl>

              {/* qty + actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded border border-line dark:border-linedark">
                  <button
                    className="flex h-11 w-11 items-center justify-center text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    onClick={() => setQty((v) => Math.max(1, v - 1))}
                    aria-label="-"
                  >
                    <IcMinus />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="tnum h-11 w-20 border-x border-line bg-transparent text-center text-sm font-semibold outline-none dark:border-linedark"
                    aria-label={t("common.quantity")}
                  />
                  <button
                    className="flex h-11 w-11 items-center justify-center text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    onClick={() => setQty((v) => v + 1)}
                    aria-label="+"
                  >
                    <IcPlus />
                  </button>
                </div>
                <Btn size="lg" onClick={add} className="flex-1 sm:flex-none">
                  <IcCart /> {t("market.addToCart")}
                </Btn>
                <Btn variant="outline" size="lg" onClick={() => setRfqOpen(true)}>
                  <IcPen /> {t("market.requestQuote")}
                </Btn>
              </div>
              {err ? <p className="mt-2 text-[13px] font-medium text-red-700 dark:text-red-400">{err}</p> : null}
              {inCart > 0 ? (
                <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                  <IcCheck /> {t("market.inCart")}: {inCart}
                </p>
              ) : null}

              {/* supplier card */}
              <Card className="mt-8 p-5">
                <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("market.aboutSupplier")}
                </div>
                <div className="text-base font-bold">{nm(sup.name, sup.nameAr)}</div>
                <div className="mt-3 grid gap-2.5 text-[13px] text-ink-600 dark:text-ink-300 sm:grid-cols-2">
                  <span className="flex items-center gap-2"><IcPin className="text-brass-600 dark:text-brass-400" /> {sup.city}</span>
                  <span className="flex items-center gap-2"><IcPhone className="text-brass-600 dark:text-brass-400" /> <span className="tnum" dir="ltr">{sup.phone}</span></span>
                  <span className="flex items-center gap-2"><IcMail className="text-brass-600 dark:text-brass-400" /> {sup.email}</span>
                  <span className="flex items-center gap-2"><IcWarehouse className="text-brass-600 dark:text-brass-400" /> {nm(sup.coverage, sup.coverageAr)}</span>
                </div>
                <div className="mt-4 border-t border-line pt-3 text-[12px] text-ink-400 dark:border-linedark">
                  {t("suppliers.vatReg")} · {t("suppliers.lead", { a: sup.leadDays[0], b: sup.leadDays[1] })}
                </div>
              </Card>
            </div>
          </div>

          {/* related */}
          {related.length > 0 ? (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold tracking-tight">{t("market.related")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/marketplace/${r.id}`}
                    className="group overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-lg dark:border-linedark dark:bg-ink-900"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-fog-100">
                      <Img src={r.img} alt={r.alt} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]" />
                    </div>
                    <div className="p-4">
                      <div className="line-clamp-2 text-sm font-semibold">{nm(r.name, r.nameAr)}</div>
                      <div className="tnum mt-1.5 font-bold">{fmtMoney(r.price, lang)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* RFQ modal */}
          <Modal
            open={rfqOpen}
            onClose={() => setRfqOpen(false)}
            title={t("market.rfqT")}
            sub={`${nm(p.name, p.nameAr)} — ${nm(sup.name, sup.nameAr)}`}
            footer={
              <>
                <Btn variant="ghost" onClick={() => setRfqOpen(false)}>{t("common.cancel")}</Btn>
                <Btn onClick={submitRfq}>
                  <IcPen /> {t("market.rfqSubmit")}
                </Btn>
              </>
            }
          >
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">{t("market.rfqSub")}</p>
            <div className="space-y-4">
              <Field label={t("market.rfqQty")} id="rfq-qty">
                <TextInput
                  id="rfq-qty"
                  type="number"
                  min={1}
                  value={rfqQty}
                  onChange={(e) => setRfqQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
              <Field label={t("market.rfqNote")} id="rfq-note">
                <TextArea id="rfq-note" value={rfqNote} onChange={(e) => setRfqNote(e.target.value)} />
              </Field>
            </div>
          </Modal>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
