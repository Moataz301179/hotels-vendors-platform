"use client";

import { useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { productById, supplierById } from "@/lib/data";
import { fmtDate, fmtMoney, relDay } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import {
  Banner,
  Btn,
  Card,
  EmptyState,
  Modal,
  PageHead,
  Select,
  StatePill,
  T,
  Td,
  TextArea,
  TextInput,
  Th,
} from "@/components/ui";
import { IcCheck, IcReceipt, IcTruck } from "@/components/icons";
import type { Order, Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

interface ReceiptRow {
  index: number;
  qty: number;
  condition: string;
  note: string;
}

export default function ReceivingPage() {
  const { t, lang } = usePrefs();
  const { data, user, confirmGrn, toast } = useApp();
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  const eligible: Order[] = data.orders.filter(
    (o) => o.hotelId === user?.orgId && o.fulfillment === "delivered" && o.receipt !== "complete"
  );

  return (
    <RequireAuth>
      <AppShell active="/receiving">
        <Guard roles={HOTEL}>
          <PageHead kicker={t("receiving.k")} title={t("receiving.t")} sub={t("receiving.sub")} />
          <Banner tone="info" className="mb-6">
            {t("receiving.partialNote")}
          </Banner>

          {eligible.length === 0 ? (
            <EmptyState icon={<IcReceipt />} title={t("receiving.empty")} sub={t("receiving.emptySub")} />
          ) : (
            <div className="space-y-5">
              {eligible.map((o) => (
                <GrnCard
                  key={o.id}
                  order={o}
                  onConfirm={(rows) => {
                    confirmGrn(o.id, rows);
                    toast(t("receiving.done", { po: o.po }));
                  }}
                />
              ))}
            </div>
          )}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}

function GrnCard({ order, onConfirm }: { order: Order; onConfirm: (rows: ReceiptRow[]) => void }) {
  const { t, lang } = usePrefs();
  const { data } = useApp();
  const sup = supplierById(order.supplierId);
  const [rows, setRows] = useState<ReceiptRow[]>(() =>
    order.lines.map((l, index) => ({
      index,
      qty: l.received ?? l.qty,
      condition: l.condition ?? "good",
      note: l.note ?? "",
    }))
  );
  const [open, setOpen] = useState(false);

  const set = (i: number, patch: Partial<ReceiptRow>) =>
    setRows((rs) => rs.map((r) => (r.index === i ? { ...r, ...patch } : r)));

  const full = rows.every((r) => r.qty >= order.lines[r.index].qty);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-fog-50 px-5 py-4 dark:border-linedark dark:bg-ink-850">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold">{order.po}</span>
            {order.receipt === "partial" ? <StatePill s="partial" /> : <StatePill s="delivered" />}
          </div>
          <div className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">
            {sup?.name} · {lang === "ar" ? "استلم" : "Delivered"} {order.eta ? relDay(order.eta, lang) : ""} ·{" "}
            <span className="tnum font-semibold text-ink-950 dark:text-ink-100">{fmtMoney(order.total, lang)}</span>
          </div>
        </div>
        <Btn onClick={() => setOpen(true)}>
          <IcCheck /> {t("receiving.confirm")}
        </Btn>
      </div>
      <T minWidth="min-w-[720px]">
        <thead>
          <tr>
            <Th>{t("common.name")}</Th>
            <Th className="text-end">{t("receiving.expected")}</Th>
            <Th className="text-end">{t("receiving.received")}</Th>
            <Th>{t("receiving.condition")}</Th>
            <Th>{t("receiving.lineNote")}</Th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l, i) => {
            const p = productById(l.productId);
            const r = rows.find((x) => x.index === i)!;
            const short = r.qty < l.qty;
            return (
              <tr key={l.productId}>
                <Td>
                  <div className="text-sm font-medium">{p ? (lang === "ar" ? p.nameAr : p.name) : l.productId}</div>
                  <div className="tnum text-xs text-ink-400">
                    {p?.sku} · {fmtMoney(l.price, lang)}/u
                  </div>
                </Td>
                <Td className="tnum text-end">{l.qty}</Td>
                <Td className="text-end">
                  <input
                    type="number"
                    min={0}
                    max={l.qty}
                    value={r.qty}
                    onChange={(e) => set(i, { qty: Math.max(0, Math.min(l.qty, Number(e.target.value) || 0)) })}
                    className={`tnum h-9 w-20 rounded border bg-transparent text-center text-sm font-semibold outline-none ${
                      short ? "border-amber-500/60 text-amber-700 dark:text-amber-400" : "border-line dark:border-linedark"
                    }`}
                    aria-label={t("receiving.received")}
                  />
                  {short ? <div className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">−{l.qty - r.qty}</div> : null}
                </Td>
                <Td>
                  <Select
                    value={r.condition}
                    onChange={(e) => set(i, { condition: e.target.value })}
                    className="!h-9 min-w-28 text-[13px]"
                    aria-label={t("receiving.condition")}
                  >
                    <option value="good">{t("receiving.condGood")}</option>
                    <option value="damaged">{t("receiving.condDamaged")}</option>
                    <option value="short">{t("receiving.condShort")}</option>
                  </Select>
                </Td>
                <Td>
                  <TextInput
                    value={r.note}
                    onChange={(e) => set(i, { note: e.target.value })}
                    className="!h-9 min-w-40 text-[13px]"
                    placeholder={t("common.optional")}
                    aria-label={t("receiving.lineNote")}
                  />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </T>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("receiving.confirmT")}
        sub={t("receiving.confirmSub", { po: order.po })}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Btn>
            <Btn
              onClick={() => {
                onConfirm(rows);
                setOpen(false);
              }}
            >
              <IcTruck /> {t("common.confirm")}
            </Btn>
          </>
        }
      >
        <dl className="divide-y divide-line dark:divide-linedark">
          {rows.map((r) => {
            const l = order.lines[r.index];
            const p = productById(l.productId);
            return (
              <div key={r.index} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-ink-500 dark:text-ink-400">{p ? (lang === "ar" ? p.nameAr : p.name) : l.productId}</dt>
                <dd className="tnum font-medium">
                  {r.qty} / {l.qty} · {t(`receiving.cond${cap(r.condition)}`)}
                </dd>
              </div>
            );
          })}
        </dl>
        {!full ? (
          <Banner tone="warn" className="mt-4">
            {t("receiving.partialNote")}
          </Banner>
        ) : null}
      </Modal>
    </Card>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
