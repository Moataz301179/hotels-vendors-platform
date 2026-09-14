"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { canApprove, useApp } from "@/lib/store";
import { carrierById, hotelById, supplierById } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtMoney, relDay } from "@/lib/format";
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
import {
  IcArrow,
  IcBox,
  IcCard,
  IcCheck,
  IcInvoice,
  IcTruck,
  IcUsers,
  IcAlert,
  IcHistory,
} from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function DashboardPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();

  if (!user) return null;
  const isHotel = HOTEL.includes(user.role);
  const hotelId = user.orgId;
  const myOrders = isHotel
    ? data.orders.filter((o) => o.hotelId === hotelId)
    : user.role === "supplier_manager"
      ? data.orders.filter((o) => o.supplierId === hotelId)
      : data.orders;

  const openOrders = myOrders.filter(
    (o) => o.approval.state !== "rejected" && o.fulfillment !== "delivered" && o.receipt !== "complete"
  );
  const pendingApproval = myOrders.filter((o) => o.approval.state === "pending");
  const inTransit = data.deliveries.filter(
    (d) =>
      (d.status === "in_transit" || d.status === "out_for_delivery") &&
      (user.role === "carrier"
        ? d.carrierId === user.orgId
        : myOrders.some((o) => o.id === d.orderId))
  );
  const openInvoices = data.invoices.filter(
    (i) =>
      (i.status === "submitted" || i.status === "approved") &&
      (user.role === "supplier_manager" ? i.supplierId === hotelId : i.hotelId === hotelId)
  );

  const delivered = data.deliveries.filter((d) => d.status === "delivered");
  const onTimeRate = delivered.length
    ? Math.round((delivered.filter((d) => !d.delayed).length / delivered.length) * 100)
    : 100;

  /* ---- value-proposition telemetry, all computed from live workspace data ---- */
  const valueMix = (() => {
    const valid = myOrders.filter((o) => o.approval.state !== "rejected");
    const m = new Map<string, number>();
    valid.forEach((o) => m.set(o.supplierId, (m.get(o.supplierId) ?? 0) + o.total));
    const arr = [...m.entries()]
      .map(([id, v]) => ({ id, name: supplierById(id)?.name ?? id, v }))
      .sort((a, b) => b.v - a.v);
    const total = arr.reduce((a, x) => a + x.v, 0);
    return { arr, total: total || 1 };
  })();

  const authority = (() => {
    const valid = myOrders.filter((o) => o.approval.state !== "rejected");
    const covered = valid.filter((o) => !!o.ruleId).length;
    return {
      covered,
      valid: valid.length,
      coverage: valid.length ? Math.round((covered / valid.length) * 100) : 0,
      auto: valid.filter((o) => o.approval.state === "auto").length,
      decided: valid.filter((o) => o.approval.state === "approved").length,
      pending: valid.filter((o) => o.approval.state === "pending").length,
      rejected: myOrders.filter((o) => o.approval.state === "rejected").length,
    };
  })();

  const match = (() => {
    const valid = myOrders.filter((o) => o.approval.state !== "rejected");
    const invoiced = new Set(
      data.invoices.filter((i) => i.hotelId === hotelId).map((i) => i.orderId)
    );
    const grn = valid.filter((o) => o.receipt !== "none").length;
    const inv = valid.filter((o) => invoiced.has(o.id)).length;
    const full = valid.filter((o) => o.receipt === "complete" && invoiced.has(o.id)).length;
    return { issued: valid.length, grn, inv, full };
  })();

  const dateStr = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <RequireAuth>
      <AppShell active="/dashboard">
        <Guard roles={["hotel_admin", "gm", "finance_director", "supplier_manager", "partner_officer", "carrier", "platform_admin"]}>
          <PageHead
            kicker={t("dash.kpis")}
            title={`${t("dash.hello")}, ${user.name.split(" ")[0]}`}
            sub={dateStr}
          />

          {/* KPIs */}
          <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
            {isHotel ? (
              <>
                <Stat label={t("analytics.openOrders")} value={openOrders.length} tone="info" />
                <Stat
                  label={t("dash.pendingApproval")}
                  value={pendingApproval.length}
                  tone={pendingApproval.length ? "warn" : "ok"}
                  sub={pendingApproval.length ? t("state.pending") : t("common.noData")}
                />
                <Stat label={t("dash.inTransit")} value={inTransit.length} tone="sky" />
                <Stat
                  label={t("dash.openInvoices")}
                  value={fmtMoney(openInvoices.reduce((a, i) => a + i.total, 0), lang)}
                  tone="brass"
                />
              </>
            ) : user.role === "supplier_manager" ? (
              <>
                <Stat label={t("central.open")} value={openOrders.length} tone="info" />
                <Stat
                  label={t("central.needAck")}
                  value={myOrders.filter((o) => o.fulfillment === "none").length}
                  tone="warn"
                />
                <Stat label={t("central.onTime")} value={`${onTimeRate}%`} tone={onTimeRate >= 80 ? "ok" : "warn"} />
                <Stat
                  label={t("central.outstanding")}
                  value={fmtMoney(openInvoices.reduce((a, i) => a + i.total, 0), lang)}
                  tone="brass"
                />
              </>
            ) : user.role === "partner_officer" ? (
              <>
                <Stat label={t("financing.partnerQueue")} value={data.financing.filter((f) => f.status === "under_review").length} tone="warn" />
                <Stat label={t("financing.totalFinanced")} value={fmtMoney(data.financing.filter((f) => f.status === "funded").reduce((a, f) => a + f.amount, 0), lang)} tone="ok" />
                <Stat label={t("financing.activeApps")} value={data.financing.filter((f) => f.status === "under_review" || f.status === "submitted").length} tone="info" />
                <Stat label={t("dash.adminTenants")} value={data.tenants.filter((x) => x.status === "active").length} tone="mute" />
              </>
            ) : user.role === "carrier" ? (
              <>
                <Stat label={t("dash.carrierActive")} value={inTransit.length} tone="info" />
                <Stat label={t("analytics.delivered")} value={data.deliveries.filter((d) => d.carrierId === user.orgId && d.status === "delivered").length} tone="ok" />
                <Stat label={t("central.onTime")} value={`${onTimeRate}%`} tone={onTimeRate >= 80 ? "ok" : "warn"} />
                <Stat label={t("dash.adminCompliance")} value={data.deliveries.filter((d) => d.delayed && d.status !== "delivered").length} tone="bad" />
              </>
            ) : (
              <>
                <Stat label={t("dash.adminTenants")} value={data.tenants.filter((x) => x.status === "active").length} tone="ok" />
                <Stat label={t("admin.kpiUsers")} value={15} tone="mute" />
                <Stat label={t("dash.adminOpen")} value={data.orders.filter((o) => o.approval.state !== "rejected" && o.receipt !== "complete").length} tone="info" />
                <Stat label={t("dash.adminCompliance")} value={data.deliveries.filter((d) => d.delayed && d.status !== "delivered").length} tone="warn" />
              </>
            )}
          </div>


          {/* ---- value propositions, measured ---- */}
          <section className="mt-6 grid grid-air-lg lg:grid-cols-3">
            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "حياد المورّدين" : "Supplier-neutral mix"}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "توزيع الإنفاق على كل مورّد — المنصة لا تفضّل طرفاً."
                  : "Spend spread across every supplier on the network — the platform takes no side."}
              </p>
              <div className="mt-5 space-y-3.5">
                {valueMix.arr.length === 0 ? (
                  <p className="text-sm text-ink-400">{t("common.noData")}</p>
                ) : (
                  valueMix.arr.map((x) => (
                    <div key={x.id}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="truncate font-medium">{x.name}</span>
                        <span className="tnum ms-2 shrink-0 text-ink-500">
                          {Math.round((x.v / valueMix.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${(x.v / valueMix.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "تحكم المشتريات" : "Authority control"}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "كل أمر يُقيَّم مقابل مصفوفة الصلاحيات ويُسجَّل في سجل التدقيق."
                  : "Every order is evaluated against the authority matrix and written to the audit log."}
              </p>
              <div className="tnum mt-5 text-4xl font-bold leading-none tracking-tight">
                {authority.coverage}%
              </div>
              <div className="mt-1 text-[12px] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "من الطلبات مطابقة لقاعدة صلاحيات" : "of orders matched to a rule"}
              </div>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                {[
                  { k: lang === "ar" ? "اعتماد تلقائي" : "Auto-approved", v: authority.auto },
                  { k: lang === "ar" ? "معتمد" : "Approved", v: authority.decided },
                  { k: lang === "ar" ? "بانتظار الاعتماد" : "Awaiting approval", v: authority.pending },
                  { k: lang === "ar" ? "مرفوض" : "Rejected", v: authority.rejected },
                ].map((r) => (
                  <div key={r.k} className="flex justify-between">
                    <dt className="text-ink-500">{r.k}</dt>
                    <dd className="font-semibold">{r.v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/orders" className={`${btnCls("outline", "sm")} mt-5 w-full`}>
                {t("dash.qaOrders")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "المطابقة الثلاثية" : "Three-way match"}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "أمر الشراء ↔ سند الاستلام ↔ الفاتورة، بنداً بنداً قبل التسوية."
                  : "Purchase order ↔ goods receipt ↔ invoice, matched line by line before settlement."}
              </p>
              <ol className="mt-5 space-y-3">
                {[
                  { l: lang === "ar" ? "أوامر شراء مُصدَرة" : "POs issued", v: match.issued },
                  { l: lang === "ar" ? "سند استلام مسجّل" : "GRN recorded", v: match.grn },
                  { l: lang === "ar" ? "فواتير مرتبطة" : "Invoices linked", v: match.inv },
                  { l: lang === "ar" ? "مطابقة كاملة" : "Fully matched", v: match.full },
                ].map((r, i) => (
                  <li key={r.l} className="flex items-center gap-3">
                    <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[11px] font-bold text-brass-300 dark:bg-white/10">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[13px]">{r.l}</span>
                    <span className="tnum text-sm font-bold">{r.v}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-line pt-4 text-[12px] text-ink-500 dark:border-linedark dark:text-ink-400">
                {lang === "ar"
                  ? "الفواتير المطابقة بالكامل مؤهلة للانتقال إلى شريك التمويل المرخّص."
                  : "Fully matched invoices are eligible for licensed financing-partner handoff."}
              </div>
              <Link href="/financing" className={`${btnCls("outline", "sm")} mt-4 w-full`}>
                {t("nav.financing")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </Card>
          </section>

          <div className="mt-6 grid grid-air-lg xl:grid-cols-3">
            {/* column 1: role queue */}
            <Card className="p-5 xl:col-span-1">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {isHotel ? t("dash.approvalsForYou") : user.role === "supplier_manager" ? t("dash.supplierNeeds") : user.role === "partner_officer" ? t("dash.partnerQueue") : t("dash.carrierActive")}
              </h2>

              {isHotel ? (
                pendingApproval.length === 0 ? (
                  <p className="text-sm text-ink-400">{t("dash.noApprovals")}</p>
                ) : (
                  <ul className="space-y-3">
                    {pendingApproval.map((o) => (
                      <li key={o.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/orders/${o.id}`} className="text-sm font-semibold hover:underline">
                            {o.po}
                          </Link>
                          <StatePill s="pending" />
                        </div>
                        <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                          {supplierById(o.supplierId)?.name} · {o.lines.length} {t("common.items")}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="tnum text-sm font-bold">{fmtMoney(o.total, lang)}</span>
                          <div className="flex gap-2">
                            {canApprove(user, o.approval.required) ? (
                              <Link href={`/orders/${o.id}`} className={btnCls("primary", "sm")}>
                                {t("dash.goApprove")}
                              </Link>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                {o.approval.required.map((r) => t(`role.${r}`)).join(" + ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : user.role === "supplier_manager" ? (
                myOrders.filter((o) => o.approval.state !== "rejected" && o.fulfillment === "none").length === 0 ? (
                  <p className="text-sm text-ink-400">{t("dash.noNeeds")}</p>
                ) : (
                  <ul className="space-y-3">
                    {myOrders
                      .filter((o) => o.approval.state !== "rejected" && o.fulfillment === "none")
                      .map((o) => (
                        <li key={o.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                          <div className="flex items-center justify-between">
                            <Link href={`/supplier-central/orders/${o.id}`} className="text-sm font-semibold hover:underline">
                              {o.po}
                            </Link>
                            <span className="tnum text-sm font-bold">{fmtMoney(o.total, lang)}</span>
                          </div>
                          <div className="mt-1 text-xs text-ink-500">{hotelById(o.hotelId)?.name}</div>
                          <Link href={`/supplier-central/orders/${o.id}`} className={`${btnCls("subtle", "sm")} mt-3 w-full`}>
                            <IcCheck /> {t("dash.ack")}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )
              ) : user.role === "partner_officer" ? (
                data.financing.filter((f) => f.status === "under_review").length === 0 ? (
                  <p className="text-sm text-ink-400">{t("dash.noNeeds")}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.financing
                      .filter((f) => f.status === "under_review")
                      .map((f) => (
                        <li key={f.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{f.number}</span>
                            <StatePill s="under_review" />
                          </div>
                          <div className="mt-1 text-xs text-ink-500">
                            {hotelById(f.hotelId)?.name} · {f.tenor} {lang === "ar" ? "شهر" : "mo"}
                          </div>
                          <div className="tnum mt-2 text-sm font-bold">{fmtMoney(f.amount, lang)}</div>
                          <Link href="/financing" className={`${btnCls("primary", "sm")} mt-3 w-full`}>
                            {t("financing.approveApp")}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )
              ) : inTransit.length === 0 ? (
                <p className="text-sm text-ink-400">{t("dash.noCarrier")}</p>
              ) : (
                <ul className="space-y-3">
                  {inTransit.map((d) => (
                    <li key={d.id} className="rounded-lg border border-line p-4 dark:border-linedark">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{d.id}</span>
                        <StatePill s={d.status} />
                      </div>
                      <div className="mt-1 text-xs text-ink-500">
                        {lang === "ar" ? d.destinationAr : d.destination}
                      </div>
                      <div className="tnum mt-1 text-[13px] font-medium text-brass-700 dark:text-brass-300">
                        ETA {fmtDateTime(d.eta, lang)} · {relDay(d.eta, lang)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* column 2: in transit / deliveries */}
            <Card className="overflow-hidden xl:col-span-1">
              <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-linedark">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcTruck /> {t("dash.transitNow")}
                </h2>
                <Link
                  href="/eta-compliance"
                  className="text-xs font-medium text-brass-600 hover:underline dark:text-brass-400"
                >
                  {t("common.viewAll")}
                </Link>
              </div>
              {inTransit.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={<IcTruck />} title={t("eta.empty")} sub={t("eta.emptySub")} />
                </div>
              ) : (
                <T minWidth="min-w-[420px]">
                  <thead>
                    <tr>
                      <Th>{t("eta.col.id")}</Th>
                      <Th>{t("eta.col.carrier")}</Th>
                      <Th className="text-end">{t("eta.col.eta")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {inTransit.map((d) => (
                      <tr key={d.id} className="cursor-pointer hover:bg-fog-50 dark:hover:bg-ink-850">
                        <Td>
                          <Link href="/eta-compliance" className="font-medium hover:underline">
                            {d.id}
                          </Link>
                        </Td>
                        <Td className="text-xs">{carrierById(d.carrierId)?.name}</Td>
                        <Td className="tnum text-end">
                          {fmtDate(d.eta, lang)}
                          {d.delayed ? <StatePill s="delayed" label={t("state.delayed")} /> : null}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </T>
              )}
            </Card>

            {/* column 3: invoices + financing */}
            <div className="space-y-6 xl:col-span-1">
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                    <IcInvoice /> {t("dash.reviewInvoices")}
                  </h2>
                  <Link href="/invoices" className="text-xs font-medium text-brass-600 hover:underline dark:text-brass-400">
                    {t("common.viewAll")}
                  </Link>
                </div>
                {openInvoices.filter((i) => i.status === "submitted").length === 0 ? (
                  <p className="text-sm text-ink-400">{t("common.noData")}</p>
                ) : (
                  <ul className="divide-y divide-line dark:divide-linedark">
                    {openInvoices
                      .filter((i) => i.status === "submitted")
                      .map((i) => (
                        <li key={i.id} className="flex items-center justify-between py-3">
                          <div>
                            <Link href="/invoices" className="text-sm font-semibold hover:underline">{i.number}</Link>
                            <div className="text-xs text-ink-500">
                              {user.role === "supplier_manager"
                                ? hotelById(i.hotelId)?.name
                                : supplierById(i.supplierId)?.name}
                            </div>
                          </div>
                          <span className="tnum text-sm font-bold">{fmtMoney(i.total, lang)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </Card>
              {isHotel ? (
                <Card className="p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                    <IcCard /> {t("dash.financeBox")}
                  </h2>
                  {data.financing.filter((f) => f.hotelId === hotelId && f.status === "funded").length === 0 ? (
                    <p className="text-sm text-ink-400">{t("dash.financeNone")}</p>
                  ) : (
                    <ul className="space-y-3">
                      {data.financing
                        .filter((f) => f.hotelId === hotelId)
                        .map((f) => (
                          <li key={f.id} className="flex items-center justify-between gap-3">
                            <div>
                              <Link href="/financing" className="text-sm font-semibold hover:underline">{f.number}</Link>
                              <div className="tnum text-xs text-ink-500">{fmtMoney(f.amount, lang)}</div>
                            </div>
                            <StatePill s={f.status} />
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>
              ) : null}
              <Card className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcHistory /> {t("dash.recentOrders")}
                </h2>
                <ul className="divide-y divide-line dark:divide-linedark">
                  {myOrders.slice(0, 4).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={user.role === "supplier_manager" ? `/supplier-central/orders/${o.id}` : `/orders/${o.id}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {o.po}
                        </Link>
                        <div className="truncate text-xs text-ink-500">
                          {fmtDate(o.createdAt, lang)} · {o.lines.length} {t("common.items")}
                        </div>
                      </div>
                      <span className="tnum text-sm font-bold">{fmtMoney(o.total, lang)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* admin-only extras */}
          {user.role === "platform_admin" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcAlert /> {t("dash.adminCompliance")}
                </h2>
                {data.deliveries.filter((d) => d.delayed && d.status !== "delivered").length === 0 ? (
                  <p className="text-sm text-ink-400">{t("admin.noFlags")}</p>
                ) : (
                  <ul className="space-y-2">
                    {data.deliveries
                      .filter((d) => d.delayed && d.status !== "delivered")
                      .map((d) => (
                        <li key={d.id} className="flex items-center justify-between rounded border border-red-600/25 bg-red-600/5 px-3 py-2.5 text-sm">
                          <span className="font-medium">{d.id}</span>
                          <span className="tnum text-xs text-ink-500">{fmtDateTime(d.eta, lang)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </Card>
              <Card className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcUsers /> {t("dash.auditRecent")}
                </h2>
                <ul className="divide-y divide-line dark:divide-linedark">
                  {data.audit.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <span className="font-medium">{a.action}</span>
                        <span className="mx-1.5 text-ink-400">·</span>
                        <span className="text-ink-500">{a.actor}</span>
                      </div>
                      <span className="tnum shrink-0 text-xs text-ink-400">{fmtDateTime(a.at, lang)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : null}

          {/* quick actions (hotel) */}
          {isHotel ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/marketplace" className={btnCls("primary")}>
                <IcBox /> {t("dash.qaBrowse")}
              </Link>
              <Link href="/cart" className={btnCls("outline")}>
                {t("dash.qaCart")}
              </Link>
              <Link href="/orders" className={btnCls("outline")}>
                {t("dash.qaOrders")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </div>
          ) : null}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
