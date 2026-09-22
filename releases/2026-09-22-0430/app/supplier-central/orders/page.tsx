"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/stubs-export";
import { hotelById } from "@/lib/stubs-export";
import { fmtDate, fmtMoney } from "@/lib/stubs-export";
import AppShell, { Guard, RequireAuth } from "@/lib/stubs-export";
import { EmptyState, PageHead, StatePill, T, Td, Th } from "@/lib/stubs-export";
import { IcBox } from "@/lib/stubs-export";

export default function SupplierOrdersPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    let out = data.orders.filter((o) => o.supplierId === user?.orgId && o.approval.state !== "rejected");
    if (filter === "open") out = out.filter((o) => o.fulfillment !== "delivered");
    if (filter === "delivered") out = out.filter((o) => o.fulfillment === "delivered");
    if (filter === "ack") out = out.filter((o) => o.fulfillment === "none");
    return out;
  }, [data.orders, user, filter]);

  const chips = [
    { id: "all", label: t("orders.fAll") },
    { id: "ack", label: t("central.needAck") },
    { id: "open", label: t("orders.fActive") },
    { id: "delivered", label: t("state.delivered") },
  ];

  return (
    <RequireAuth>
      <AppShell active="/supplier-central/orders">
        <Guard roles={["supplier_manager"]}>
          <PageHead kicker={t("central.k")} title={t("central.incoming")} sub={t("orders.sub")} />
          <div className="mb-5 flex gap-1.5 overflow-x-auto">
            {chips.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                aria-pressed={filter === c.id}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  filter === c.id
                    ? "border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950"
                    : "border-line bg-white text-ink-600 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<IcBox />} title={t("central.noIncoming")} />
          ) : (
            <T>
              <thead>
                <tr>
                  <Th>{t("orders.col.po")}</Th>
                  <Th>{t("login.org")}</Th>
                  <Th>{t("orders.col.created")}</Th>
                  <Th className="text-end">{t("orders.col.amount")}</Th>
                  <Th>{t("orders.col.fulfillment")}</Th>
                  <Th>{t("orders.col.receipt")}</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="cursor-pointer hover:bg-fog-50 dark:hover:bg-ink-850">
                    <Td>
                      <Link href={`/supplier-central/orders/${o.id}`} className="font-semibold hover:underline">
                        {o.po}
                      </Link>
                      <div className="text-xs text-ink-400">{o.lines.length} {t("common.items")}</div>
                    </Td>
                    <Td className="text-[13px]">{hotelById(o.hotelId)?.name}</Td>
                    <Td className="tnum text-[13px] text-ink-500">{fmtDate(o.createdAt, lang)}</Td>
                    <Td className="tnum text-end font-semibold">{fmtMoney(o.total, lang)}</Td>
                    <Td>{o.fulfillment === "none" ? <StatePill s="pending" label={t("state.not_started")} /> : <StatePill s={o.fulfillment} />}</Td>
                    <Td>{o.receipt === "none" ? <span className="text-ink-400">—</span> : <StatePill s={o.receipt} />}</Td>
                  </tr>
                ))}
              </tbody>
            </T>
          )}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
