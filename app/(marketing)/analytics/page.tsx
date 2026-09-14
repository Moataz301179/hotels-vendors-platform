"use client";

import { useMemo } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { CATEGORIES, productById, supplierById } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Banner, Card, PageHead, Stat, T, Td, Th } from "@/components/ui";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function AnalyticsPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();
  const isSupplier = user?.role === "supplier_manager";

  const orders = useMemo(
    () =>
      data.orders.filter((o) =>
        isSupplier ? o.supplierId === user?.orgId : o.hotelId === user?.orgId
      ),
    [data.orders, isSupplier, user]
  );

  const valid = orders.filter((o) => o.approval.state !== "rejected");
  const totalSpend = valid.reduce((a, o) => a + o.total, 0);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of valid)
      for (const l of o.lines) {
        const p = productById(l.productId);
        if (!p) continue;
        m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + l.qty * l.price);
      }
    return CATEGORIES.map((c) => ({ id: c.id, label: lang === "ar" ? c.nameAr : c.name, value: m.get(c.id) ?? 0 }));
  }, [valid, lang]);

  const bySupplier = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of valid) m.set(o.supplierId, (m.get(o.supplierId) ?? 0) + o.total);
    return [...m.entries()]
      .map(([id, v]) => ({ label: supplierById(id)?.name ?? id, value: v }))
      .sort((a, b) => b.value - a.value);
  }, [valid]);

  const stages = [
    { label: t("state.pending"), n: orders.filter((o) => o.approval.state === "pending").length },
    { label: t("state.acknowledged"), n: orders.filter((o) => o.fulfillment === "acknowledged").length },
    { label: t("state.in_transit"), n: orders.filter((o) => ["shipped", "in_transit", "out_for_delivery"].includes(o.fulfillment)).length },
    { label: t("state.delivered"), n: orders.filter((o) => o.fulfillment === "delivered" && o.receipt !== "complete").length },
    { label: t("state.complete"), n: orders.filter((o) => o.receipt === "complete").length },
  ];

  const deliveries = data.deliveries.filter((d) => valid.some((o) => o.id === d.orderId));
  const delivered = deliveries.filter((d) => d.status === "delivered");
  const onTime = delivered.length ? Math.round((delivered.filter((d) => !d.delayed).length / delivered.length) * 100) : 100;

  const openInv = data.invoices.filter(
    (i) => (isSupplier ? i.supplierId === user?.orgId : i.hotelId === user?.orgId) && (i.status === "submitted" || i.status === "approved")
  );
  const maxCat = Math.max(1, ...byCategory.map((c) => c.value));
  const maxSup = Math.max(1, ...bySupplier.map((c) => c.value));
  const maxStage = Math.max(1, ...stages.map((s) => s.n));

  return (
    <RequireAuth>
      <AppShell active="/analytics">
        <Guard roles={[...HOTEL, "supplier_manager", "platform_admin"]}>
          <PageHead kicker={t("analytics.k")} title={t("analytics.t")} sub={t("analytics.sub")} />
          <Banner tone="info" className="mb-6">{t("analytics.note")}</Banner>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label={t("analytics.openOrders")} value={valid.filter((o) => o.receipt !== "complete").length} tone="info" />
            <Stat label={t("analytics.onTime")} value={`${onTime}%`} sub={`${delivered.length} ${t("analytics.delivered")}`} tone={onTime >= 80 ? "ok" : "warn"} />
            <Stat label={t("analytics.openInv")} value={fmtMoney(openInv.reduce((a, i) => a + i.total, 0), lang)} tone="brass" />
            <Stat label={isSupplier ? t("analytics.fulfilled") : t("analytics.spendCat")} value={fmtMoney(totalSpend, lang)} tone="mute" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("analytics.spendCat")}
              </h2>
              <div className="space-y-4">
                {byCategory.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{c.label}</span>
                      <span className="tnum text-ink-500">{fmtMoney(c.value, lang)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div
                        className="h-full rounded-full bg-brass-500 transition-all duration-700"
                        style={{ width: `${(c.value / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("analytics.byStatus")}
              </h2>
              <div className="space-y-4">
                {stages.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{s.label}</span>
                      <span className="tnum text-ink-500">{s.n}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div
                        className="h-full rounded-full bg-ink-950 transition-all duration-700 dark:bg-white"
                        style={{ width: `${(s.n / maxStage) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("analytics.topSup")}
              </h2>
              <div className="space-y-4">
                {bySupplier.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="font-medium">{s.label}</span>
                      <span className="tnum text-ink-500">{fmtMoney(s.value, lang)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-fog-200 dark:bg-ink-800">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                        style={{ width: `${(s.value / maxSup) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-line px-6 py-4 dark:border-linedark">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {t("analytics.recent")}
                </h2>
              </div>
              <T minWidth="min-w-[420px]">
                <thead>
                  <tr>
                    <Th>{t("admin.audit.colAction")}</Th>
                    <Th>{t("admin.audit.colEntity")}</Th>
                    <Th className="text-end">{t("admin.audit.colAt")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.audit.slice(0, 6).map((a) => (
                    <tr key={a.id}>
                      <Td className="text-[13px]">
                        <span className="font-medium">{lang === "ar" ? a.actionAr : a.action}</span>
                        <div className="text-xs text-ink-400">{a.actor}</div>
                      </Td>
                      <Td className="text-[13px]">{a.entity}</Td>
                      <Td className="tnum text-end text-[13px] text-ink-500">
                        {new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(a.at))}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </T>
            </Card>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
