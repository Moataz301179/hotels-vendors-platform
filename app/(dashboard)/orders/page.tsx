"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Badge } from "@/components/ui";
import { Card as PageHead, CardHeader as PageHeadHeader, CardTitle as PageHeadTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

const FILTERS = ["all", "approval", "active", "done"];

export default function OrdersPage() {
  const { t, lang } = usePrefs();
  const { data, user } = useApp();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(id);
  }, []);

  const list = useMemo(() => {
    if (!data?.orders || !user) return [];
    let out = data.orders.filter((o: any) => o.hotelId === user.orgId);
    if (filter === "approval") out = out.filter((o: any) => o.approval?.state === "pending");
    if (filter === "active")
      out = out.filter((o: any) => o.approval?.state !== "rejected" && o.fulfillment !== "delivered" && o.receipt !== "complete");
    if (filter === "done")
      out = out.filter((o: any) => o.approval?.state === "rejected" || (o.receipt === "complete" && o.fulfillment === "delivered"));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (o: any) =>
          o.po?.toLowerCase().includes(s) ||
          (o.supplier?.name ?? "").toLowerCase().includes(s)
      );
    }
    return out;
  }, [data?.orders, user, filter, q]);

  return (
    <RequireAuth>
      <AppShell active="/orders">
        <Guard roles={["hotel_admin", "gm", "finance_director"]}>
          <PageHead kicker={t("orders.k") ?? "Orders"} title={t("orders.t") ?? "Purchase Orders"} sub={t("orders.sub") ?? "Track your procurement orders"} />

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
                {list.map((o: any) => (
                  <tr key={o.id} className="cursor-pointer transition-colors hover:bg-fog-50 dark:hover:bg-ink-850">
                    <Td>
                      <Link href={`/orders/${o.id}`} className="font-semibold hover:underline">
                        {o.po}
                      </Link>
                      <div className="text-xs text-ink-400">{o.lines?.length ?? 0} {t("common.items") ?? "items"}</div>
                    </Td>
                    <Td className="text-[13px]">{o.supplier?.name ?? "—"}</Td>
                    <Td className="tnum text-[13px] text-ink-500">{fmtDate(o.createdAt, lang)}</Td>
                    <Td className="tnum text-end font-semibold">{o.total?.toFixed(2)}</Td>
                    <Td>
                      <StatePill s={o.approval?.state || "none"} />
                    </Td>
                    <Td>
                      {o.fulfillment === "none" ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <StatePill s={o.fulfillment} />
                      )}
                    </Td>
                    <Td className="tnum text-[13px]">
                      {o.eta ? (
                        <>
                          {fmtDate(o.eta, lang)}
                          <div className="text-xs text-ink-400">{new Date(o.eta).toLocaleDateString()}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      {o.receipt === "none" ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <StatePill s={o.receipt} />
                      )}
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