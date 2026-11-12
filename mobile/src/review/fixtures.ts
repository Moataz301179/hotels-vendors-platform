import type { AnonymousQuote, PhoneHome, PhoneNotification, PhoneOrder, PhoneOrderDetail, SupplierRequest } from "../api/hovin";

const withheld = [
  "Supplier identity before an invoice exists",
  "Invoice amounts and payment configuration",
];

export const hotelHome: PhoneHome = {
  plan: {
    workspace: "hotel",
    title: "Hotel",
    summary: "This phone follows the signed-in hotel account: requests, recorded quotes, orders, and the delivery in front of you.",
    deskPath: "/orders",
    capabilities: ["catalog", "compare-quotes", "orders", "receive", "tracking", "delivery-code", "notifications"],
    withheld,
  },
  account: { id: "review-hotel", name: "North Wing", email: "receiving@example.hotel", platformRole: "HOTEL", role: "RECEIVING_CLERK", tenantId: "review-hotel" },
  permissions: ["order:read", "order:update"],
  proposal: {
    action: "receive",
    targetId: "order-14",
    evidence: [{ key: "order", value: "PO-1042" }, { key: "remaining", value: "4" }],
    authority: "server",
  },
  tasks: [
    { id: "receive-14", module: "receive", title: "PO-1042", detail: "2 lines · 4 remaining", status: "IN_TRANSIT", targetId: "order-14", amount: 4, lines: 2 },
    { id: "quotes-open", module: "quotes", title: "Recorded responses", detail: "2 requests", status: "QUOTED", targetId: "quotes", amount: 2 },
  ],
  unread: 1,
};

export const supplierHome: PhoneHome = {
  plan: {
    workspace: "supplier",
    title: "Supplier",
    summary: "Answer the requests sent to this supplier and follow the orders already placed with you.",
    deskPath: "/supplier/rfqs",
    capabilities: ["supplier-response", "orders", "notifications"],
    withheld: ["Other suppliers' terms"],
  },
  account: { id: "review-supplier", name: "Delta Produce", email: "sales@example.supplier", platformRole: "SUPPLIER", role: "OWNER", tenantId: "review-supplier" },
  permissions: ["order:read", "quote:submit"],
  proposal: {
    action: "respond",
    targetId: "rfq-9",
    evidence: [{ key: "item", value: "Jasmine rice 5kg" }, { key: "quantity", value: "40" }],
    authority: "server",
  },
  tasks: [
    { id: "respond-9", module: "respond", title: "Jasmine rice 5kg", detail: "Requested quantity 40", status: "PENDING", targetId: "rfq-9", amount: 40 },
  ],
  unread: 0,
};

export const carrierHome: PhoneHome = {
  plan: {
    workspace: "carrier-code",
    title: "Carrier",
    summary: "The delivery code for movements this carrier already accepted on the portal. Accept and decline stay on that portal.",
    deskPath: "/carrier",
    capabilities: ["tracking", "delivery-code"],
    withheld: ["Assignment acceptance"],
  },
  account: { id: "review-carrier", name: "Red Sea Freight", email: "dock@example.carrier", platformRole: "SHIPPING", role: "OWNER", tenantId: "review-carrier" },
  permissions: [],
  proposal: {
    action: "track",
    targetId: "order-22",
    evidence: [{ key: "order", value: "PO-2210" }, { key: "status", value: "ACCEPTED" }],
    authority: "server",
  },
  tasks: [
    { id: "code-22", module: "code", title: "PO-2210", detail: "Accepted on the portal", status: "ACCEPTED", targetId: "order-22" },
  ],
  unread: 0,
};

export const deskHome: PhoneHome = {
  plan: {
    workspace: "desk",
    title: "Desk",
    summary: "Department decisions, funding, and administration stay on the web desk.",
    deskPath: "/orders",
    capabilities: [],
    withheld: ["Phone execution"],
  },
  account: { id: "review-desk", name: "Housekeeping", email: "head@example.hotel", platformRole: "HOTEL", role: "DEPARTMENT_HEAD", tenantId: "review-desk" },
  permissions: ["order:read"],
  proposal: { action: "desk", targetId: null, evidence: [{ key: "desk", value: "/orders" }], authority: "server" },
  tasks: [],
  unread: 0,
};

export const emptyHome: PhoneHome = {
  ...hotelHome,
  proposal: { action: "wait", targetId: null, evidence: [], authority: "server" },
  tasks: [],
  unread: 0,
};

export const reviewOrders: PhoneOrder[] = [
  { id: "order-14", orderNumber: "PO-1042", status: "IN_TRANSIT", invoiceIssued: false, supplierName: null, items: [] },
  { id: "order-3", orderNumber: "PO-1008", status: "DELIVERED", invoiceIssued: true, supplierName: "Nile Linens", items: [] },
];

export const reviewTracking: PhoneOrderDetail = {
  orderId: "order-22",
  orderNumber: "PO-2210",
  status: "IN_TRANSIT",
  referredFrom: "carrier-portal",
  estimatedDelivery: "2026-11-12T16:00:00.000Z",
  assignmentStatus: "ACCEPTED",
  originHub: "Cairo",
  destinationHub: "Hurghada",
  checkpoints: [
    { key: "assigned", at: "2026-11-12T08:00:00.000Z", state: "done" },
    { key: "accepted", at: "2026-11-12T09:00:00.000Z", state: "done" },
    { key: "picked-up", at: "2026-11-12T10:00:00.000Z", state: "done" },
    { key: "in-transit", at: "2026-11-12T11:00:00.000Z", state: "done" },
    { key: "delivered", at: null, state: "current" },
  ],
  deliveryCode: { available: true, code: "482913", confirmedAt: null, orderNumber: "PO-2210" },
};

export const reviewQuotes: Array<{ reference: string; unitPrice: number; currency: string }> = [
  { reference: "Comparable offer 01", unitPrice: 86, currency: "EGP" },
  { reference: "Comparable offer 02", unitPrice: 94, currency: "EGP" },
];

export const reviewProducts = [
  { id: "rice", name: "Jasmine rice 5kg", category: "Dry store", unitOfMeasure: "bag" },
  { id: "linen", name: "Bath linen, white", category: "Housekeeping", unitOfMeasure: "piece" },
];

export const reviewNotifications: PhoneNotification[] = [
  { id: "note-1", type: "ORDER_TRANSITION", subject: "PO-1042 is in transit", body: "The movement has a new checkpoint.", readAt: null, createdAt: "2026-11-12T11:00:00.000Z" },
];

export const reviewSupplierRequest: SupplierRequest = {
  id: "rfq-9",
  itemName: "Jasmine rice 5kg",
  requestedQty: 40,
  status: "PENDING",
};

export const reviewAnonymousQuotes: AnonymousQuote[] = reviewQuotes.map((quote, index) => ({
  id: `quote-${index}`,
  reference: quote.reference,
  quantity: 40,
  unitPrice: quote.unitPrice,
  currency: quote.currency,
  deliveryFee: 0,
  taxAmount: 0,
  leadTimeDays: 3,
  rfq: { id: "rfq-1", product: { name: "Jasmine rice 5kg" } },
}));
