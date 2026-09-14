"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { supplierById } from "@/lib/data";
import { fmtDate, fmtMoney, relDay } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  EmptyState,
  PageHead,
  StatePill,
  T,
  Td,
  TextInput,
  Th,
} from "@/components/ui";
import { IcBox, IcSearch } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function OrdersPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let out = data.orders.filter((o) => o.hotelId === user?.orgId);
    if (filter === "approval") out = out.filter((o) => o.approval.state === "pending");
    if (filter === "active")
      out = out.filter((o) => o.approval.state !== "rejected" && o.fulfillment !== "delivered" && o.receipt !== "complete");
    if (filter === "done")
      out = out.filter((o) => o.approval.state === "rejected" || (o.receipt === "complete" && o.fulfillment === "delivered"));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (o) =>
          o.po.toLowerCase().includes(s) ||
          (supplierById(o.supplierId)?.name ?? "").toLowerCase().includes(s)
      );
    }
    return out;
  }, [data.orders, user, filter, q]);

  const chips = [
    { id: "all", label: t("orders.fAll") },
    { id: "approval", label: t("orders.fApproval") },
    { id: "active", label: t("orders.fActive") },
    { id: "done", label: t("orders.fDone") },
  ];

  return (
    <RequireAuth>
      <AppShell active="/orders">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("orders.k")} title={t("orders.t")} sub={t("orders.sub")} />

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1.5 overflow-x-auto">
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
            <div className="relative flex-1 sm:max-w-xs sm:ms-auto">
              <IcSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <TextInput
                className="ps-10"
                placeholder={t("orders.searchPh")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("common.search")}
              />
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<IcBox />} title={t("orders.empty")} sub={t("orders.emptySub")} />
          ) : (
            <T>
              <thead>
                <tr>
                  <Th>{t("orders.col.po")}</Th>
                  <Th>{t("orders.col.supplier")}</Th>
                  <Th>{t("orders.col.created")}</Th>
                  <Th className="text-end">{t("orders.col.amount")}</Th>
                  <Th>{t("orders.col.approval")}</Th>
                  <Th>{t("orders.col.fulfillment")}</Th>
                  <Th>{t("orders.col.eta")}</Th>
                  <Th>{t("orders.col.receipt")}</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="cursor-pointer transition-colors hover:bg-fog-50 dark:hover:bg-ink-850">
                    <Td>
                      <Link href={`/orders/${o.id}`} className="font-semibold hover:underline">
                        {o.po}
                      </Link>
                      <div className="text-xs text-ink-400">{o.lines.length} {t("common.items")}</div>
                    </Td>
                    <Td className="text-[13px]">{supplierById(o.supplierId)?.name}</Td>
                    <Td className="tnum text-[13px] text-ink-500">{fmtDate(o.createdAt, lang)}</Td>
                    <Td className="tnum text-end font-semibold">{fmtMoney(o.total, lang)}</Td>
                    <Td><StatePill s={o.approval.state} /></Td>
                    <Td>{o.fulfillment === "none" ? <span className="text-ink-400">—</span> : <StatePill s={o.fulfillment} />}</Td>
                    <Td className="tnum text-[13px]">
                      {o.eta ? (
                        <>
                          {fmtDate(o.eta, lang)}
                          <div className="text-xs text-ink-400">{relDay(o.eta, lang)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
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
