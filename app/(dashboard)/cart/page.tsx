"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { productById, supplierById } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Banner,
  Btn,
  Card,
  EmptyState,
  Field,
  Img,
  PageHead,
  TextArea,
  TextInput,
  btnCls,
} from "@/components/ui";
import { IcCart, IcCheck, IcMinus, IcPlus, IcScale, IcX } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function CartPage() {
  const { t, lang } = usePrefs();
  const {
    data,
    cartGroups,
    cartTotals,
    cartSetQty,
    cartRemove,
    cartClear,
    evalRule,
    submitCart,
    toast,
  } = useApp();
  const [note, setNote] = useState("");

  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  const doSubmit = () => {
    const results = submitCart(note.trim());
    results.forEach((r) => {
      if (r.auto) toast(t("cart.placedAuto", { po: r.po }));
      else
        toast(
          t("cart.placedPending", { po: r.po, r: r.required.map((x) => t(`role.${x}`)).join(" + ") }),
          "warn"
        );
    });
    setNote("");
  };

  return (
    <RequireAuth>
      <AppShell active="/cart">
        <Guard roles={HOTEL}>
          <PageHead
            kicker={t("cart.k")}
            title={t("cart.t")}
            sub={t("cart.sub")}
            actions={
              cartGroups.length > 0 ? (
                <Btn variant="ghost" size="sm" onClick={() => { cartClear(); toast(t("toast.cleared")); }}>
                  <IcX className="text-sm" /> {t("cart.clearCart")}
                </Btn>
              ) : undefined
            }
          />

          {cartGroups.length === 0 ? (
            <EmptyState
              icon={<IcCart />}
              title={t("cart.empty")}
              sub={t("cart.emptySub")}
              action={
                <Link href="/marketplace" className={btnCls("primary")}>
                  {t("cart.browse")}
                </Link>
              }
            />
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-3">
              {/* lines */}
              <div className="space-y-5 xl:col-span-2">
                {cartGroups.map((g) => {
                  const sup = supplierById(g.supplierId);
                  return (
                    <Card key={g.supplierId} className="overflow-hidden">
                      <div className="flex items-center justify-between border-b border-line bg-fog-50 px-5 py-3.5 dark:border-linedark dark:bg-ink-850">
                        <div className="text-sm font-semibold">
                          {t("cart.supplierGroup")}:{" "}
                          <span className="text-brass-600 dark:text-brass-400">{sup ? nm(sup.name, sup.nameAr) : ""}</span>
                        </div>
                        <span className="tnum text-sm font-bold">{fmtMoney(g.subtotal, lang)}</span>
                      </div>
                      <ul className="divide-y divide-line dark:divide-linedark">
                        {g.lines.map(({ p, qty }) => {
                          const moq = p.moq;
                          const invalid = qty < moq;
                          return (
                            <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                              <Link href={`/marketplace/${p.id}`} className="block h-16 w-20 shrink-0 overflow-hidden rounded bg-fog-100">
                                <Img src={p.img} alt={p.alt} className="h-full w-full" />
                              </Link>
                              <div className="min-w-0 flex-1">
                                <Link href={`/marketplace/${p.id}`} className="block truncate text-sm font-semibold hover:underline">
                                  {nm(p.name, p.nameAr)}
                                </Link>
                                <div className="tnum mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                                  {p.sku} · {nm(p.unit, p.unitAr)} · {fmtMoney(p.price, lang)}
                                </div>
                                {invalid ? (
                                  <div className="mt-1 text-xs font-medium text-red-700 dark:text-red-400">
                                    {t("market.minOrder", { n: moq, u: nm(p.unit, p.unitAr) })}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center rounded border border-line dark:border-linedark">
                                <button
                                  className="flex h-9 w-9 items-center justify-center text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800"
                                  onClick={() => cartSetQty(p.id, Math.max(1, qty - 1))}
                                  aria-label="-"
                                >
                                  <IcMinus />
                                </button>
                                <input
                                  type="number"
                                  value={qty}
                                  min={1}
                                  onChange={(e) => cartSetQty(p.id, Math.max(0, Number(e.target.value) || 0))}
                                  className="tnum h-9 w-16 border-x border-line bg-transparent text-center text-sm font-semibold outline-none dark:border-linedark"
                                  aria-label={t("common.quantity")}
                                />
                                <button
                                  className="flex h-9 w-9 items-center justify-center text-ink-600 hover:bg-fog-100 dark:text-ink-300 dark:hover:bg-ink-800"
                                  onClick={() => cartSetQty(p.id, qty + 1)}
                                  aria-label="+"
                                >
                                  <IcPlus />
                                </button>
                              </div>
                              <div className="tnum w-28 text-end text-sm font-bold">
                                {fmtMoney(p.price * qty, lang)}
                              </div>
                              <button
                                className="rounded p-2 text-ink-400 hover:bg-red-600/10 hover:text-red-700 dark:hover:text-red-400"
                                onClick={() => {
                                  cartRemove(p.id);
                                  toast(t("toast.cartRem"));
                                }}
                                aria-label={t("cart.remove")}
                              >
                                <IcX />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  );
                })}
              </div>

              {/* review */}
              <Card className="p-5 xl:sticky xl:top-24">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("cart.review")}
                </h2>
                <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">{t("cart.reviewSub")}</p>

                <div className="mt-4 divide-y divide-line rounded-lg border border-line dark:divide-linedark dark:border-linedark">
                  {cartGroups.map((g) => {
                    const rule = evalRule(g.subtotal + Math.round(g.subtotal * 0.14));
                    const total = g.subtotal + Math.round(g.subtotal * 0.14);
                    const auto = !rule || rule.approvers.length === 0;
                    return (
                      <div key={g.supplierId} className="p-4">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-medium">{supplierById(g.supplierId)?.name}</span>
                          <span className="tnum font-bold">{fmtMoney(total, lang)}</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-[12px] text-ink-500 dark:text-ink-400">
                          <IcScale className="mt-0.5 shrink-0 text-brass-600 dark:text-brass-400" />
                          <span>
                            {t("cart.matched")}: <strong>{rule?.name ?? "—"}</strong>
                            <br />
                            {auto ? (
                              <span className="text-emerald-700 dark:text-emerald-400">{t("cart.autoNote")}</span>
                            ) : (
                              <span>
                                {t("cart.approver")}:{" "}
                                <strong>{rule!.approvers.map((r) => t(`role.${r}`)).join(" + ")}</strong>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-ink-500 dark:text-ink-400">
                    <span>{t("common.subtotal")}</span>
                    <span className="tnum font-medium text-ink-950 dark:text-ink-100">{fmtMoney(cartTotals.subtotal, lang)}</span>
                  </div>
                  <div className="flex justify-between text-ink-500 dark:text-ink-400">
                    <span>{t("common.vat")}</span>
                    <span className="tnum font-medium text-ink-950 dark:text-ink-100">{fmtMoney(cartTotals.vat, lang)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold dark:border-linedark">
                    <span>{t("common.grandTotal")}</span>
                    <span className="tnum">{fmtMoney(cartTotals.total, lang)}</span>
                  </div>
                </div>

                {cartGroups.length > 1 ? (
                  <Banner tone="info" className="mt-4">
                    {t("cart.multiNote", { n: cartGroups.length })}
                  </Banner>
                ) : null}

                <div className="mt-5">
                  <Field label={t("cart.submitNote")} id="cart-note">
                    <TextArea id="cart-note" value={note} onChange={(e) => setNote(e.target.value)} />
                  </Field>
                </div>
                <Btn size="lg" className="mt-5 w-full" onClick={doSubmit}>
                  <IcCheck /> {t("cart.submit")}
                </Btn>
              </Card>
            </div>
          )}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
