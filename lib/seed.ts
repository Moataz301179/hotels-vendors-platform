import {
  CARRIERS,
  HOTELS,
  PARTNERS,
  PRODUCTS,
  SUPPLIERS,
  VAT_RATE,
  productById,
} from "./data";
import { daysFromNow } from "./format";
import type {
  AuthorityRule,
  AuditEntry,
  Delivery,
  FinancingApp,
  Invoice,
  Order,
  OrderLine,
  Tenant,
  User,
} from "./types";

/* The verified pilot dataset: 5 hotels, 3 suppliers, 1 licensed financing
 * partner, 2 carriers. Totals are computed from line items so the pilot
 * baseline is internally consistent. */

export interface Rfq {
  id: string;
  productId: string;
  qty: number;
  note: string;
  supplierId: string;
  hotelId: string;
  at: string;
  status: "open" | "quoted";
}

export interface AppData {
  products: (typeof PRODUCTS)[number][];
  orders: Order[];
  deliveries: Delivery[];
  invoices: Invoice[];
  financing: FinancingApp[];
  audit: AuditEntry[];
  tenants: Tenant[];
  rules: AuthorityRule[];
  rfqs: Rfq[];
  seq: { po: number; invoice: number; fin: number; delivery: number; audit: number; rfq: number };
}

export const USERS: User[] = [
  { id: "u1", name: "Omar Khalil", nameAr: "عمر خليل", orgId: "h1", orgType: "hotel", role: "hotel_admin", title: "Hotel Admin / Head of Procurement", titleAr: "مدير الفندق / رئيس المشتريات", lastActive: daysFromNow(0, 8) },
  { id: "u2", name: "Laila Mansour", nameAr: "ليلى منصور", orgId: "h1", orgType: "hotel", role: "gm", title: "General Manager", titleAr: "المدير العام", lastActive: daysFromNow(0, 9) },
  { id: "u3", name: "Hany Farouk", nameAr: "هانى فاروق", orgId: "h1", orgType: "hotel", role: "finance_director", title: "Finance Director", titleAr: "مدير المالية", lastActive: daysFromNow(-1, 16) },
  { id: "u4", name: "Salma Ibrahim", nameAr: "سلمى إبراهيم", orgId: "h2", orgType: "hotel", role: "hotel_admin", title: "Hotel Admin", titleAr: "مديرة الفندق", lastActive: daysFromNow(0, 7) },
  { id: "u5", name: "Karim Nabil", nameAr: "كريم نبيل", orgId: "h3", orgType: "hotel", role: "hotel_admin", title: "Hotel Admin", titleAr: "مدير الفندق", lastActive: daysFromNow(-2, 11) },
  { id: "u6", name: "Nadia Adel", nameAr: "نادية عادل", orgId: "h4", orgType: "hotel", role: "hotel_admin", title: "Hotel Admin", titleAr: "مديرة الفندق", lastActive: daysFromNow(-3, 13) },
  { id: "u7", name: "Youssef Hamed", nameAr: "يوسف حامد", orgId: "h5", orgType: "hotel", role: "hotel_admin", title: "Hotel Admin", titleAr: "مدير الفندق", lastActive: daysFromNow(-5, 10) },
  { id: "u8", name: "Mostafa Abo El Fotouh", nameAr: "مصطفى أبو الفتح", orgId: "s1", orgType: "supplier", role: "supplier_manager", title: "Head of Sales", titleAr: "رئيس المبيعات", lastActive: daysFromNow(0, 9) },
  { id: "u9", name: "Mona El Sharkawy", nameAr: "منى الشلقامي", orgId: "s2", orgType: "supplier", role: "supplier_manager", title: "Account Manager", titleAr: "مديرة الحسابات", lastActive: daysFromNow(0, 8) },
  { id: "u10", name: "Tarek Sobhy", nameAr: "طارق صبحي", orgId: "s3", orgType: "supplier", role: "supplier_manager", title: "Operations Lead", titleAr: "رئيس العمليات", lastActive: daysFromNow(-1, 12) },
  { id: "u11", name: "Dr. Heba Zaki", nameAr: "د. هبة زكي", orgId: "f1", orgType: "partner", role: "partner_officer", title: "Facilities Officer", titleAr: "مديرة التسهيلات", lastActive: daysFromNow(0, 10) },
  { id: "u12", name: "Sherif El Masry", nameAr: "شريف المصري", orgId: "c1", orgType: "carrier", role: "carrier", title: "Dispatch Lead", titleAr: "رئيس التوزيع", lastActive: daysFromNow(0, 6) },
  { id: "u13", name: "Amal Reda", nameAr: "أمل رضا", orgId: "c2", orgType: "carrier", role: "carrier", title: "Fleet Coordinator", titleAr: "منسقة الأسطول", lastActive: daysFromNow(-1, 9) },
  { id: "u14", name: "Ahmed Ghanem", nameAr: "أحمد الجنبي", orgId: "platform", orgType: "platform", role: "platform_admin", title: "Platform Administrator", titleAr: "مدير المنصة", lastActive: daysFromNow(0, 9) },
  { id: "u15", name: "Rana Adel", nameAr: "رنا عادل", orgId: "platform", orgType: "platform", role: "platform_admin", title: "Trust & Compliance", titleAr: "الثقة والامتثال", lastActive: daysFromNow(-1, 17) },
];

function lines(spec: [string, number][]): OrderLine[] {
  return spec.map(([productId, qty]) => {
    const p = productById(productId)!;
    return { productId, qty, price: p.price };
  });
}

function totals(ls: OrderLine[]) {
  const subtotal = ls.reduce((a, l) => a + l.qty * l.price, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  return { subtotal, vat, total: subtotal + vat };
}

interface OrderSpec {
  id: string;
  po: string;
  hotelId: string;
  supplierId: string;
  ls: [string, number][];
  created: string;
  approval: Order["approval"];
  fulfillment: Order["fulfillment"];
  eta?: string;
  receipt: Order["receipt"];
  ruleId: string;
  note?: string;
}

function mk(spec: OrderSpec): Order {
  const ls = lines(spec.ls);
  return {
    id: spec.id,
    po: spec.po,
    hotelId: spec.hotelId,
    supplierId: spec.supplierId,
    lines: ls,
    createdAt: spec.created,
    note: spec.note,
    ...totals(ls),
    ruleId: spec.ruleId,
    approval: spec.approval,
    fulfillment: spec.fulfillment,
    eta: spec.eta,
    receipt: spec.receipt,
  };
}

const D = daysFromNow;

export function buildSeed(): AppData {
  const orders: Order[] = [
    mk({
      id: "o1", po: "PO-2026-0142", hotelId: "h1", supplierId: "s1",
      ls: [["p1", 80], ["p2", 20], ["p3", 6], ["p7", 40]],
      created: D(-2, 9), approval: { state: "approved", required: ["gm"], decidedBy: "Laila Mansour", decidedAt: D(-2, 11) },
      fulfillment: "in_transit", eta: D(1, 10), receipt: "none", ruleId: "r2",
    }),
    mk({
      id: "o2", po: "PO-2026-0138", hotelId: "h1", supplierId: "s2",
      ls: [["p9", 40], ["p8", 120], ["p10", 24], ["p11", 20]],
      created: D(-1, 10), approval: { state: "pending", required: ["gm"] },
      fulfillment: "none", receipt: "none", ruleId: "r2",
      note: "Q3 linen refresh for towers A/B.",
    }),
    mk({
      id: "o3", po: "PO-2026-0131", hotelId: "h1", supplierId: "s1",
      ls: [["p5", 6], ["p6", 8]],
      created: D(-9, 9), approval: { state: "approved", required: ["gm"], decidedBy: "Laila Mansour", decidedAt: D(-9, 13) },
      fulfillment: "delivered", eta: D(-8, 11), receipt: "partial", ruleId: "r2",
    }),
    mk({
      id: "o4", po: "PO-2026-0127", hotelId: "h1", supplierId: "s3",
      ls: [["p17", 4], ["p18", 3], ["p19", 12], ["p20", 10], ["p21", 6], ["p22", 8]],
      created: D(-21, 9), approval: { state: "approved", required: ["gm"], decidedBy: "Laila Mansour", decidedAt: D(-21, 12) },
      fulfillment: "delivered", eta: D(-18, 10), receipt: "complete", ruleId: "r2",
    }),
    mk({
      id: "o5", po: "PO-2026-0119", hotelId: "h1", supplierId: "s2",
      ls: [["p8", 60], ["p10", 12], ["p12", 10]],
      created: D(-24, 10), approval: { state: "auto", required: [] },
      fulfillment: "delivered", eta: D(-22, 9), receipt: "complete", ruleId: "r1",
    }),
    mk({
      id: "o6", po: "PO-2026-0124", hotelId: "h1", supplierId: "s2",
      ls: [["p13", 120], ["p15", 40]],
      created: D(-3, 14), approval: { state: "auto", required: [] },
      fulfillment: "preparing", eta: D(3, 9), receipt: "none", ruleId: "r1",
    }),
    mk({
      id: "o7", po: "PO-2026-0135", hotelId: "h1", supplierId: "s1",
      ls: [["p3", 20], ["p2", 30]],
      created: D(-5, 15), approval: { state: "rejected", required: ["gm"], decidedBy: "Laila Mansour", decidedAt: D(-5, 17), note: "F&B budget re-allocated for the season; re-request next cycle." },
      fulfillment: "none", receipt: "none", ruleId: "r2",
    }),
    mk({
      id: "o8", po: "PO-2026-0140", hotelId: "h2", supplierId: "s1",
      ls: [["p1", 40], ["p7", 60], ["p6", 12]],
      created: D(-1, 8), approval: { state: "auto", required: [] },
      fulfillment: "in_transit", eta: D(1, 14), receipt: "none", ruleId: "r1",
    }),
    mk({
      id: "o9", po: "PO-2026-0144", hotelId: "h1", supplierId: "s3",
      ls: [["p20", 60], ["p18", 10], ["p19", 40], ["p22", 40]],
      created: D(0, 8), approval: { state: "pending", required: ["gm", "finance_director"], note: "General Manager approved — awaiting Finance Director." },
      fulfillment: "none", receipt: "none", ruleId: "r3",
      note: "Annual fire-safety & HVAC refresh across all floors.",
    }),
    mk({
      id: "o10", po: "PO-2026-0121", hotelId: "h2", supplierId: "s2",
      ls: [["p8", 48], ["p9", 16], ["p10", 12]],
      created: D(-30, 9), approval: { state: "auto", required: [] },
      fulfillment: "delivered", eta: D(-27, 10), receipt: "complete", ruleId: "r1",
    }),
    mk({
      id: "o11", po: "PO-2026-0122", hotelId: "h1", supplierId: "s3",
      ls: [["p17", 6], ["p21", 10], ["p20", 8]],
      created: D(-12, 9), approval: { state: "auto", required: [] },
      fulfillment: "delivered", eta: D(-10, 10), receipt: "complete", ruleId: "r1",
    }),
    mk({
      id: "o12", po: "PO-2026-0112", hotelId: "h1", supplierId: "s1",
      ls: [["p7", 120]],
      created: D(-38, 9), approval: { state: "auto", required: [] },
      fulfillment: "delivered", eta: D(-36, 10), receipt: "complete", ruleId: "r1",
    }),
  ];

  const orderTotals = (id: string) => {
    const o = orders.find((x) => x.id === id)!;
    return {
      lines: o.lines.map((l) => {
        const p = productById(l.productId)!;
        return { desc: p.name, descAr: p.nameAr, qty: l.qty, price: l.price };
      }),
      ...totals(o.lines),
    };
  };

  const invoices: Invoice[] = [
    {
      id: "i1", number: "INV-2026-031", orderId: "o3", supplierId: "s1", hotelId: "h1",
      ...orderTotals("o3"), dueDate: D(12), submittedAt: D(-2), status: "submitted",
    },
    {
      id: "i2", number: "INV-2026-028", orderId: "o4", supplierId: "s3", hotelId: "h1",
      ...orderTotals("o4"), dueDate: D(20), submittedAt: D(-12), status: "approved",
    },
    {
      id: "i3", number: "INV-2026-024", orderId: "o5", supplierId: "s2", hotelId: "h1",
      ...orderTotals("o5"), dueDate: D(-8), submittedAt: D(-18), status: "paid",
    },
    {
      id: "i4", number: "INV-2026-019", orderId: "o12", supplierId: "s1", hotelId: "h1",
      ...orderTotals("o12"), dueDate: D(-25), submittedAt: D(-33), status: "rejected",
      note: "Duplicate — consumption already covered under INV-2026-017.",
    },
    {
      id: "i5", number: "INV-2026-029", orderId: "o10", supplierId: "s2", hotelId: "h2",
      ...orderTotals("o10"), dueDate: D(15), submittedAt: D(-21), status: "approved",
    },
    {
      id: "i6", number: "INV-2026-026", orderId: "o11", supplierId: "s3", hotelId: "h1",
      ...orderTotals("o11"), dueDate: D(10), submittedAt: D(-5), status: "approved",
    },
  ];

  const financed = Math.round(invoices[1].total / 12);
  const schedule = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const amount = month === 12 ? invoices[1].total - financed * 11 : financed;
    return {
      month,
      due: D((month - 4) * 30),
      amount,
      status: (month <= 3 ? "paid" : month === 4 ? "due" : "upcoming") as "paid" | "due" | "upcoming",
    };
  });

  const financing: FinancingApp[] = [
    {
      id: "fa1", number: "FIN-2026-004", hotelId: "h1", orderId: "o4",
      amount: invoices[1].total, tenor: 12,
      purpose: "MRO & fire-safety settlement, Q2",
      status: "funded", createdAt: D(-105), decidedAt: D(-100), schedule,
    },
    {
      id: "fa2", number: "FIN-2026-005", hotelId: "h2", orderId: "o10",
      amount: invoices[4].total, tenor: 6,
      purpose: "Linen program settlement",
      status: "under_review", createdAt: D(-3),
    },
  ];

  const deliveries: Delivery[] = [
    {
      id: "D-8841", orderId: "o1", carrierId: "c1",
      vehicle: "Box truck 20 ft · G 4821 K", driver: "Mahmoud Samir", driverAr: "محمود سمير",
      origin: "6th of October City DC", originAr: "مستودع أكتوبر",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(1, 10), window: "08:00 – 12:00", status: "in_transit", delayed: false,
      temp: false, docs: true, exceptions: [],
    },
    {
      id: "D-8838", orderId: "o3", carrierId: "c1",
      vehicle: "Box truck 20 ft · G 4821 K", driver: "Mahmoud Samir", driverAr: "محمود سمير",
      origin: "6th of October City DC", originAr: "مستودع أكتوبر",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(-8, 11), window: "08:00 – 12:00", status: "delivered", delayed: false,
      temp: false, docs: true, exceptions: [],
    },
    {
      id: "D-8835", orderId: "o4", carrierId: "c2",
      vehicle: "Flatbed 18 ft · A 9034 M", driver: "Khaled Fathy", driverAr: "خالد فتحي",
      origin: "10th of Ramadan City", originAr: "مدينة 15 مايو",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(-18, 12, 15), window: "09:00 – 13:00", status: "delivered", delayed: true,
      temp: false, docs: true,
      exceptions: [{ at: D(-18, 8), note: "Desert Road closure — ETA +1h15m, hotel notified." }],
    },
    {
      id: "D-8829", orderId: "o5", carrierId: "c2",
      vehicle: "Van 8 ft · A 7712 T", driver: "Samir Adel", driverAr: "سمير عادل",
      origin: "Obour Industrial Zone", originAr: "المنطقة الصناعية بالعور",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(-22, 10), window: "08:00 – 12:00", status: "delivered", delayed: true,
      temp: false, docs: true,
      exceptions: [{ at: D(-22, 7), note: "Loading delay at depot — 50 min, window at risk." }],
    },
    {
      id: "D-8845", orderId: "o8", carrierId: "c1",
      vehicle: "Box truck 20 ft · G 4821 K", driver: "Mahmoud Samir", driverAr: "محمود سمير",
      origin: "6th of October City DC", originAr: "مستودع أكتوبر",
      destination: "Hurghada — Marina Bay Resort", destinationAr: "غردقة — مريנה باي",
      eta: D(1, 14), window: "12:00 – 16:00", status: "in_transit", delayed: false,
      temp: false, docs: true, exceptions: [],
    },
    {
      id: "D-8847", orderId: "o6", carrierId: "c2",
      vehicle: "Van 8 ft · A 7712 T", driver: "Samir Adel", driverAr: "سمير عادل",
      origin: "Obour Industrial Zone", originAr: "المنطقة الصناعية بالعور",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(3, 9), window: "08:00 – 12:00", status: "scheduled", delayed: false,
      temp: false, docs: false, exceptions: [],
    },
    {
      id: "D-8812", orderId: "o10", carrierId: "c2",
      vehicle: "Box truck 20 ft · A 5510 P", driver: "Hassan Ali", driverAr: "حسن علي",
      origin: "Obour Industrial Zone", originAr: "المنطقة الصناعية بالعور",
      destination: "Hurghada — Marina Bay Resort", destinationAr: "غردقة — مرينا باي",
      eta: D(-27, 10), window: "08:00 – 12:00", status: "delivered", delayed: false,
      temp: false, docs: true, exceptions: [],
    },
    {
      id: "D-8824", orderId: "o11", carrierId: "c2",
      vehicle: "Flatbed 18 ft · A 9034 M", driver: "Khaled Fathy", driverAr: "خالد فتحي",
      origin: "10th of Ramadan City", originAr: "مدينة 15 مايو",
      destination: "Cairo — Nile Crown Hotel", destinationAr: "القاهرة — نيل كراون",
      eta: D(-10, 10), window: "09:00 – 13:00", status: "delivered", delayed: false,
      temp: false, docs: true, exceptions: [],
    },
  ];

  const tenants: Tenant[] = [
    ...HOTELS.map((h) => ({
      id: h.id, name: h.name, nameAr: h.nameAr, kind: "hotel" as const,
      city: h.city, status: "active" as const, since: h.since,
      users: USERS.filter((u) => u.orgId === h.id).length,
    })),
    ...SUPPLIERS.map((s) => ({
      id: s.id, name: s.name, nameAr: s.nameAr, kind: "supplier" as const,
      city: s.city, status: "active" as const, since: s.since,
      users: USERS.filter((u) => u.orgId === s.id).length,
    })),
    ...PARTNERS.map((p) => ({
      id: p.id, name: p.name, nameAr: p.nameAr, kind: "partner" as const,
      city: "Cairo", status: "active" as const, since: 2025,
      users: 1,
    })),
    ...CARRIERS.map((c, i) => ({
      id: c.id, name: c.name, nameAr: c.nameAr, kind: "carrier" as const,
      city: c.city, status: "active" as const, since: 2025 + i,
      users: 1,
    })),
  ];

  const rules: AuthorityRule[] = [
    { id: "r1", name: "Procurement lead band", nameAr: "نطاق رئيس المشتريات", min: 0, max: 50000, approvers: [], slaHours: 0 },
    { id: "r2", name: "General manager band", nameAr: "نطاق المدير العام", min: 50001, max: 200000, approvers: ["gm"], slaHours: 24 },
    { id: "r3", name: "Dual control band", nameAr: "نطاق الموافقة المزدوجة", min: 200001, max: null, approvers: ["gm", "finance_director"], slaHours: 48 },
  ];

  const audit: AuditEntry[] = [
    { id: "a1", at: D(0, 8, 12), actor: "Omar Khalil", role: "hotel_admin", action: "ORDER.SUBMIT", actionAr: "تقديم طلب", entity: "PO-2026-0144", detail: "Submitted EGP 239,084 for dual-control review.", detailAr: "قُدّم مبلغ 239,084 ج.م للمراجعة المزدوجة." },
    { id: "a2", at: D(0, 8, 30), actor: "Laila Mansour", role: "gm", action: "ORDER.APPROVE", actionAr: "اعتماد طلب", entity: "PO-2026-0144", detail: "Approved first leg; Finance Director pending.", detailAr: "اعتمدت المقطع الأول؛ مدير المالية قيد الانتظار." },
    { id: "a3", at: D(-1, 15, 20), actor: "Mostafa Abo El Fotouh", role: "supplier_manager", action: "INVOICE.SUBMIT", actionAr: "تقديم فاتورة", entity: "INV-2026-031", detail: "Submitted for PO-2026-0131.", detailAr: "قُدّمت للأمر PO-2026-0131." },
    { id: "a4", at: D(-1, 9, 5), actor: "Sherif El Masry", role: "carrier", action: "DELIVERY.STATUS", actionAr: "تحديث حالة التوصيل", entity: "D-8841", detail: "Marked in transit, ETA confirmed 10:00.", detailAr: "سُجّلت في الطريق، وموعد الوصول 10:00." },
    { id: "a5", at: D(-2, 11, 40), actor: "Omar Khalil", role: "hotel_admin", action: "GRN.CONFIRM", actionAr: "تأكيد استلام", entity: "PO-2026-0131", detail: "Partial GRN — Red Wine 6/6, Fruit 5/8 (1 case damaged).", detailAr: "استلام جزئي — نبيذ 6/6، فواكه 5/8 (كرتونة تالفة)." },
    { id: "a6", at: D(-3, 10, 15), actor: "Dr. Heba Zaki", role: "partner_officer", action: "FINANCE.REVIEW", actionAr: "مراجعة تمويل", entity: "FIN-2026-005", detail: "Application moved to partner review.", detailAr: "نُقل الطلب إلى مراجعة الشريك." },
    { id: "a7", at: D(-5, 17, 10), actor: "Laila Mansour", role: "gm", action: "ORDER.REJECT", actionAr: "رفض طلب", entity: "PO-2026-0135", detail: "Rejected — budget re-allocated for the season.", detailAr: "رُفض — أُعيد تخصيص الميزانية للموسم." },
    { id: "a8", at: D(-7, 9, 0), actor: "Ahmed Ghanem", role: "platform_admin", action: "RULE.UPDATE", actionAr: "تحديث قاعدة", entity: "r3", detail: "SLA for dual-control band set to 48 h.", detailAr: "حُدّد الحد الزمني لنطاق الموافقة المزدوجة بـ 48 ساعة." },
    { id: "a9", at: D(-10, 12, 30), actor: "Omar Khalil", role: "hotel_admin", action: "INVOICE.APPROVE", actionAr: "اعتماد فاتورة", entity: "INV-2026-026", detail: "Approved against GRN, eligible for financing.", detailAr: "عُتمدت مقابل سند الاستلام، مؤهلة للتمويل." },
    { id: "a10", at: D(-12, 10, 45), actor: "Omar Khalil", role: "hotel_admin", action: "GRN.CONFIRM", actionAr: "تأكيد استلام", entity: "PO-2026-0127", detail: "Full GRN, all lines good.", detailAr: "استلام كامل، كل البنود سليمة." },
    { id: "a11", at: D(-18, 8, 5), actor: "Khaled Fathy", role: "carrier", action: "DELIVERY.EXCEPTION", actionAr: "استثناء توصيل", entity: "D-8835", detail: "Desert Road closure — ETA +1h15m.", detailAr: "إغلاق الطريق الصحراوي — تأخير ساعة و15 دقيقة." },
    { id: "a12", at: D(-100, 9, 30), actor: "Dr. Heba Zaki", role: "partner_officer", action: "FINANCE.FUND", actionAr: "تمويل", entity: "FIN-2026-004", detail: "12-month facility funded at 1/12 per month.", detailAr: "موّل تسهيل 12 شهراً بمقدار 1/12 شهرياً." },
  ];

  const rfqs: Rfq[] = [
    { id: "rf1", productId: "p5", qty: 12, note: "Banquet season pricing, delivery to Alexandria.", supplierId: "s1", hotelId: "h3", at: D(-2, 11), status: "open" },
    { id: "rf2", productId: "p20", qty: 20, note: "Annual fire-safety restock.", supplierId: "s3", hotelId: "h4", at: D(-4, 15), status: "open" },
  ];

  return {
    products: [...PRODUCTS],
    orders,
    deliveries,
    invoices,
    financing,
    audit,
    tenants,
    rules,
    rfqs,
    seq: { po: 145, invoice: 34, fin: 6, delivery: 8848, audit: 13, rfq: 3 },
  };
}
