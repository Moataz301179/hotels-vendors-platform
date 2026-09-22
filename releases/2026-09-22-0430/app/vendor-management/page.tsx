"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { VENDOR_SCORECARDS } from "@/lib/stubs-export";
import AppShell, { Guard, RequireAuth } from "@/lib/stubs-export";
import { Btn, Card, PageHead, StatePill, Stat } from "@/lib/stubs-export";
import type { Role } from "@/lib/stubs-export";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director", "platform_admin"];

export default function VendorManagementPage() {
  const { t } = usePrefs();
  const [filter, setFilter] = useState("all");

  const filtered = VENDOR_SCORECARDS.filter((v) => {
    if (filter === "all") return true;
    if (filter === "verified") return v.taxStatus === "verified";
    if (filter === "pending") return v.taxStatus === "pending";
    if (filter === "expired") return v.taxStatus === "expired";
    return true;
  });

  const avgScore = VENDOR_SCORECARDS.length
    ? Math.round(VENDOR_SCORECARDS.reduce((a, v) => a + v.overallScore, 0) / VENDOR_SCORECARDS.length)
    : 0;

  return (
    <RequireAuth>
      <AppShell active="/vendor-management">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("vendor.k")} title={t("vendor.t")} sub={t("vendor.sub")} />

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Stat label={t("vendor.stat.avg")} value={avgScore} />
            <Stat label={t("vendor.stat.verified")} value={VENDOR_SCORECARDS.filter((v) => v.taxStatus === "verified").length} tone="ok" />
            <Stat label={t("vendor.stat.pending")} value={VENDOR_SCORECARDS.filter((v) => v.taxStatus === "pending").length} tone="warn" />
            <Stat label={t("vendor.stat.expired")} value={VENDOR_SCORECARDS.filter((v) => v.taxStatus === "expired").length} tone="bad" />
          </div>

          <div className="mb-6 flex gap-2">
            {["all", "verified", "pending", "expired"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${filter === f ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "text-ink-500 hover:bg-fog-100 dark:text-ink-400 dark:hover:bg-ink-800"}`}>{t(`vendor.filter.${f}`)}</button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {filtered.map((v) => {
              const s = supplierById(v.supplierId);
              return (
                <Card key={v.supplierId} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{s?.name}</h3>
                      <p className="mt-1 text-xs text-ink-500">{s?.city}</p>
                    </div>
                    <div className="tnum text-2xl font-bold text-ink-950 dark:text-white">{v.overallScore}</div>
                  </div>
                  <div className="mt-4 space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-ink-500">{t("vendor.ontime")}</span><span className="tnum font-medium">{v.onTimeRate}%</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">{t("vendor.quality")}</span><span className="tnum font-medium">{v.qualityRate}%</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">{t("vendor.response")}</span><span className="tnum font-medium">{v.responseTime}h</span></div>
                    <div className="flex justify-between"><span className="text-ink-500">{t("vendor.fulfillment")}</span><span className="tnum font-medium">{v.fulfillmentRate}%</span></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <StatePill s={v.taxStatus === "verified" ? "approved" : v.taxStatus === "pending" ? "pending" : "rejected"} label={t(`vendor.tax.${v.taxStatus}`)} />
                    <StatePill s={v.contractStatus === "active" ? "approved" : "rejected"} label={t(`vendor.contract.${v.contractStatus}`)} />
                  </div>
                </Card>
              );
            })}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
