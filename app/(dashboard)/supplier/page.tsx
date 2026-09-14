"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { CATEGORIES, hotelById, productById } from "@/lib/data";
import { fmtDate, fmtMoney, relDay } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Btn,
  Card,
  EmptyState,
  PageHead,
  Stat,
  StatePill,
  T,
  Td,
  Th,
  btnCls,
} from "@/components/ui";
import { IcArrow, IcBox, IcCheck, IcInvoice, IcPen } from "@/components/icons";

export default function SupplierCentralPage() {
  const { t, lang } = usePrefs();
  const { data, user, advanceFulfillment, toast } = useApp();
  const orgId = user?.orgId ?? "";

  const orders = useMemo(() => data.orders.filter((o) => o.supplierId === orgId), [data.orders, orgId]);
  const open = orders.filter((o) => o.approval.state !== "rejected" && o.fulfillment !== "delivered");
  const needAck = orders.filter((o) => o.approval.state !== "rejected" && o.fulfillment === "none");
  const myDeliveries = data.deliveries.filter((d) => orders.some((o) => o.id === d.orderId));
  const delivered = myDeliveries.filter((d) => d.status === "delivered");
  const onTime = delivered.length ? Math.round((delivered.filter((d) => !d.delayed).length / delivered.length) * 100) : 100;
  const outstanding = data.invoices
    .filter((i) => i.supplierId === orgId && (i.status === "submitted" || i.status === "approved"))
    .reduce((a, i) => a + i.total, 0);
  const rfqs = data.rfqs.filter((r) => r.supplierId === orgId);

  /* ---- supplier value telemetry, computed from live workspace data ---- */
  const pipeline = [
    { l: t("central.needAck"), n: orders.filter((o) => o.fulfillment === "none" && o.approval.state !== "rejected").length },
    { l: t("state.acknowledged"), n: orders.filter((o) => o.fulfillment === "acknowledged").length },
    { l: t("state.preparing"), n: orders.filter((o) => o.fulfillment === "preparing").length },
    { l: t("state.in_transit"), n: orders.filter((o) => ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
    { l: t("state.delivered"), n: orders.filter((o) => o.fulfillment === "delivered").length },
  ];
  const maxPipe = Math.max(1, ...pipeline.map((x) => x.n));

  const myInvoices = data.invoices.filter((i) => i.supplierId === orgId);
  const deliveredValue = orders
    .filter((o) => o.fulfillment === "delivered")
    .reduce((a, o) => a + o.total, 0);
  const invoicedValue = myInvoices.reduce((a, i) => a + i.total, 0);
  const settledValue = myInvoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.total, 0);
  const exceptions = myDeliveries.reduce((a, d) => a + d.exceptions.length, 0);

  const coverage = CATEGORIES.map((c) => ({
    id: c.id,
    l: lang === "ar" ? c.nameAr : c.name,
    n: data.products.filter((p) => p.supplierId === orgId && p.categoryId === c.id).length,
  })).filter((c) => c.n > 0);
  const maxCov = Math.max(1, ...coverage.map((c) => c.n));


  return (
    <RequireAuth>
      <AppShell active="/supplier-central">
        <Guard roles={["supplier_manager"]}>
          <PageHead kicker={t("central.k")} title={t("central.t")} sub={t("central.sub")} />

          <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("central.open")} value={open.length} tone="info" />
            <Stat label={t("central.needAck")} value={needAck.length} tone={needAck.length ? "warn" : "ok"} />
            <Stat label={t("central.onTime")} value={`${onTime}%`} tone={onTime >= 80 ? "ok" : "warn"} />
            <Stat label={t("central.outstanding")} value={fmtMoney(outstanding, lang)} tone="brass" />
          </div>


          {/* ---- supplier value telemetry ---- */}
          <section className="mt-6 grid grid-air-lg lg:grid-cols-3">
            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "خط الطلبات" : "Demand pipeline"}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "كل طلب وارد عبر نفس المراحل المدققة، من التأكيد حتى التسليم."
                  : "Every incoming order moves through the same audited stages, acknowledgment to delivery."}
              </p>
              <div className="mt-5 space-y-3">
                {pipeline.map((s) => (
                  <div key={s.l}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{s.l}</span>
                      <span className="tnum text-ink-500">{s.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div className="h-full rounded-full bg-ink-950 dark:bg-white" style={{ width: `${(s.n / maxPipe) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "موثوقية الخدمة" : "Service reliability"}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "الالتزام بمواعيد التسليم والاستثناءات المسجّلة على توصيلاتك."
                  : "On-time performance and recorded exceptions across your deliveries."}
              </p>
              <div className="tnum mt-5 text-4xl font-bold leading-none tracking-tight">{onTime}%</div>
              <div className="mt-1 text-[12px] text-ink-500 dark:text-ink-400">
                {t("central.onTime")} · {delivered.length} {lang === "ar" ? "توصيلة مكتملة" : "completed deliveries"}
              </div>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                <div className="flex justify-between">
                  <dt className="text-ink-500">{t("state.exception")}</dt>
                  <dd className="tnum font-semibold">{exceptions}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "توصيلات متأخرة" : "Delayed deliveries"}</dt>
                  <dd className="tnum font-semibold">{myDeliveries.filter((d) => d.delayed).length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "طلبات عرض واردة" : "Incoming RFQs"}</dt>
                  <dd className="tnum font-semibold">{rfqs.length}</dd>
                </div>
              </dl>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "التحصيل وغطاء الكتالوج" : "Collections & catalog coverage"}
              </div>
              <dl className="mt-4 space-y-3">
                {[
                  { k: lang === "ar" ? "قيمة مسلَّمة" : "Delivered value", v: fmtMoney(deliveredValue, lang) },
                  { k: lang === "ar" ? "مُفوتر" : "Invoiced", v: fmtMoney(invoicedValue, lang) },
                  { k: lang === "ar" ? "مُستوفى" : "Settled", v: fmtMoney(settledValue, lang) },
                  { k: t("central.outstanding"), v: fmtMoney(outstanding, lang) },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-ink-500">{r.k}</dt>
                    <dd className="tnum text-sm font-bold">{r.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 border-t border-line pt-4 dark:border-linedark">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                  {lang === "ar" ? "غطاء الفئات" : "Category coverage"}
                </div>
                <div className="space-y-2.5">
                  {coverage.length === 0 ? (
                    <p className="text-[13px] text-ink-400">{t("common.noData")}</p>
                  ) : (
                    coverage.map((c) => (
                      <div key={c.id}>
                        <div className="mb-1 flex items-center justify-between text-[13px]">
                          <span className="font-medium">{c.l}</span>
                          <span className="tnum text-ink-500">{c.n}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                          <div className="h-full rounded-full bg-brass-500" style={{ width: `${(c.n / maxCov) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </section>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
            {/* incoming */}
            <Card className="overflow-hidden xl:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-linedark">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcBox /> {t("central.incoming")}
                </h2>
                <Link href="/supplier-central/orders" className="text-xs font-medium text-brass-600 hover:underline dark:text-brass-400">
                  {t("common.viewAll")}
                </Link>
              </div>
              {orders.filter((o) => o.approval.state !== "rejected").length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={<IcBox />} title={t("central.noIncoming")} />
                </div>
              ) : (
                <T minWidth="min-w-[640px]">
                  <thead>
                    <tr>
                      <Th>{t("orders.col.po")}</Th>
                      <Th>{t("login.org")}</Th>
                      <Th className="text-end">{t("orders.col.amount")}</Th>
                      <Th>{t("orders.col.fulfillment")}</Th>
                      <Th>{t("common.actions")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => o.approval.state !== "rejected")
                      .slice(0, 6)
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                          <Td>
                            <Link href={`/supplier-central/orders/${o.id}`} className="font-semibold hover:underline">
                              {o.po}
                            </Link>
                            <div className="tnum text-xs text-ink-400">{fmtDate(o.createdAt, lang)}</div>
                          </Td>
                          <Td className="text-[13px]">{hotelById(o.hotelId)?.name}</Td>
                          <Td className="tnum text-end font-semibold">{fmtMoney(o.total, lang)}</Td>
                          <Td>{o.fulfillment === "none" ? <StatePill s="pending" label={t("state.not_started")} /> : <StatePill s={o.fulfillment} />}</Td>
                          <Td className="text-end">
                            {o.fulfillment === "none" ? (
                              <Btn
                                size="sm"
                                variant="subtle"
                                onClick={() => {
                                  advanceFulfillment(o.id);
                                  toast(t("orders.detail.ackDone", { s: user?.name ?? "" }));
                                }}
                              >
                                <IcCheck /> {t("dash.ack")}
                              </Btn>
                            ) : (
                              <Link href={`/supplier-central/orders/${o.id}`} className={btnCls("outline", "sm")}>
                                {t("common.view")}
                              </Link>
                            )}
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </T>
              )}
            </Card>

            {/* RFQs */}
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcPen /> RFQ
              </h2>
              {rfqs.length === 0 ? (
                <p className="text-sm text-ink-400">{t("common.noData")}</p>
              ) : (
                <ul className="space-y-3">
                  {rfqs.map((r) => {
                    const p = productById(r.productId);
                    return (
                      <li key={r.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{p ? (lang === "ar" ? p.nameAr : p.name) : r.productId}</span>
                          <StatePill s={r.status} label="RFQ" />
                        </div>
                        <div className="tnum mt-1 text-xs text-ink-500">
                          {hotelById(r.hotelId)?.name} · {r.qty} {lang === "ar" ? "وحدة" : "units"} · {relDay(r.at, lang)}
                        </div>
                        {r.note ? <p className="mt-2 text-[13px] italic text-ink-500 dark:text-ink-400">“{r.note}”</p> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Link href="/supplier-central/catalog" className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900">
              <div>
                <div className="text-[15px] font-semibold">{t("nav.catalog")}</div>
                <div className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                  {data.products.filter((p) => p.supplierId === orgId).length} {t("home.prodCount")}
                </div>
              </div>
              <IcArrow className="text-xl text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link href="/invoices" className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900">
              <div>
                <div className="text-[15px] font-semibold">{t("nav.invoices")}</div>
                <div className="tnum mt-1 text-[13px] text-ink-500 dark:text-ink-400">{fmtMoney(outstanding, lang)}</div>
              </div>
              <IcInvoice className="text-xl text-ink-300" />
            </Link>
            <Link href="/eta-compliance" className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900">
              <div>
                <div className="text-[15px] font-semibold">{t("nav.eta")}</div>
                <div className="tnum mt-1 text-[13px] text-ink-500 dark:text-ink-400">{myDeliveries.length} {lang === "ar" ? "توصيلة" : "deliveries"}</div>
              </div>
              <IcArrow className="text-xl text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
