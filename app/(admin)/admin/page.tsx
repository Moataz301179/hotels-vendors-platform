"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, PageHead, Stat, StatePill, btnCls } from "@/components/ui";
import { IcAlert, IcArrow, IcBuilding, IcHistory, IcScale, IcTruck, IcUsers } from "@/components/icons";

export default function AdminPage() {
  const { t, lang } = usePrefs();
  const { data } = useApp();

  const flags = data.deliveries.filter((d) => d.delayed && d.status !== "delivered");
  const openTx = data.orders.filter((o) => o.approval.state !== "rejected" && o.receipt !== "complete").length;

  const stageRows = [
    { l: t("state.pending"), n: data.orders.filter((o) => o.approval.state === "pending").length },
    { l: t("state.acknowledged"), n: data.orders.filter((o) => o.fulfillment === "acknowledged").length },
    { l: t("state.preparing"), n: data.orders.filter((o) => o.fulfillment === "preparing").length },
    { l: t("state.in_transit"), n: data.orders.filter((o) => ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
    { l: t("state.delivered"), n: data.orders.filter((o) => o.fulfillment === "delivered" && o.receipt !== "complete").length },
    { l: t("state.complete"), n: data.orders.filter((o) => o.receipt === "complete").length },
  ];
  const maxStage = Math.max(1, ...stageRows.map((x) => x.n));
  const governed = data.orders.filter((o) => o.approval.state !== "rejected");
  const ruleCovered = governed.filter((o) => !!o.ruleId).length;
  const authorityCoverage = governed.length ? Math.round((ruleCovered / governed.length) * 100) : 0;

  const links = [
    { href: "/admin/tenants", label: t("nav.tenants"), Icon: IcBuilding },
    { href: "/admin/users", label: t("nav.users"), Icon: IcUsers },
    { href: "/admin/rules", label: t("nav.rules"), Icon: IcScale },
    { href: "/admin/audit", label: t("nav.audit"), Icon: IcHistory },
  ];

  return (
    <RequireAuth>
      <AppShell active="/admin">
        <Guard roles={["platform_admin"]}>
          <PageHead kicker={t("admin.k")} title={t("admin.t")} sub={t("admin.sub")} />

          <div className="grid grid-air sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("admin.kpiTenants")} value={data.tenants.filter((x) => x.status === "active").length} tone="ok" />
            <Stat label={t("admin.kpiUsers")} value={15} tone="mute" />
            <Stat label={t("admin.kpiTx")} value={openTx} tone="info" />
            <Stat label={t("admin.kpiFlags")} value={flags.length} tone={flags.length ? "bad" : "ok"} />
          </div>

          <div className="mt-6 grid grid-air sm:grid-cols-2 lg:grid-cols-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-lg border border-line bg-white p-5 transition-colors hover:border-brass-500 dark:border-linedark dark:bg-ink-900"
              >
                <div className="flex items-center gap-3">
                  <l.Icon className="text-xl text-brass-600 dark:text-brass-400" />
                  <span className="text-[15px] font-semibold">{l.label}</span>
                </div>
                <IcArrow className="text-lg text-ink-300 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            ))}
          </div>

          {/* ---- network oversight, measured ---- */}
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
                      <div className="h-full rounded-full bg-ink-950 dark:bg-white" style={{ width: `${(r.n / maxStage) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="pad-card-lg">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                {lang === "ar" ? "امتثال الصلاحيات" : "Authority compliance"}
              </div>
              <div className="tnum mt-5 text-4xl font-bold leading-none tracking-tight">{authorityCoverage}%</div>
              <p className="mt-2 text-[12px] leading-snug text-ink-500 dark:text-ink-400">
                {lang === "ar"
                  ? "من الطلبات مُقيَّمة بقاعدة صلاحيات نشطة قبل إصدار أمر الشراء."
                  : "of orders evaluated against an active authority rule before a PO is issued."}
              </p>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] dark:border-linedark">
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "قواعد نشطة" : "Active rules"}</dt>
                  <dd className="tnum font-semibold">{data.rules.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "بانتظار القرار" : "Awaiting decision"}</dt>
                  <dd className="tnum font-semibold">{stageRows[0].n}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">{lang === "ar" ? "قيود التدقيق" : "Audit entries"}</dt>
                  <dd className="tnum font-semibold">{data.audit.length}</dd>
                </div>
              </dl>
              <Link href="/admin/rules" className={`${btnCls("outline", "sm")} mt-5 w-full`}>
                {t("nav.rules")}
                <IcArrow className="rtl:-scale-x-100" />
              </Link>
            </Card>
          </section>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcTruck /> {t("admin.compliance")}
              </h2>
              {flags.length === 0 ? (
                <p className="text-sm text-ink-400">{t("admin.noFlags")}</p>
              ) : (
                <ul className="space-y-2.5">
                  {flags.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-600/25 bg-red-600/5 px-4 py-3">
                      <div>
                        <span className="text-sm font-bold">{d.id}</span>
                        <span className="mx-2 text-ink-400">·</span>
                        <span className="text-[13px] text-ink-600 dark:text-ink-300">{lang === "ar" ? d.destinationAr : d.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatePill s="delayed" />
                        <span className="tnum text-xs text-ink-500">{fmtDateTime(d.eta, lang)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 border-t border-line pt-3 text-[13px] text-ink-500 dark:border-linedark dark:text-ink-400">
                {t("admin.delayedDel")}: {flags.length}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcHistory /> {t("admin.recentAudit")}
              </h2>
              <ul className="divide-y divide-line dark:divide-linedark">
                {data.audit.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{lang === "ar" ? a.actionAr : a.action}</div>
                      <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {a.actor} · {a.entity}
                      </div>
                    </div>
                    <span className="tnum shrink-0 text-xs text-ink-400">{fmtDateTime(a.at, lang)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/audit" className={`${btnCls("outline", "sm")} mt-4`}>
                {t("common.viewAll")}
              </Link>
            </Card>
          </div>

          <span className="hidden"><IcAlert /></span>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
