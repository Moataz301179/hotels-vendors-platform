"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VAT_RATE, productById } from "./data";
import { daysFromNow } from "./format";
import { buildSeed, type AppData, USERS } from "./seed";
import type {
  ApprovalState,
  AuthorityRule,
  FinancingApp,
  Invoice,
  InvoiceStatus,
  Order,
  Product,
  ReceiptState,
  Role,
  Tenant,
  User,
} from "./types";
import type { FulfillmentState } from "./types";

const LS_KEY = "hv:data:v3";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "warn" | "bad";
}

interface Session {
  userId: string;
}

interface StoreShape {
  data: AppData;
  cart: CartLine[];
  user: User | null;
  toasts: Toast[];
  toast: (msg: string, tone?: Toast["tone"]) => void;
  login: (userId: string) => void;
  logout: () => void;
  cartAdd: (productId: string, qty: number) => void;
  cartSetQty: (productId: string, qty: number) => void;
  cartRemove: (productId: string) => void;
  cartClear: () => void;
  cartCount: number;
  cartGroups: { supplierId: string; lines: { p: Product; qty: number }[]; subtotal: number }[];
  cartTotals: { subtotal: number; vat: number; total: number };
  evalRule: (total: number) => AuthorityRule | undefined;
  submitCart: (note: string) => { po: string; auto: boolean; required: Role[] }[];
  decideOrder: (orderId: string, approve: boolean, note: string) => void;
  advanceFulfillment: (orderId: string, etaDays?: number) => void;
  advanceDelivery: (deliveryId: string) => void;
  reportException: (deliveryId: string, note: string) => void;
  confirmGrn: (
    orderId: string,
    receipts: { index: number; qty: number; condition: string; note: string }[]
  ) => void;
  submitInvoice: (orderId: string, dueDate: string) => string;
  decideInvoice: (invoiceId: string, approve: boolean, note: string) => void;
  applyFinancing: (orderId: string, amount: number, tenor: number, purpose: string) => string;
  decideFinancing: (appId: string, approve: boolean) => void;
  sendRfq: (productId: string, qty: number, note: string) => void;
  upsertProduct: (p: Product) => void;
  toggleProductListed: (productId: string) => void;
  toggleTenant: (tenantId: string) => void;
  updateRule: (ruleId: string, patch: Partial<AuthorityRule>) => void;
  resetData: () => void;
}

const Ctx = createContext<StoreShape | null>(null);

interface Persisted {
  data: AppData;
  cart: CartLine[];
  session: Session | null;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (p && p.data && Array.isArray(p.data.orders)) return p;
    }
  } catch {
    /* ignore */
  }
  return { data: buildSeed(), cart: [], session: null };
}

let toastSeq = 1;

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useRef<Persisted | null>(null);
  if (initial.current === null) initial.current = typeof window !== "undefined" ? load() : { data: buildSeed(), cart: [], session: null };

  const [data, setData] = useState<AppData>(initial.current.data);
  const [cart, setCart] = useState<CartLine[]>(initial.current.cart);
  const [session, setSession] = useState<Session | null>(initial.current.session);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ data, cart, session }));
    } catch {
      /* ignore */
    }
  }, [data, cart, session]);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const user = useMemo(
    () => (session ? USERS.find((u) => u.id === session.userId) ?? null : null),
    [session]
  );

  const audit = useCallback(
    (
      d: AppData,
      action: string,
      actionAr: string,
      entity: string,
      detail: string,
      detailAr: string,
      actor?: User
    ): AppData => {
      const u = actor ?? user;
      return {
        ...d,
        seq: { ...d.seq, audit: d.seq.audit + 1 },
        audit: [
          {
            id: `a${Date.now()}`,
            at: new Date().toISOString(),
            actor: u?.name ?? "System",
            role: u?.role ?? "platform_admin",
            action,
            actionAr,
            entity,
            detail,
            detailAr,
          },
          ...d.audit,
        ],
      };
    },
    [user]
  );

  /* ---------- session ---------- */
  const login = useCallback((userId: string) => setSession({ userId }), []);
  const logout = useCallback(() => setSession(null), []);

  /* ---------- cart ---------- */
  const cartAdd = useCallback(
    (productId: string, qty: number) => {
      setCart((c) => {
        const ex = c.find((l) => l.productId === productId);
        if (ex) return c.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
        return [...c, { productId, qty }];
      });
    },
    []
  );
  const cartSetQty = useCallback((productId: string, qty: number) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((l) => l.productId !== productId)
        : c.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }, []);
  const cartRemove = useCallback((productId: string) => {
    setCart((c) => c.filter((l) => l.productId !== productId));
  }, []);
  const cartClear = useCallback(() => setCart([]), []);

  const cartGroups = useMemo(() => {
    const map = new Map<string, { p: Product; qty: number }[]>();
    for (const l of cart) {
      const p = data.products.find((x) => x.id === l.productId);
      if (!p) continue;
      const arr = map.get(p.supplierId) ?? [];
      arr.push({ p, qty: l.qty });
      map.set(p.supplierId, arr);
    }
    return [...map.entries()].map(([supplierId, ls]) => ({
      supplierId,
      lines: ls,
      subtotal: ls.reduce((a, x) => a + x.p.price * x.qty, 0),
    }));
  }, [cart, data.products]);

  const cartTotals = useMemo(() => {
    const subtotal = cartGroups.reduce((a, g) => a + g.subtotal, 0);
    const vat = Math.round(subtotal * VAT_RATE);
    return { subtotal, vat, total: subtotal + vat };
  }, [cartGroups]);

  const cartCount = useMemo(() => cart.reduce((a, l) => a + l.qty, 0), [cart]);

  const evalRule = useCallback(
    (total: number) =>
      data.rules.find((r) => total >= r.min && (r.max === null || total <= r.max)),
    [data.rules]
  );

  /* ---------- orders ---------- */
  const submitCart = useCallback(
    (note: string) => {
      const out: { po: string; auto: boolean; required: Role[] }[] = [];
      setData((d) => {
        let dd = { ...d, seq: { ...d.seq } };
        for (const g of cartGroups) {
          const ls = g.lines.map(({ p, qty }) => ({ productId: p.id, qty, price: p.price }));
          const subtotal = g.subtotal;
          const vat = Math.round(subtotal * VAT_RATE);
          const total = subtotal + vat;
          const rule = evalRule(total);
          const auto = !rule || rule.approvers.length === 0;
          const po = `PO-2026-0${dd.seq.po++}`;
          const order: Order = {
            id: `o${Date.now()}-${Math.round(Math.random() * 1e4)}`,
            po,
            hotelId: user?.orgId ?? "h1",
            supplierId: g.supplierId,
            lines: ls,
            createdAt: new Date().toISOString(),
            note: note || undefined,
            subtotal,
            vat,
            total,
            ruleId: rule?.id,
            approval: auto
              ? { state: "auto", required: [] }
              : { state: "pending", required: rule!.approvers },
            fulfillment: "none",
            receipt: "none",
          };
          out.push({ po, auto, required: rule?.approvers ?? [] });
          dd = { ...dd, orders: [order, ...dd.orders] };
          dd = audit(dd, "ORDER.SUBMIT", "تقديم طلب", po, `Submitted EGP ${total.toLocaleString()}.`, `قُدّم مبلغ ${total.toLocaleString()} ج.م.`);
        }
        return dd;
      });
      setCart([]);
      return out;
    },
    [cartGroups, evalRule, audit, user]
  );

  const decideOrder = useCallback(
    (orderId: string, approve: boolean, note: string) => {
      setData((d) => {
        const o = d.orders.find((x) => x.id === orderId);
        if (!o) return d;
        const dd = {
          ...d,
          orders: d.orders.map((x) =>
            x.id === orderId
              ? {
                  ...x,
                  approval: {
                    ...x.approval,
                    state: (approve ? "approved" : "rejected") as ApprovalState,
                    decidedBy: user?.name,
                    decidedAt: new Date().toISOString(),
                    note: note || undefined,
                  },
                }
              : x
          ),
        };
        return audit(dd, approve ? "ORDER.APPROVE" : "ORDER.REJECT", approve ? "اعتماد طلب" : "رفض طلب", o.po, `${approve ? "Approved" : "Rejected"} — ${note || "no note"}.`, note ? `— ${note}` : "");
      });
    },
    [audit, user]
  );

  const CARRIER_FOR: Record<string, string> = { s1: "c1", s2: "c2", s3: "c2" };

  const advanceFulfillment = useCallback(
    (orderId: string, etaDays = 2) => {
      setData((d) => {
        const o = d.orders.find((x) => x.id === orderId);
        if (!o) return d;
        let dd: AppData = { ...d };
        const next = (f: FulfillmentState): FulfillmentState =>
          f === "none"
            ? "acknowledged"
            : f === "acknowledged"
              ? "preparing"
              : "shipped";
        if (o.fulfillment === "shipped" || o.fulfillment === "in_transit" || o.fulfillment === "out_for_delivery" || o.fulfillment === "delivered") return d;
        const nf = next(o.fulfillment);
        dd = { ...dd, orders: dd.orders.map((x) => (x.id === orderId ? { ...x, fulfillment: nf } : x)) };
        if (nf === "shipped") {
          const carrierId = CARRIER_FOR[o.supplierId] ?? "c1";
          const temp = o.lines.some((l) => l.productId === "p4");
          const del = {
            id: `D-${dd.seq.delivery++}`,
            orderId,
            carrierId,
            vehicle: "Box truck 20 ft · G 4821 K",
            driver: "Mahmoud Samir",
            driverAr: "محمود سمير",
            origin: "Supplier depot",
            originAr: "مستودع المورّد",
            destination: "Hotel dock",
            destinationAr: "رصيف الفندق",
            eta: daysFromNow(etaDays, 10),
            window: "08:00 – 12:00",
            status: "scheduled" as const,
            delayed: false,
            temp,
            docs: false,
            exceptions: [],
          };
          dd = { ...dd, deliveries: [del, ...dd.deliveries] };
        }
        return audit(dd, "ORDER.FULFILL", "تحديث الوفاء", o.po, `Fulfillment → ${nf}.`, `الوفاء → ${nf}.`);
      });
    },
    [audit]
  );

  const advanceDelivery = useCallback(
    (deliveryId: string) => {
      setData((d) => {
        const del = d.deliveries.find((x) => x.id === deliveryId);
        if (!del) return d;
        const order = d.orders.find((o) => o.id === del.orderId);
        const seq: Record<string, string> = {
          scheduled: "picked_up",
          picked_up: "in_transit",
          in_transit: "out_for_delivery",
          out_for_delivery: "delivered",
        };
        const ns = seq[del.status];
        if (!ns) return d;
        let dd: AppData = {
          ...d,
          deliveries: d.deliveries.map((x) => (x.id === deliveryId ? { ...x, status: ns as never } : x)),
        };
        if (ns === "in_transit" || ns === "out_for_delivery" || ns === "delivered") {
          dd = {
            ...dd,
            orders: dd.orders.map((o) => (o.id === del.orderId ? { ...o, fulfillment: ns as FulfillmentState } : o)),
          };
        }
        return audit(dd, "DELIVERY.STATUS", "تحديث حالة التوصيل", deliveryId, `Delivery → ${ns}.`, `التوصيلة → ${ns}.`);
      });
    },
    [audit]
  );

  const reportException = useCallback(
    (deliveryId: string, note: string) => {
      setData((d) => {
        const dd = {
          ...d,
          deliveries: d.deliveries.map((x) =>
            x.id === deliveryId
              ? { ...x, delayed: true, exceptions: [...x.exceptions, { at: new Date().toISOString(), note }] }
              : x
          ),
        };
        return audit(dd, "DELIVERY.EXCEPTION", "استثناء توصيل", deliveryId, note, note);
      });
    },
    [audit]
  );

  /* ---------- receiving ---------- */
  const confirmGrn = useCallback(
    (orderId: string, receipts: { index: number; qty: number; condition: string; note: string }[]) => {
      setData((d) => {
        const o = d.orders.find((x) => x.id === orderId);
        if (!o) return d;
        const lines = o.lines.map((l, i) => {
          const r = receipts.find((x) => x.index === i);
          return r ? { ...l, received: r.qty, condition: r.condition, note: r.note || undefined } : { ...l, received: l.received ?? 0 };
        });
        const complete = lines.every((l) => (l.received ?? 0) >= l.qty);
        const dd = {
          ...d,
          orders: d.orders.map((x) =>
            x.id === orderId
              ? { ...x, lines, receipt: (complete ? "complete" : "partial") as ReceiptState }
              : x
          ),
        };
        return audit(dd, "GRN.CONFIRM", "تأكيد استلام", o.po, `GRN ${complete ? "complete" : "partial"} recorded.`, `سُجّل سند ${complete ? "كامل" : "جزئي"}.`);
      });
    },
    [audit]
  );

  /* ---------- invoices ---------- */
  const submitInvoice = useCallback(
    (orderId: string, dueDate: string) => {
      let number = "";
      setData((d) => {
        const o = d.orders.find((x) => x.id === orderId);
        if (!o) return d;
        const n = d.seq.invoice;
        number = `INV-2026-0${n}`;
        const inv: Invoice = {
          id: `i${Date.now()}`,
          number,
          orderId,
          supplierId: o.supplierId,
          hotelId: o.hotelId,
          lines: o.lines.map((l) => {
            const p = productById(l.productId)!;
            return { desc: p.name, descAr: p.nameAr, qty: l.qty, price: l.price };
          }),
          subtotal: o.subtotal,
          vat: o.vat,
          total: o.total,
          dueDate,
          submittedAt: new Date().toISOString(),
          status: "submitted",
        };
        return audit({ ...d, seq: { ...d.seq, invoice: n + 1 }, invoices: [inv, ...d.invoices] }, "INVOICE.SUBMIT", "تقديم فاتورة", number, `Submitted for ${o.po}.`, `قُدّمت للأمر ${o.po}.`);
      });
      return number;
    },
    [audit]
  );

  const decideInvoice = useCallback(
    (invoiceId: string, approve: boolean, note: string) => {
      setData((d) => {
        const inv = d.invoices.find((x) => x.id === invoiceId);
        if (!inv) return d;
        const dd = {
          ...d,
          invoices: d.invoices.map((x) =>
            x.id === invoiceId
              ? { ...x, status: (approve ? "approved" : "rejected") as InvoiceStatus, note: note || undefined }
              : x
          ),
        };
        return audit(dd, approve ? "INVOICE.APPROVE" : "INVOICE.REJECT", approve ? "اعتماد فاتورة" : "رفض فاتورة", inv.number, `${approve ? "Approved" : "Rejected"} — ${note || "no note"}.`, note ? `— ${note}` : "");
      });
    },
    [audit]
  );

  /* ---------- financing ---------- */
  const applyFinancing = useCallback(
    (orderId: string, amount: number, tenor: number, purpose: string) => {
      let number = "";
      setData((d) => {
        const n = d.seq.fin;
        number = `FIN-2026-0${String(n).padStart(2, "0")}`;
        const o = d.orders.find((x) => x.id === orderId);
        const app: FinancingApp = {
          id: `fa${Date.now()}`,
          number,
          hotelId: o?.hotelId ?? "h1",
          orderId,
          amount,
          tenor,
          purpose,
          status: "under_review",
          createdAt: new Date().toISOString(),
        };
        return audit({ ...d, seq: { ...d.seq, fin: n + 1 }, financing: [app, ...d.financing] }, "FINANCE.APPLY", "طلب تمويل", number, `Application for EGP ${amount.toLocaleString()} / ${tenor} months handed to the partner.`, `طلب تمويل ${amount.toLocaleString()} ج.م / ${tenor} شهراً أُحيل إلى الشريك.`);
      });
      return number;
    },
    [audit]
  );

  const decideFinancing = useCallback(
    (appId: string, approve: boolean) => {
      setData((d) => {
        const app = d.financing.find((x) => x.id === appId);
        if (!app) return d;
        let schedule = app.schedule;
        const status = approve ? "funded" : "declined";
        if (approve) {
          const per = Math.round(app.amount / app.tenor);
          schedule = Array.from({ length: app.tenor }, (_, i) => {
            const month = i + 1;
            return {
              month,
              due: daysFromNow(month * 30, 12),
              amount: month === app.tenor ? app.amount - per * (app.tenor - 1) : per,
              status: (month === 1 ? "due" : "upcoming") as "due" | "upcoming",
            };
          });
        }
        const dd = {
          ...d,
          financing: d.financing.map((x) =>
            x.id === appId
              ? { ...x, status: status as FinancingApp["status"], decidedAt: new Date().toISOString(), schedule }
              : x
          ),
        };
        return audit(dd, approve ? "FINANCE.FUND" : "FINANCE.DECLINE", approve ? "تمويل" : "رفض تمويل", app.number, approve ? `Funded — ${app.tenor}-month schedule active.` : `Declined by the partner.`, approve ? `موَّل — جدول ${app.tenor} شهراً فعّال.` : "رُفض من الشريك.");
      });
    },
    [audit]
  );

  /* ---------- rfq / catalog / admin ---------- */
  const sendRfq = useCallback(
    (productId: string, qty: number, note: string) => {
      setData((d) => {
        const p = d.products.find((x) => x.id === productId);
        if (!p) return d;
        const rfq = {
          id: `rf${d.seq.rfq}`,
          productId,
          qty,
          note,
          supplierId: p.supplierId,
          hotelId: user?.orgId ?? "h1",
          at: new Date().toISOString(),
          status: "open" as const,
        };
        return audit({ ...d, seq: { ...d.seq, rfq: d.seq.rfq + 1 }, rfqs: [rfq, ...d.rfqs] }, "RFQ.SEND", "إرسال طلب عرض", p.sku, `RFQ qty ${qty} to ${p.supplierId}.`, `طلب عرض كمية ${qty}.`);
      });
    },
    [audit, user]
  );

  const upsertProduct = useCallback(
    (p: Product) => {
      setData((d) => {
        const exists = d.products.some((x) => x.id === p.id);
        const dd = {
          ...d,
          products: exists ? d.products.map((x) => (x.id === p.id ? p : x)) : [...d.products, p],
        };
        return audit(dd, "CATALOG.UPSERT", "تحديث الكتالوج", p.sku, `${exists ? "Updated" : "Created"} product ${p.name}.`, `${exists ? "حُدّث" : "أُنشئ"} المنتج ${p.name}.`);
      });
    },
    [audit]
  );

  const toggleProductListed = useCallback(
    (productId: string) => {
      setData((d) => {
        const p = d.products.find((x) => x.id === productId);
        if (!p) return d;
        const dd = {
          ...d,
          products: d.products.map((x) =>
            x.id === productId
              ? { ...x, stock: (x.stock === "out" ? "in" : "out") as Product["stock"] }
              : x
          ),
        };
        return audit(dd, p.stock === "out" ? "CATALOG.LIST" : "CATALOG.DELIST", "عرض/إزالة منتج", p.sku, `${p.stock === "out" ? "Listed" : "Delisted"}.`, p.stock === "out" ? "أُعيد العرض." : "أُزيل من العرض.");
      });
    },
    [audit]
  );

  const toggleTenant = useCallback(
    (tenantId: string) => {
      setData((d) => {
        const t = d.tenants.find((x) => x.id === tenantId);
        if (!t) return d;
        const dd = {
          ...d,
          tenants: d.tenants.map((x) =>
            x.id === tenantId
              ? { ...x, status: (x.status === "active" ? "suspended" : "active") as Tenant["status"] }
              : x
          ),
        };
        return audit(dd, "TENANT.STATUS", "حالة مستأجر", t.name, t.status === "active" ? "Suspended." : "Reactivated.", t.status === "active" ? "أُوقف." : "أُعيد تفعيله.");
      });
    },
    [audit]
  );

  const updateRule = useCallback(
    (ruleId: string, patch: Partial<AuthorityRule>) => {
      setData((d) => {
        const dd = {
          ...d,
          rules: d.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
        };
        return audit(dd, "RULE.UPDATE", "تحديث قاعدة", ruleId, `Rule ${ruleId} updated.`, `حُدّثت القاعدة ${ruleId}.`);
      });
    },
    [audit]
  );

  const resetData = useCallback(() => {
    const fresh = buildSeed();
    setData(fresh);
    setCart([]);
  }, []);

  const value: StoreShape = {
    data,
    cart,
    user,
    toasts,
    toast,
    login,
    logout,
    cartAdd,
    cartSetQty,
    cartRemove,
    cartClear,
    cartCount,
    cartGroups,
    cartTotals,
    evalRule,
    submitCart,
    decideOrder,
    advanceFulfillment,
    advanceDelivery,
    reportException,
    confirmGrn,
    submitInvoice,
    decideInvoice,
    applyFinancing,
    decideFinancing,
    sendRfq,
    upsertProduct,
    toggleProductListed,
    toggleTenant,
    updateRule,
    resetData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): StoreShape {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

/* Role helpers */
export const HOTEL_ROLES: Role[] = ["hotel_admin", "gm", "finance_director"];
export function isHotelRole(r?: Role) {
  return !!r && HOTEL_ROLES.includes(r);
}
export function canApprove(user: User | null, required: Role[]) {
  if (!user) return false;
  return required.includes(user.role);
}
