"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { INVENTORY } from "@/lib/stubs-export";
import AppShell, { Guard, RequireAuth } from "@/lib/stubs-export";
import { Btn, Card, PageHead, StatePill, Stat, T, Td, Th } from "@/lib/stubs-export";
import { IcPlus, productById } from "@/lib/stubs-export";
import type { Role } from "@/lib/stubs-export";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function InventoryPage() {
  const { t } = usePrefs();
  const [filter, setFilter] = useState("all");

  const filtered = INVENTORY.filter((i) => filter === "all" || i.status === filter);
  const totalItems = INVENTORY.length;
  const lowStock = INVENTORY.filter((i) => i.status === "low").length;
  const critical = INVENTORY.filter((i) => i.status === "critical").length;
  const pendingReorders = INVENTORY.filter((i) => i.autoReorder && i.status !== "ok").length;

  return (
    <RequireAuth>
      <AppShell active="/inventory">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("inventory.k")} title={t("inventory.t")} sub={t("inventory.sub")} actions={<Btn variant="accent" size="sm"><IcPlus /> {t("inventory.new")}</Btn>} />

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Stat label={t("inventory.stat.total")} value={totalItems} />
            <Stat label={t("inventory.stat.low")} value={lowStock} tone="warn" />
            <Stat label={t("inventory.stat.critical")} value={critical} tone="bad" />
            <Stat label={t("inventory.stat.reorders")} value={pendingReorders} tone="info" />
          </div>

          <div className="mb-6 flex gap-2">
            {["all", "ok", "low", "critical"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded px-3 py-1.5 text-[13px] font-medium ${filter === f ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "text-ink-500 hover:bg-fog-100 dark:text-ink-400 dark:hover:bg-ink-800"}`}>{t(`inventory.filter.${f}`)}</button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <T>
              <thead>
                <tr className="border-b border-line dark:border-linedark">
                  <Th>{t("inventory.col.sku")}</Th>
                  <Th>{t("inventory.col.product")}</Th>
                  <Th>{t("inventory.col.stock")}</Th>
                  <Th>{t("inventory.col.min")}</Th>
                  <Th>{t("inventory.col.max")}</Th>
                  <Th>{t("inventory.col.reorder")}</Th>
                  <Th>{t("inventory.col.status")}</Th>
                  <Th>{t("inventory.col.action")}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const p = productById(item.productId);
                  return (
                    <tr key={item.id} className="border-b border-line dark:border-linedark">
                      <Td className="font-mono text-[12px]">{p?.sku}</Td>
                      <Td className="font-medium">{p?.name}</Td>
                      <Td className="tnum">{item.currentStock}</Td>
                      <Td className="tnum text-ink-500">{item.minThreshold}</Td>
                      <Td className="tnum text-ink-500">{item.maxThreshold}</Td>
                      <Td className="tnum text-ink-500">{item.reorderPoint}</Td>
                      <Td><StatePill s={item.status} /></Td>
                      <Td><Btn variant="outline" size="sm">{t("inventory.reorder")}</Btn></Td>
                    </tr>
                  );
                })}
              </tbody>
            </T>
          </Card>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
