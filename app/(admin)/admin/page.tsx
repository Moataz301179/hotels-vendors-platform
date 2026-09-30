"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; import { Skeleton } from "@/components/ui";
import { IcBuilding, IcUsers, IcChart, IcHistory, IcTruck, IcArrow, IcAlert } from "@/components/icons";
import { Card as PageHead, CardHeader as PageHeadHeader, CardTitle as PageHeadTitle } from "@/components/ui/card";

export default function AdminPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  const orders = data?.orders || [];
  const tenants = data?.tenants || [];
  const deliveries = data?.deliveries || [];

  const flags = deliveries.filter((d: any) => d.delayed && d.status !== "delivered");
  const openTx = orders.filter((o: any) => o.approval?.state !== "rejected" && o.receipt !== "complete").length;

  const stageRows = [
    { l: t("state.pending") ?? "Pending", n: orders.filter((o: any) => o.approval?.state === "pending").length },
    { l: t("state.acknowledged") ?? "Acknowledged", n: orders.filter((o: any) => o.fulfillment === "acknowledged").length },
    { l: t("state.preparing") ?? "Preparing", n: orders.filter((o: any) => o.fulfillment === "preparing").length },
    { l: t("state.in_transit") ?? "In Transit", n: orders.filter((o: any) => ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
    { l: t("state.delivered") ?? "Delivered", n: orders.filter((o: any) => o.fulfillment === "delivered" && o.receipt !== "complete").length },
    { l: t("state.complete") ?? "Complete", n: orders.filter((o: any) => o.receipt === "complete").length },
  ];
  const maxStage = Math.max(1, ...stageRows.map((x) => x.n));
  const governed = orders.filter((o: any) => o.approval?.state !== "rejected");
  const ruleCovered = governed.filter((o: any) => !!o.ruleId).length;
  const authorityCoverage = governed.length ? Math.round((ruleCovered / governed.length) * 100) : 0;

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/admin">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="skeleton h-8 w-64 rounded-lg" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell active="/admin">
        <Guard roles={["platform_admin"]}>
          <PageHead
            kicker={t("admin.k") ?? "Admin"}
            title={t("admin.t") ?? "Platform Overview"}
            sub={t("admin.sub") ?? "Platform governance and oversight"}
          />

          {/* KPI Stats */}
          <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("admin.kpiTenants") ?? "Active Tenants"} value={tenants.filter((x: any) => x.status === "active").length} tone="ok" />
            <Stat label={t("admin.kpiUsers") ?? "Users"} value={data?.users?.length ?? orders.length} tone="mute" />
            <Stat label={t("admin.kpiTx") ?? "Open Transactions"} value={openTx} tone="info" />
            <Stat label={t("admin.kpiFlags") ?? "Delivery Flags"} value={flags.length} tone={flags.length ? "bad" : "ok"} />
          </div>

          {/* Admin Links */}
          <div className="mt-6 grid grid-air sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/admin/users", label: t("nav.users") ?? "Users", Icon: IcUsers },
              { href: "/admin/audit", label: t("nav.audit") ?? "Audit Log", Icon: IcHistory },
              { href: "/vendor-management", label: t("nav.vendorMgmt") ?? "Vendor Management", Icon: IcBuilding },
              { href: "/admin/reports", label: t("admin.reports") ?? "Reports", Icon: IcChart },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-signal dark:border-linedark dark:bg-ink-900"
              >
                <div className="flex items-center gap-3">
                  <l.Icon className="text-xl text-signal" />
                  <span className="text-[15px] font-semibold">{l.label}</span>
                </div>
                <IcArrow className="text-lg text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            ))}
          </div>

          {/* Transactions by stage */}
          <section className="mt-6 grid grid-air-lg lg:grid-cols-3">
            <Card className="pad-card-lg lg:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "المعاملات حسب المرحلة" : "Transactions by stage"}
              </div>
              <p className="mt-1.5 text-[12px] text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "كل معاملة على الشبكة عبر نفس العمود المدقق."
                  : "Every transaction on the network moves through the same audited spine."}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {stageRows.map((r) => (
                  <div key={r.l}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{r.l}</span>
                      <span className="tnum text-ink-500">{r.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div
                        className="h-full rounded-full bg-signal"
                        style={{ width: `${(r.n / maxStage) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "امتثال الصلاحيات" : "Authority compliance"}
              </div>
              <div className="tnum mt-5 text-4xl font-medium leading-none tracking-tight text-signal">
                {authorityCoverage}%
              </div>
              <p className="mt-2 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "من الطلبات مُقيَّمة بقاعدة صلاحيات نشطة قبل إصدار أمر الشراء."
                  : "of orders evaluated against an active authority rule before a PO is issued."}
              </p>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "قواعد نشطة" : "Active rules"}</dt>
                  <dd className="tnum font-semibold">{data?.rules?.length ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "بانتظار القرار" : "Awaiting decision"}</dt>
                  <dd className="tnum font-semibold">{stageRows[0].n}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "قيود التدقيق" : "Audit entries"}</dt>
                  <dd className="tnum font-semibold">{data?.audit?.length ?? 0}</dd>
                </div>
              </dl>
              <Link
                href="/admin/rules"
                className="mt-5 inline-block rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink-700 hover:border-signal dark:border-linedark dark:bg-ink-900 dark:hover:border-white"
              >
                {t("nav.rules") ?? "Authority Rules"}
                <IcArrow className="rtl:-scale-x-100" size={14} />
              </Link>
            </Card>
          </section>

          {/* Compliance / Recent audit */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcTruck /> {t("admin.compliance") ?? "Delivery Compliance"}
              </h2>
              {flags.length === 0 ? (
                <p className="text-sm text-ink-400">{t("admin.noFlags") ?? "No delivery delays flagged."}</p>
              ) : (
                <ul className="space-y-2.5">
                  {flags.slice(0, 4).map((d: any) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-600/25 bg-red-600/5 px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">{d.id}</span>
                        <span className="mx-2 text-ink-400">·</span>
                        <span className="text-[13px] text-ink-600 dark:text-ink-300">{d.destination || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatePillInline s="delayed" />
                        <span className="tnum text-xs text-ink-500">{d.eta ? new Date(d.eta).toLocaleDateString() : "—"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-line pt-3 text-[13px] text-ink-500 dark:border-linedark dark:text-ink-400">
                {t("admin.delayedDel") ?? "Delayed deliveries"}: {flags.length}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcHistory /> {t("admin.recentAudit") ?? "Recent Audit Activity"}
              </h2>
              <ul className="divide-y divide-line dark:divide-linedark">
                {(data?.audit || []).slice(0, 6).map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{a.action || "—"}</div>
                      <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {a.actor || ""} · {a.entity || ""}
                      </div>
                    </div>
                    <span className="tnum shrink-0 text-xs text-ink-400">
                      {a.at ? new Date(a.at).toLocaleString() : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/audit"
                className={`mt-4 inline-block rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink-700 hover:border-signal dark:border-linedark dark:bg-ink-900 dark:hover:border-white`}
              >
                {t("common.viewAll") ?? "View All"}
              </Link>
            </Card>
          </div>

          <span className="hidden"><IcAlert /></span>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

function StatePillInline({ s }: { s: string }) {
  const color = s === "delayed" ? "bg-red-600 text-white" : "bg-ink-950 text-white dark:bg-white dark:text-ink-950";
  return (
    <span className={`tnum rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {s}
    </span>
  );
}

