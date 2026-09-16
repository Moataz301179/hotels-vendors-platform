"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { canApprove, useApp } from "@/lib/store";
import { useApi } from "@/lib/hooks/use-api";
import { carrierById, hotelById, productById, supplierById } from "@/lib/data";
import { fmtDate, fmtDateTime, fmtMoney, relDay } from "@/lib/format";
import type { Order } from "@/lib/types";
import {
  Btn,
  Card,
  EmptyState,
  KV,
  Modal,
  StatePill,
  T,
  Td,
  TextArea,
  Th,
  Banner,
  Field,
  TextInput,
} from "./ui";
import {
  IcBox,
  IcCheck,
  IcClock,
  IcDoc,
  IcStamp,
  IcThermo,
  IcTruck,
  IcX,
} from "./icons";

const FULFILL_RANK = ["none", "acknowledged", "preparing", "shipped", "in_transit", "out_for_delivery", "delivered"];

export default function OrderDetail({ orderId, mode }: { orderId: string; mode: "hotel" | "supplier" }) {
  const { t, lang } = usePrefs();
  const { data: apiData, loading: apiLoading } = useApi<{ data: Order }>(`/api/v1/orders/${orderId}`);
  const { data, user, decideOrder, advanceFulfillment, toast } = useApp();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const [etaDays, setEtaDays] = useState(2);

  const realOrder = apiData?.data;
  const safeOrder = realOrder || data.orders.find((o) => o.id === orderId);
  const safeOrder = order;

  const invoice = useMemo(
    () => (order ? data.invoices.find((i) => i.orderId === safeOrder.id) : undefined),
    [data.invoices, order]
  );
  const financing = useMemo(
    () => (order ? data.financing.find((f) => f.orderId === safeOrder.id) : undefined),
    [data.financing, order]
  );
  const delivery = useMemo(
    () => (order ? data.deliveries.find((d) => d.orderId === safeOrder.id) : undefined),
    [data.deliveries, order]
  );

  if (!order && !apiLoading && !realOrder) {
    return (
      <div className="text-center p-8 text-sm text-foreground-muted">
        Order not found or no data available.
      </div>
    );
  }
  const safeOrder = order!;
    return (
      <EmptyState
        icon={<IcBox />}
        title={t("market.notFound")}
        sub={t("market.notFoundSub")}
      />
    );
  }

  const supplier = supplierById(safeOrder.supplierId);
  const hotel = hotelById(safeOrder.hotelId);
  const canSeeHotel = mode === "hotel" || user?.role === "platform_admin";
  const isSupplierOwner = mode === "supplier" && user?.orgId === safeOrder.supplierId;

  /* ---- timeline ---- */
  const approvalDone = safeOrder.approval.state === "approved" || safeOrder.approval.state === "auto";
  const approvalFailed = safeOrder.approval.state === "rejected";
  const fr = FULFILL_RANK.indexOf(safeOrder.fulfillment);
  const hasInvoice = !!invoice;
  const settled = (invoice?.status === "paid") || financing?.status === "funded";

  const steps: { key: string; state: "done" | "current" | "todo" | "bad" }[] = [
    { key: "orders.detail.tl1", state: "done" },
    { key: "orders.detail.tl2", state: approvalFailed ? "bad" : approvalDone ? "done" : "current" },
    { key: "orders.detail.tl3", state: approvalDone ? "done" : "todo" },
    { key: "orders.detail.tl4", state: fr >= 1 ? "done" : approvalDone ? "current" : "todo" },
    { key: "orders.detail.tl5", state: fr >= 2 ? "done" : fr === 1 ? "current" : "todo" },
    { key: "orders.detail.tl6", state: fr >= 3 ? "done" : fr === 2 ? "current" : "todo" },
    { key: "orders.detail.tl7", state: fr >= 4 ? "done" : fr === 3 ? "current" : "todo" },
    { key: "orders.detail.tl8", state: fr >= 6 ? "done" : fr >= 4 && fr < 6 ? "current" : "todo" },
    {
      key: "orders.detail.tl9",
      state: safeOrder.receipt === "complete" ? "done" : safeOrder.receipt === "partial" ? "current" : fr >= 6 ? "current" : "todo",
    },
    { key: "orders.detail.tl10", state: hasInvoice ? "done" : safeOrder.receipt !== "none" ? "current" : "todo" },
    { key: "orders.detail.tl11", state: settled ? "done" : hasInvoice ? "current" : "todo" },
  ];

  const doApprove = () => {
    decideOrder(safeOrder.id, true, note);
    toast(t("orders.detail.approveDone", { po: safeOrder.po }));
    setApproveOpen(false);
    setNote("");
  };
  const doReject = () => {
    if (!note.trim()) {
      setNoteErr(t("common.required"));
      return;
    }
    decideOrder(safeOrder.id, false, note.trim());
    toast(t("orders.detail.rejectDone", { po: safeOrder.po }), "warn");
    setRejectOpen(false);
    setNote("");
    setNoteErr("");
  };
  const doShip = () => {
    advanceFulfillment(safeOrder.id, Math.max(1, Math.min(14, Number(etaDays) || 2)));
    toast(t("orders.detail.shipDone", { c: carrierById(CARRIER[safeOrder.supplierId])?.name ?? "" }));
    setShipOpen(false);
  };

  const nextFulfillLabel: Record<string, string> = {
    none: "orders.detail.ack",
    acknowledged: "orders.detail.prep",
    preparing: "orders.detail.ship",
  };
  const nextFulfillMsg: Record<string, string> = {
    none: "ackDone",
    acknowledged: "prepDone",
    preparing: "shipDone",
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="kicker mb-1.5 text-brass-600 dark:text-brass-400">{t("orders.detail.k")}</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-950 dark:text-white">
            {safeOrder.po}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {supplier?.name}
            {canSeeHotel && hotel ? ` · ${hotel.name}` : ""}
            <span className="mx-1.5">·</span>
            {fmtDate(safeOrder.createdAt, lang)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white px-5 py-4 text-end dark:border-linedark dark:bg-ink-900">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            {t("orders.detail.totalBox")}
          </div>
          <div className="tnum mt-1 text-xl font-bold text-ink-950 dark:text-white">
            {fmtMoney(safeOrder.total, lang)}
          </div>
          <div className="tnum mt-0.5 text-xs text-ink-500">
            {fmtMoney(safeOrder.vat, lang)} {t("common.vat")}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatePill s={safeOrder.approval.state} label={t(`state.${safeOrder.approval.state}`)} />
        {safeOrder.fulfillment !== "none" ? (
          <StatePill s={safeOrder.fulfillment} />
        ) : null}
        {safeOrder.receipt !== "none" ? <StatePill s={safeOrder.receipt} /> : null}
        {invoice ? <StatePill s={invoice.status} /> : null}
        {financing ? <StatePill s={financing.status} /> : null}
      </div>

      {approvalFailed ? (
        <Banner tone="bad">
          {t("orders.detail.rejectedBanner")}
          {safeOrder.approval.note ? <span className="mt-1 block italic">“{safeOrder.approval.note}”</span> : null}
        </Banner>
      ) : null}

      {/* approval actions */}
      {mode === "hotel" && safeOrder.approval.state === "pending" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink-950 dark:text-white">
                {t("cart.authority")}
              </div>
              <div className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                {t("cart.approver")}:{" "}
                <strong>{safeOrder.approval.required.map((r) => t(`role.${r}`)).join(" + ")}</strong>
              </div>
            </div>
            {canApprove(user, safeOrder.approval.required) ? (
              <div className="flex gap-2">
                <Btn onClick={() => setApproveOpen(true)}>
                  <IcCheck /> {t("orders.detail.approve")}
                </Btn>
                <Btn variant="danger" onClick={() => setRejectOpen(true)}>
                  <IcX /> {t("orders.detail.reject")}
                </Btn>
              </div>
            ) : (
              <div className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
                {t("orders.detail.needRole")}
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* supplier actions */}
      {isSupplierOwner && safeOrder.approval.state !== "rejected" && safeOrder.fulfillment === "none" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-ink-950 dark:text-white">
              {t("orders.detail.supplierActions")}
            </div>
            <Btn
              onClick={() => {
                advanceFulfillment(safeOrder.id);
                toast(t("orders.detail." + (nextFulfillMsg[safeOrder.fulfillment] ?? "ackDone"), { s: supplier?.name ?? "" }));
              }}
            >
              <IcCheck /> {t(nextFulfillLabel[safeOrder.fulfillment])}
            </Btn>
          </div>
        </Card>
      ) : null}
      {isSupplierOwner && safeOrder.fulfillment === "acknowledged" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-ink-950 dark:text-white">
              {t("orders.detail.supplierActions")}
            </div>
            <Btn
              onClick={() => {
                advanceFulfillment(safeOrder.id);
                toast(t("orders.detail.prepDone"));
              }}
            >
              <IcBox /> {t("orders.detail.prep")}
            </Btn>
          </div>
        </Card>
      ) : null}
      {isSupplierOwner && safeOrder.fulfillment === "preparing" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-ink-950 dark:text-white">
              {t("orders.detail.supplierActions")}
            </div>
            <Btn onClick={() => setShipOpen(true)}>
              <IcTruck /> {t("orders.detail.ship")}
            </Btn>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* timeline */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
            {t("orders.detail.timeline")}
          </h2>
          <ol className="space-y-0">
            {steps.map((st, i) => (
              <li key={st.key} className="relative flex gap-3 pb-5 last:pb-0">
                {i < steps.length - 1 ? (
                  <span
                    className={`absolute start-[11px] top-6 h-full w-px ${
                      st.state === "done" ? "bg-emerald-500/50" : "bg-line dark:bg-linedark"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    st.state === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : st.state === "bad"
                        ? "border-red-500 bg-red-500 text-white"
                        : st.state === "current"
                          ? "border-brass-500 bg-brass-500/15 text-brass-700 dark:text-brass-300"
                          : "border-line bg-white text-ink-400 dark:border-linedark dark:bg-ink-900"
                  }`}
                >
                  {st.state === "done" ? <IcCheck /> : st.state === "bad" ? <IcX /> : i + 1}
                </span>
                <span
                  className={`pt-1 text-sm ${
                    st.state === "todo"
                      ? "text-ink-400 dark:text-ink-500"
                      : st.state === "bad"
                        ? "font-medium text-red-700 dark:text-red-400"
                        : st.state === "current"
                          ? "font-semibold text-ink-950 dark:text-white"
                          : "text-ink-600 dark:text-ink-300"
                  }`}
                >
                  {t(st.key)}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        {/* lines + cards */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4 dark:border-linedark">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("orders.detail.lineItems")}
              </h2>
            </div>
            <T minWidth="min-w-[480px]">
              <thead>
                <tr>
                  <Th>{t("common.name")}</Th>
                  <Th className="text-end">{t("common.quantity")}</Th>
                  {mode === "hotel" ? <Th className="text-end">{t("orders.detail.received")}</Th> : null}
                  <Th className="text-end">{t("common.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {safeOrder.lines.map((l) => {
                  const p = productById(l.productId);
                  return (
                    <tr key={l.productId}>
                      <Td>
                        <div className="font-medium text-ink-950 dark:text-ink-100">{p ? (lang === "ar" ? p.nameAr : p.name) : l.productId}</div>
                        <div className="text-xs text-ink-400">{p?.sku}</div>
                      </Td>
                      <Td className="tnum text-end">{l.qty}</Td>
                      {mode === "hotel" ? (
                        <Td className="tnum text-end">
                          {typeof l.received === "number" ? l.received : "—"}
                          {l.condition ? (
                            <div className="text-xs text-ink-400">{t(`receiving.cond${cap(l.condition)}`)}</div>
                          ) : null}
                        </Td>
                      ) : null}
                      <Td className="tnum text-end font-medium">{fmtMoney(l.qty * l.price, lang)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </T>
            <div className="flex justify-end gap-8 border-t border-line px-5 py-3 text-sm dark:border-linedark">
              <span className="text-ink-500">{t("common.subtotal")} <span className="tnum font-medium text-ink-950 dark:text-ink-100">{fmtMoney(safeOrder.subtotal, lang)}</span></span>
              <span className="text-ink-500">{t("common.vat")} <span className="tnum font-medium text-ink-950 dark:text-ink-100">{fmtMoney(safeOrder.vat, lang)}</span></span>
              <span className="font-semibold text-ink-950 dark:text-white">{fmtMoney(safeOrder.total, lang)}</span>
            </div>
          </Card>

          {/* delivery */}
          {delivery ? (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  <IcTruck /> {t("orders.detail.deliveryCard")} · {delivery.id}
                </h2>
                <StatePill s={delivery.status} tone={delivery.delayed ? "bad" : undefined} />
              </div>
              <dl className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                <KV k={t("eta.col.carrier")} v={carrierById(delivery.carrierId)?.name ?? "—"} />
                <KV k={t("eta.col.vehicle")} v={delivery.vehicle} />
                <KV k={t("common.name")} v={lang === "ar" ? delivery.driverAr : delivery.driver} />
                <KV
                  k={t("orders.detail.etaLabel")}
                  v={
                    <span className="tnum">
                      {fmtDateTime(delivery.eta, lang)}
                      <span className="ms-2 text-xs font-normal text-ink-400">{relDay(delivery.eta, lang)}</span>
                    </span>
                  }
                />
                <KV k={t("eta.col.lane")} v={`${lang === "ar" ? delivery.originAr : delivery.origin} → ${lang === "ar" ? delivery.destinationAr : delivery.destination}`} />
                <KV k={t("orders.detail.window")} v={delivery.window} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <ComplianceChip ok={delivery.temp} label={t("orders.detail.temp")} Icon={IcThermo} />
                <ComplianceChip ok={delivery.docs} label={t("orders.detail.docs")} Icon={IcDoc} />
                <ComplianceChip ok={!delivery.delayed} label={t("state.on_time")} Icon={IcClock} />
              </div>
              {delivery.exceptions.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {delivery.exceptions.map((ex, i) => (
                    <div key={i} className="rounded border border-red-600/25 bg-red-600/5 px-3 py-2 text-[13px] text-red-800 dark:text-red-300">
                      <span className="tnum me-2 text-xs opacity-70">{fmtDateTime(ex.at, lang)}</span>
                      {ex.note}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}

          {/* invoice + financing */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcDoc /> {t("orders.detail.invoiceCard")}
              </h2>
              {invoice ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-950 dark:text-white">{invoice.number}</span>
                    <StatePill s={invoice.status} />
                  </div>
                  <div className="tnum mt-2 text-lg font-bold text-ink-950 dark:text-white">{fmtMoney(invoice.total, lang)}</div>
                  <Link href="/invoices" className="mt-3 inline-block text-[13px] font-medium text-brass-600 hover:underline dark:text-brass-400">
                    {t("orders.detail.viewIn", { p: t("nav.invoices") })}
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-400">{t("common.noData")}</p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                <IcStamp /> {t("orders.detail.financingCard")}
              </h2>
              {financing ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-950 dark:text-white">{financing.number}</span>
                    <StatePill s={financing.status} />
                  </div>
                  <div className="tnum mt-2 text-lg font-bold text-ink-950 dark:text-white">{fmtMoney(financing.amount, lang)}</div>
                  <Link href="/financing" className="mt-3 inline-block text-[13px] font-medium text-brass-600 hover:underline dark:text-brass-400">
                    {t("orders.detail.viewIn", { p: t("nav.financing") })}
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-400">{t("common.noData")}</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* modals */}
      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={t("orders.detail.approveT")}
        sub={`${safeOrder.po} — ${fmtMoney(safeOrder.total, lang)}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setApproveOpen(false)}>{t("common.cancel")}</Btn>
            <Btn onClick={doApprove}><IcCheck /> {t("orders.detail.approve")}</Btn>
          </>
        }
      >
        <Field label={t("orders.detail.note")} id="ap-note">
          <TextArea id="ap-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("common.optional")} />
        </Field>
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setNoteErr(""); }}
        title={t("orders.detail.rejectT")}
        sub={`${safeOrder.po} — ${fmtMoney(safeOrder.total, lang)}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setRejectOpen(false)}>{t("common.cancel")}</Btn>
            <Btn variant="danger" onClick={doReject}><IcX /> {t("orders.detail.reject")}</Btn>
          </>
        }
      >
        <Field label={t("orders.detail.note")} id="rj-note" error={noteErr}>
          <TextArea id="rj-note" value={note} onChange={(e) => { setNote(e.target.value); setNoteErr(""); }} />
        </Field>
      </Modal>

      <Modal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        title={t("orders.detail.ship")}
        sub={safeOrder.po}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShipOpen(false)}>{t("common.cancel")}</Btn>
            <Btn onClick={doShip}><IcTruck /> {t("orders.detail.ship")}</Btn>
          </>
        }
      >
        <Field label={t("orders.detail.shipEta")} id="eta-days">
          <TextInput id="eta-days" type="number" min={1} max={14} value={etaDays} onChange={(e) => setEtaDays(Number(e.target.value))} />
        </Field>
      </Modal>
    </div>
  );
}

const CARRIER: Record<string, string> = { s1: "c1", s2: "c2", s3: "c2" };

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ComplianceChip({ ok, label, Icon }: { ok: boolean; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        ok
          ? "border-emerald-600/25 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
      }`}
    >
      <Icon className="text-sm" />
      {label}
      {ok ? <IcCheck /> : <IcClock />}
    </span>
  );
}
