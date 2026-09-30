"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
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
import { IcArrow, IcBox, IcCheck, IcInvoice, IcPen } from "@/components/ui/icons";
import { useApi } from "@/lib/hooks/use-api";

function fmtDate(date: string | undefined, lang: string): string {
  if (!date) return "";
  const d = new Date(date);
  return lang === "ar"
    ? d.toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" })
    : d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(amount: number, lang: string): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Order {
  id: string;
  po: string;
  createdAt: string;
  total: number;
  fulfillment: string;
  approval: { state: string };
  hotelId: string;
  supplierId: string;
  status: string;
}

interface Invoice {
  id: string;
  supplierId: string;
  total: number;
  status: string;
}

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  delayed: boolean;
  exceptions: string[];
}

interface RFQ {
  id: string;
  productId: string;
  hotelId: string;
  supplierId: string;
  qty: number;
  status: string;
  at: string;
  note?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr: string;
  supplierId: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

interface Hotel {
  id: string;
  name: string;
}

export default function SupplierCentralPage() {
  const { t, lang } = usePrefs();
  const userId = typeof window !== "undefined" ? localStorage.getItem("hv_user_id") : null;
  const orgId = userId ?? "";

  const { data: ordersData, loading: ordersLoading } = useApi<{ orders: Order[] }>(
    "/api/v1/orders"
  );
  const { data: invoicesData, loading: invoicesLoading } = useApi<{ invoices: Invoice[] }>(
    "/api/v1/invoices"
  );
  const { data: deliveriesData, loading: deliveriesLoading } = useApi<{ deliveries: Delivery[] }>(
    "/api/v1/shipping/deliveries"
  );
  const { data: rfqsData, loading: rfqsLoading } = useApi<{ rfqs: RFQ[] }>("/api/v1/rfq");
  const { data: productsData, loading: productsLoading } = useApi<{ products: Product[] }>(
    "/api/v1/products"
  );
  const { data: categoriesData, loading: categoriesLoading } = useApi<{ categories: Category[] }>(
    "/api/v1/categories"
  );
  const { data: hotelsData, loading: hotelsLoading } = useApi<{ hotels: Hotel[] }>("/api/v1/hotels");

  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);
  const invoices = useMemo(() => invoicesData?.invoices ?? [], [invoicesData]);
  const deliveries = useMemo(() => deliveriesData?.deliveries ?? [], [deliveriesData]);
  const rfqs = useMemo(() => rfqsData?.rfqs ?? [], [rfqsData]);
  const products = useMemo(() => productsData?.products ?? [], [productsData]);
  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData]);
  const hotels = useMemo(() => hotelsData?.hotels ?? [], [hotelsData]);

  const myOrders = useMemo(
    () => orders.filter((o) => o.supplierId === orgId || !orgId),
    [orders, orgId]
  );
  const openOrders = useMemo(
    () => myOrders.filter((o) => o.approval.state !== "rejected" && o.fulfillment !== "delivered"),
    [myOrders]
  );
  const needAckOrders = useMemo(
    () => myOrders.filter((o) => o.approval.state !== "rejected" && o.fulfillment === "none"),
    [myOrders]
  );
  const myDeliveries = useMemo(
    () => deliveries.filter((d) => myOrders.some((o) => o.id === d.orderId)),
    [deliveries, myOrders]
  );
  const deliveredDeliveries = useMemo(
    () => myDeliveries.filter((d) => d.status === "delivered"),
    [myDeliveries]
  );
  const onTimePercent = deliveredDeliveries.length
    ? Math.round(
        (deliveredDeliveries.filter((d) => !d.delayed).length / deliveredDeliveries.length) * 100
      )
    : 100;
  const outstandingInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => i.supplierId === orgId && (i.status === "submitted" || i.status === "approved")
      ).reduce((a, i) => a + i.total, 0),
    [invoices, orgId]
  );
  const myRFQs = useMemo(() => rfqs.filter((r) => r.supplierId === orgId || !orgId), [rfqs, orgId]);
  const myInvoices = useMemo(() => invoices.filter((i) => i.supplierId === orgId || !orgId), [invoices, orgId]);
  const deliveredValue = useMemo(
    () => myOrders.filter((o) => o.fulfillment === "delivered").reduce((a, o) => a + o.total, 0),
    [myOrders]
  );
  const invoicedValue = useMemo(() => myInvoices.reduce((a, i) => a + i.total, 0), [myInvoices]);
  const settledValue = useMemo(
    () => myInvoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.total, 0),
    [myInvoices]
  );
  const exceptionsCount = useMemo(
    () => myDeliveries.reduce((a, d) => a + d.exceptions.length, 0),
    [myDeliveries]
  );

  const pipeline = useMemo(
    () => [
      { l: t("central.needAck"), n: myOrders.filter((o) => o.fulfillment === "none" && o.approval.state !== "rejected").length },
      { l: t("state.acknowledged"), n: myOrders.filter((o) => o.fulfillment === "acknowledged").length },
      { l: t("state.preparing"), n: myOrders.filter((o) => o.fulfillment === "preparing").length },
      { l: t("state.in_transit"), n: myOrders.filter((o) => ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
      { l: t("state.delivered"), n: myOrders.filter((o) => o.fulfillment === "delivered").length },
    ],
    [myOrders, t]
  );
  const maxPipe = Math.max(1, ...pipeline.map((x) => x.n));

  const coverage = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        l: lang === "ar" ? c.nameAr : c.name,
        n: products.filter((p) => p.supplierId === orgId || !orgId && p.categoryId === c.id).length,
      })).filter((c) => c.n > 0),
    [categories, products, lang, orgId]
  );
  const maxCov = Math.max(1, ...coverage.map((c) => c.n));

  const hotelById = (id: string) => hotels.find((h) => h.id === id);

  const allLoading = ordersLoading || invoicesLoading || deliveriesLoading || rfqsLoading || productsLoading || categoriesLoading || hotelsLoading;

  return (
    <RequireAuth>
      <AppShell active="/supplier-central">
        <Guard roles={["supplier_manager"]}>
          <PageHead kicker={t("central.k")} title={t("central.t")} sub={t("central.sub")} />

          <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("central.open")} value={openOrders.length} tone="info" />
            <Stat label={t("central.needAck")} value={needAckOrders.length} tone={needAckOrders.length ? "warn" : "ok"} />
            <Stat label={t("central.onTime")} value={`${onTimePercent}%`} tone={onTimePercent >= 80 ? "ok" : "warn"} />
            <Stat label={t("central.outstanding")} value={fmtMoney(outstandingInvoices, lang)} tone="brass" />
          </div>

          {allLoading ? (
            <div className=" mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className=" pad-card-lg">
                  <div className="h-4 rounded w-3/4 skeleton" />
                  <div className="mt-2 h-3 rounded w-1/2 skeleton" />
                </Card>
              ))}
            </div>
          ) : (
            <section className="mt-6 grid grid-air-lg lg:grid-cols-3">
              <Card className=" pad-card-lg">
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
                        <div
                          className="h-full rounded-full bg-ink-950 dark:bg-white"
                          style={{ width: `${(s.n / maxPipe) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className=" pad-card-lg">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                  {lang === "ar" ? "موثوقية الخدمة" : "Service reliability"}
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                  {lang === "ar"
                    ? "الالتزام بمواعيد التسليم والاستثناءات المسجّلة على توصيلاتك."
                    : "On-time performance and recorded exceptions across your deliveries."}
                </p>
                <div className="tnum mt-5 text-4xl font-bold leading-none tracking-tight">{onTimePercent}%</div>
                <div className="mt-1 text-[12px] text-ink-500 dark:text-ink-400">
                  {t("central.onTime")} · {deliveredDeliveries.length} {lang === "ar" ? "توصيلة مكتملة" : "completed deliveries"}
                </div>
                <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                  <div className="flex justify-between">
                    <dt className="text-ink-500">{t("state.exception")}</dt>
                    <dd className="tnum font-semibold">{exceptionsCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">{lang === "ar" ? "توصيلات متأخرة" : "Delayed deliveries"}</dt>
                    <dd className="tnum font-semibold">{myDeliveries.filter((d) => d.delayed).length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">{lang === "ar" ? "طلبات عرض واردة" : "Incoming RFQs"}</dt>
                    <dd className="tnum font-semibold">{myRFQs.length}</dd>
                  </div>
                </dl>
              </Card>

              <Card className=" pad-card-lg">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                  {lang === "ar" ? "التحصيل وغطاء الكتالوج" : "Collections & catalog coverage"}
                </div>
                <dl className="mt-4 space-y-3">
                  {[
                    { k: lang === "ar" ? "قيمة مسلَّمة" : "Delivered value", v: fmtMoney(deliveredValue, lang) },
                    { k: lang === "ar" ? "مُفوتر" : "Invoiced", v: fmtMoney(invoicedValue, lang) },
                    { k: lang === "ar" ? "مُستوفى" : "Settled", v: fmtMoney(settledValue, lang) },
                    { k: t("central.outstanding"), v: fmtMoney(outstandingInvoices, lang) },
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
                            <div
                              className="h-full rounded-full bg-brass-500"
                              style={{ width: `${(c.n / maxCov) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </section>
          )}

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
            <Card className="overflow-hidden xl:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-linedark">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcBox /> {t("central.incoming")}
                </h2>
                <Link
                  href="/supplier-central/orders"
                  className="text-xs font-medium text-brass-600 hover:underline dark:text-brass-400"
                >
                  {t("common.viewAll")}
                </Link>
              </div>
              {openOrders.length === 0 ? (
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
                    {openOrders.slice(0, 6).map((o) => (
                      <tr key={o.id} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                        <Td>
                          <Link href={`/supplier-central/orders/${o.id}`} className="font-semibold hover:underline">
                            {o.po}
                          </Link>
                          <div className="tnum text-xs text-ink-400">{fmtDate(o.createdAt, lang)}</div>
                        </Td>
                        <Td className="text-[13px]">{hotelById(o.hotelId)?.name ?? o.hotelId}</Td>
                        <Td className="tnum text-end font-semibold">{fmtMoney(o.total, lang)}</Td>
                        <Td>
                          {o.fulfillment === "none" ? (
                            <StatePill s="pending" label={t("state.not_started")} />
                          ) : (
                            <StatePill s={o.fulfillment} />
                          )}
                        </Td>
                        <Td className="text-end">
                          {o.fulfillment === "none" ? (
                            <Btn size="sm" variant="subtle">
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

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcPen /> RFQ
              </h2>
              {myRFQs.length === 0 ? (
                <p className="text-sm text-ink-400">{t("common.noData")}</p>
              ) : (
                <ul className="space-y-3">
                  {myRFQs.map((r) => {
                    const p = products.find((p) => p.id === r.productId);
                    return (
                      <li key={r.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {p ? (lang === "ar" ? p.nameAr : p.name) : r.productId}
                          </span>
                          <StatePill s={r.status} label="RFQ" />
                        </div>
                        <div className="tnum mt-1 text-xs text-ink-500">
                          {hotelById(r.hotelId)?.name ?? r.hotelId} · {r.qty} {lang === "ar" ? "وحدة" : "units"} · {fmtDate(r.at, lang)}
                        </div>
                        {r.note ? <p className="mt-2 text-[13px] italic text-ink-500 dark:text-ink-400">"{r.note}"</p> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Link
              href="/supplier-central/catalog"
              className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900"
            >
              <div>
                <div className="text-[15px] font-semibold">{t("nav.catalog")}</div>
                <div className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                  {products.filter((p) => p.supplierId === orgId || !orgId).length} {t("home.prodCount")}
                </div>
              </div>
              <IcArrow className="text-xl text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/invoices"
              className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900"
            >
              <div>
                <div className="text-[15px] font-semibold">{t("nav.invoices")}</div>
                <div className="tnum mt-1 text-[13px] text-ink-500 dark:text-ink-400">{fmtMoney(outstandingInvoices, lang)}</div>
              </div>
              <IcInvoice className="text-xl text-ink-300" />
            </Link>
            <Link
              href="/eta-compliance"
              className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900"
            >
              <div>
                <div className="text-[15px] font-semibold">{t("nav.eta")}</div>
                <div className="tnum mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                  {myDeliveries.length} {lang === "ar" ? "توصيلة" : "deliveries"}
                </div>
              </div>
              <IcArrow className="text-xl text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
