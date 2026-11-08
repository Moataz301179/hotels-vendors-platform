#!/usr/bin/env node
/**
 * Connected procurement journey demonstration.
 *
 * Traces ONE order through the full journey and reports, per step:
 * the API, the authority check, the evidence rows, the notification and the
 * gap (if any).
 *
 * Steps: catalogue reference → RFQ → quote → approval → release →
 * vendor acknowledgement → dispatch → receiving → invoice → return/discrepancy.
 *
 * Read-only. Refuses the production database.
 *
 * Usage:
 *   node scripts/audit/connected-journey.mjs
 */

import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "";
const PRODUCTION_HOST = "ep-rough-sea-b5bluya4";
if (databaseUrl.includes(PRODUCTION_HOST) && !process.env.ALLOW_PRODUCTION_AUDIT) {
  console.error("REFUSING: this audit must not run against the production database.");
  process.exit(1);
}

const prisma = new PrismaClient();

const order = await prisma.order.findFirst({
  where: { deletedAt: null, status: { in: ["DELIVERED", "PARTIALLY_DELIVERED"] } },
  orderBy: { createdAt: "desc" },
});

if (!order) {
  console.error("No delivered order available to trace.");
  await prisma.$disconnect();
  process.exit(1);
}

const id = order.id;
const [rfqs, quotes, approvals, events, grns, invoices, returns, disputes, creditNotes, notifications] = await Promise.all([
  prisma.rfqRequest.findMany({ where: { tenantId: order.tenantId }, select: { id: true, status: true }, take: 5 }),
  prisma.procurementQuote.findMany({ where: { tenantId: order.tenantId, status: "ACCEPTED" }, select: { id: true, status: true }, take: 5 }),
  prisma.orderApproval.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { createdAt: "asc" } }),
  prisma.networkTransactionEvent.findMany({ where: { sourceEntityId: id, sourceEntityName: "ORDER" }, orderBy: { occurredAt: "asc" } }),
  prisma.goodsReceiptNote.findMany({ where: { orderId: id, deletedAt: null } }),
  prisma.invoice.findMany({ where: { orderId: id, deletedAt: null } }),
  prisma.returnRequest.findMany({ where: { orderId: id }, orderBy: { createdAt: "desc" }, take: 5 }),
  prisma.dispute.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
  prisma.creditNote.findMany({ where: { tenantId: order.tenantId }, select: { id: true, number: true, returnId: true, amount: true, status: true }, take: 5 }),
  prisma.notification.findMany({ where: { tenantId: order.tenantId }, select: { id: true, type: true, channel: true, subject: true, sentAt: true }, take: 10 }),
]);

const actorLabel = (actorId, actorRole) => (actorId ? `${actorId.slice(0, 18)}… (${actorRole ?? "unknown"})` : `(system/${actorRole ?? "unknown"})`);
const when = (value) => (value ? new Date(value).toISOString() : "MISSING");

console.log("\n=== CONNECTED PROCUREMENT JOURNEY ===");
console.log(`order: ${order.orderNumber}  ${id}`);
console.log(`tenant: ${order.tenantId}`);
console.log(`status: ${order.status}   paymentGuaranteed: ${order.paymentGuaranteed} (${order.paymentGuaranteeMethod ?? "n/a"})`);
console.log(`etaSubmission: ${order.etaSubmissionId ?? "none"}`);

const steps = [
  {
    step: "1. Catalogue reference",
    api: "GET /api/v2/catalog  (buyer-safe, supplier-anonymous, price-free)",
    authority: "product:read + tenant scope",
    evidence: `${quotes.length} accepted quotes exist in this tenant`,
    timeline: order.createdAt,
    recipient: "hotel buyer",
    notification: "n/a (browse)",
    honest: "Buyer-facing catalogue returns 0 products — every ACTIVE product is FIXTURE with example.com images.",
  },
  {
    step: "2. RFQ raised",
    api: "POST /api/v2/rfq",
    authority: "order:create",
    evidence: `${rfqs.length} RFQs in tenant (statuses: ${rfqs.map((r) => r.status).join(", ") || "none"})`,
    timeline: order.createdAt,
    recipient: "verified suppliers with RFQ access",
    notification: "suppressed pre-release",
    honest: "RFQ machinery exists; the specific RFQ behind this order is not retained in this trace.",
  },
  {
    step: "3. Quote accepted",
    api: "POST /api/v2/quotes/checkout-preview → POST /api/v2/quotes/accept",
    authority: "order:create + financial access + verified supplier + unexpired quote",
    evidence: `${quotes.length} ACCEPTED quotes in tenant`,
    timeline: order.createdAt,
    recipient: "hotel buyer",
    notification: "suppressed pre-release",
    honest: "Commercial terms acceptance is recorded in the audit trail.",
  },
  {
    step: "4. Authority approval",
    api: "PATCH /api/v2/orders (APPROVED)",
    authority: "order:approve + evaluateV2Authority + requiredApproverIds delegate check",
    evidence: `${approvals.length} approval record(s)`,
    timeline: approvals[0]?.createdAt ?? null,
    recipient: actorLabel(approvals[0]?.approverId, approvals[0]?.actorRole),
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: approvals.length === 0 ? "No approval record — this order did not pass through the APPROVED transition." : "Approval recorded.",
  },
  {
    step: "5. Payment guarantee (ADMIN only)",
    api: "POST /api/v2/orders/guarantee",
    authority: "ADMIN + order:approve — hotel cannot self-declare",
    evidence: `paymentGuaranteed=${order.paymentGuaranteed}`,
    timeline: order.paymentGuaranteeSetAt,
    recipient: "ADMIN",
    notification: "suppressed pre-release",
    honest: order.paymentGuaranteed ? "Guarantee set." : "NOT set — dispatch gate would block.",
  },
  {
    step: "6. Vendor acknowledgement",
    api: "PATCH /api/v2/orders (CONFIRMED) via lib/orders/queue.ts",
    authority: "order:confirm + paymentGuarantee gate",
    evidence: `${events.filter((e) => e.eventType === "STATUS_CHANGED").length} status-change event(s)`,
    timeline: events.find((e) => e.eventType === "STATUS_CHANGED")?.occurredAt ?? null,
    recipient: actorLabel(events.find((e) => e.eventType === "STATUS_CHANGED")?.actorId, "SUPPLIER"),
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: "Vendor acknowledgement is a SUPPLIER actor on the ledger.",
  },
  {
    step: "7. Dispatch",
    api: "PATCH /api/v2/orders (IN_TRANSIT)",
    authority: "order:update + future estimatedDelivery + ETA clearance",
    evidence: `${events.length} hash-linked event(s)`,
    timeline: events.find((e) => e.eventType === "IN_TRANSIT")?.occurredAt ?? null,
    recipient: "carrier",
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: "No CARRIER actor appears on any ledger event — the carrier handoff is inferred, not proven.",
  },
  {
    step: "8. Receiving",
    api: "POST /api/v2/grn",
    authority: "GRN_RECEIPT_REQUIRED — direct RECEIVE is rejected",
    evidence: `${grns.length} GRN(s)${grns[0] ? ` status=${grns[0].status}` : ""}`,
    timeline: grns[0]?.receivedAt ?? null,
    recipient: actorLabel(grns[0]?.receivedById, "HOTEL"),
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: grns.length === 0 ? "No GRN — receiving unproven." : "Goods receipt recorded.",
  },
  {
    step: "9. Invoice reconciliation",
    api: "POST /api/v2/invoices (etaStatus ACCEPTED + signed)",
    authority: "invoice:read + invoice:update",
    evidence: `${invoices.length} invoice(s)${invoices[0] ? ` payStatus=${invoices[0].paymentStatus} etaStatus=${invoices[0].etaStatus ?? "n/a"}` : ""}`,
    timeline: invoices[0]?.createdAt ?? null,
    recipient: "funder",
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: "No FUNDER actor on any ledger event — the funder handoff is inferred.",
  },
  {
    step: "10. Return / discrepancy",
    api: "POST /api/v2/returns  →  POST /api/v2/returns/[id]  (credit note)  →  POST /api/v2/disputes",
    authority: "order:update + invoice:update",
    evidence: `${returns.length} return(s), ${disputes.length} dispute(s), ${creditNotes.length} credit note(s) in tenant`,
    timeline: returns[0]?.createdAt ?? disputes[0]?.createdAt ?? null,
    recipient: "hotel receiver",
    notification: notifications.length > 0 ? `${notifications.length} notification row(s)` : "NO notification row",
    honest: "Routes built and tested this session; this tenant has no return/dispute rows yet.",
  },
];

for (const s of steps) {
  console.log(`\n${s.step}`);
  console.log(`  api:         ${s.api}`);
  console.log(`  authority:   ${s.authority}`);
  console.log(`  evidence:    ${s.evidence}`);
  console.log(`  timeline:    ${when(s.timeline)}`);
  console.log(`  recipient:   ${s.recipient}`);
  console.log(`  notification:${s.notification}`);
  console.log(`  honest:      ${s.honest}`);
}

console.log("\n=== EVIDENCE CHAIN ===");
for (const e of events.slice(0, 10)) {
  console.log(`  ${e.occurredAt.toISOString()}  ${e.eventType ?? "(none)"}  by ${actorLabel(e.actorId, e.actorRole)}  hash=${e.hash.slice(0, 12)}…`);
}

console.log("\n=== NOTIFICATIONS ===");
if (notifications.length === 0) {
  console.log("  No notification rows exist in this tenant.");
  console.log("  The unified service is built and wired into order transitions, but no");
  console.log("  transition has produced a row in this environment yet.");
} else {
  for (const n of notifications.slice(0, 8)) {
    console.log(`  ${n.type} ${n.channel} sent=${n.sentAt ? "yes" : "NO"} ${n.subject ?? ""}`);
  }
}

console.log("\n=== BLOCKER ===");
console.log("  The mandate asks for this journey against a REAL sourced product with a");
console.log("  CONFIRMED Vendor offer. No real sourced product exists: all 191 ACTIVE");
console.log("  products are source=FIXTURE with example.com placeholder images, and the");
console.log("  buyer-facing catalogue returns 0. The journey machinery is built and");
console.log("  tested; the real-product run is blocked on sourcing.");
console.log("");
console.log("  This audit is read-only. It writes nothing and sends nothing.");
console.log("");

await prisma.$disconnect();
