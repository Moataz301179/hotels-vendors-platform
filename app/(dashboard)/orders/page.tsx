"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApi } from "@/lib/hooks/use-api";
import { fmtDate } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { PageHead, TextInput, Skeleton, EmptyState, T, Th, Td, StatePill } from "@/components/ui";
import { IcSearch, IcBox } from "@/components/icons";

const FILTERS = ["all", "approval", "active", "done"];
interface Order { id: string; orderNumber: string; status: string; total: number | string | null; createdAt: string; deliveryDate: string | null; supplier: { name: string }; items: { id: string }[] }

export default function OrdersPage() {
  const { t, lang } = usePrefs();
  const { data, loading, error } = useApi<{ orders: Order[] }>("/api/v1/hotel/orders?limit=100");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let out = data?.orders ?? [];
    if (filter === "approval") out = out.filter(o => o.status === "PENDING_APPROVAL");
    if (filter === "active")
      out = out.filter(o => !["REJECTED", "CANCELLED", "DELIVERED"].includes(o.status));
    if (filter === "done")
      out = out.filter(o => ["REJECTED", "CANCELLED", "DELIVERED"].includes(o.status));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        o =>
          o.orderNumber.toLowerCase().includes(s) ||
          (o.supplier?.name ?? "").toLowerCase().includes(s)
      );
    }
    return out;
  }, [data?.orders, filter, q]);

  return (
    <RequireAuth>
      <AppShell active="/orders">
        <Guard roles={["hotel_admin", "gm", "finance_director"]}>
          <PageHead kicker={t("orders.k") ?? "Orders"} title={t("orders.t") ?? "Purchase Orders"} sub={t("orders.sub") ?? "Track your procurement orders"} />
          {error ? <p role="alert">{error}</p> : null}

          {/* Filters */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1.5 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    filter === f
                      ? "border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950"
                      : "border-line bg-white text-ink-600 hover:border-ink-400 dark:border-linedark dark:bg-ink-900 dark:text-ink-300"
                  }`}
                >
                  {t(`orders.f${f.charAt(0).toUpperCase() + f.slice(1)}`) ?? f}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs sm:ms-auto">
              <IcSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <TextInput
                className="ps-10"
                placeholder={t("orders.searchPh") ?? "Search by PO or supplier..."}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("common.search") ?? "Search"}
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-line bg-white divide-y dark:border-linedark dark:bg-ink-900">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<IcBox />}
              title={t("orders.empty") ?? "No orders found"}
              sub={t("orders.emptySub") ?? "Try adjusting your filters"}
            />
          ) : (
            <T>
              <thead>
                <tr>
                  <Th>{t("orders.col.po") ?? "PO #"}</Th>
                  <Th>{t("orders.col.supplier") ?? "Supplier"}</Th>
                  <Th>{t("orders.col.created") ?? "Created"}</Th>
                  <Th className="text-end">{t("orders.col.amount") ?? "Amount"}</Th>
                  <Th>{t("orders.col.approval") ?? "Approval"}</Th>
                  <Th>{t("orders.col.fulfillment") ?? "Fulfillment"}</Th>
                  <Th>{t("orders.col.eta") ?? "ETA"}</Th>
                  <Th>{t("orders.col.receipt") ?? "Receipt"}</Th>
                </tr>
              </thead>
              <tbody>
                {list.map(o => (
                  <tr key={o.id} className="cursor-pointer transition-colors hover:bg-fog-50 dark:hover:bg-ink-850">
                    <Td>
                      <Link href={`/orders/${o.id}`} className="font-semibold hover:underline">
                        {o.orderNumber}
                      </Link>
                      <div className="text-xs text-ink-400">{o.items.length} {t("common.items") ?? "items"}</div>
                    </Td>
                    <Td className="text-[13px]">{o.supplier?.name ?? "—"}</Td>
                    <Td className="tnum text-[13px] text-ink-500">{fmtDate(o.createdAt, lang)}</Td>
                    <Td className="tnum text-end font-semibold">{o.total == null ? "—" : Number(o.total).toFixed(2)}</Td>
                    <Td>
                      <StatePill s={o.status.toLowerCase()} />
                    </Td>
                    <Td>
                      {!["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"].includes(o.status) ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <StatePill s={o.status.toLowerCase()} />
                      )}
                    </Td>
                    <Td className="tnum text-[13px]">
                      {o.deliveryDate ? (
                        <>
                          {fmtDate(o.deliveryDate, lang)}
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <span className="text-ink-400">Not provided</span>
                    </Td>
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
