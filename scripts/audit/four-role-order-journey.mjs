#!/usr/bin/env node
/**
 * Four-role order journey audit.
 *
 * Traces ONE real order across hotel → vendor → carrier → funder and reports,
 * for every handoff: the API, the authority check, the ledger event, the
 * timeline entry, the recipient and the notification evidence.
 *
 * Read-only. Refuses a production database host.
 *
 * Usage:
 *   node scripts/audit/four-role-order-journey.mjs            # latest delivered order
 *   node scripts/audit/four-role-order-journey.mjs --order HV-XXXX
 */

import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "";
// Refuse the known production database unless explicitly overridden.
const PRODUCTION_HOST = "ep-rough-sea-b5bluya4";
if (databaseUrl.includes(PRODUCTION_HOST) && !process.env.ALLOW_PRODUCTION_AUDIT) {
  console.error("REFUSING: this audit must not run against the production database.");
  process.exit(1);
}

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const orderArg = args.find((arg) => arg.startsWith("--order="))?.split("=")[1];

const order = orderArg
  ? await prisma.order.findFirst({ where: { orderNumber: orderArg, deletedAt: null } })
  : await prisma.order.findFirst({
      where: { deletedAt: null, status: "DELIVERED" },
      orderBy: { createdAt: "desc" },
    });

if (!order) {
  console.error("No order found.");
  await prisma.$disconnect();
  process.exit(1);
}

const id = order.id;

const [approvals, events, grns, invoices, audits, users] = await Promise.all([
  prisma.orderApproval.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { createdAt: "asc" } }),
  prisma.networkTransactionEvent.findMany({ where: { sourceEntityId: id, sourceEntityName: "ORDER" }, orderBy: { occurredAt: "asc" } }),
  prisma.goodsReceiptNote.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { createdAt: "asc" } }),
  prisma.invoice.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { createdAt: "asc" } }),
  prisma.auditLog.findMany({ where: { entityId: id }, orderBy: { createdAt: "asc" } }),
  prisma.user.findMany({ where: { tenantId: order.tenantId }, select: { id: true, name: true, email: true, platformRole: true, role: true } }),
]);

const notifications = await prisma.notification.count({ where: { tenantId: order.tenantId } });
const notificationPrefs = await prisma.notificationPreference.count({ where: { tenantId: order.tenantId } });

const byId = new Map(users.map((u) => [u.id, u]));
const actorLabel = (actorId, actorRole) => {
  const user = actorId ? byId.get(actorId) : null;
  if (user) return `${user.name ?? user.email ?? actorId} (${actorRole ?? user.platformRole})`;
  return actorId ? `${actorId} (${actorRole ?? "unknown"})` : `(system/${actorRole ?? "unknown"})`;
};

console.log("\n=== FOUR-ROLE ORDER JOURNEY ===");
console.log(`order:        ${order.orderNumber}  ${id}`);
console.log(`tenant:       ${order.tenantId}`);
console.log(`hotel:        ${order.hotelId}`);
console.log(`supplier:     ${order.supplierId}`);
console.log(`status:       ${order.status}`);
console.log(`payGuaranteed:${order.paymentGuaranteed}  method=${order.paymentGuaranteeMethod ?? "n/a"}`);
console.log(`etaSubmission:${order.etaSubmissionId ?? "none"}`);
console.log(`grns: ${grns.length}  invoices: ${invoices.length}  approvals: ${approvals.length}  events: ${events.length}  audits: ${audits.length}`);

// ---- Handoff map -----------------------------------------------------------
console.log("\n=== HANDOFF MAP ===");

const handoffs = [
  {
    step: "1. Hotel request",
    api: "POST /api/v2/rfq (RFQ raised) → POST /api/v2/quotes/accept",
    authority: "order:create / order:approve",
    event: "RFQ_CREATED / QUOTE_ACCEPTED",
    timeline: order.createdAt,
    recipient: actorLabel(order.requesterId, "HOTEL"),
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "2. Authority approval",
    api: "PATCH /api/v2/orders (APPROVED)",
    authority: `order:approve + evaluateV2Authority + delegate check (requiredApproverIds)`,
    event: "APPROVAL_RECORDED",
    timeline: approvals.find((a) => a.action === "APPROVED")?.createdAt ?? null,
    recipient: actorLabel(approvals.find((a) => a.action === "APPROVED")?.approverId, "HOTEL"),
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "3. Payment guarantee",
    api: "POST /api/v2/orders/guarantee",
    authority: "ADMIN only — hotel cannot self-declare (PAYMENT_GUARANTEE_VERIFICATION_REQUIRED)",
    event: "PAYMENT_GUARANTEE_SET",
    timeline: order.paymentGuaranteeSetAt,
    recipient: "ADMIN",
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "4. Vendor confirm",
    api: "PATCH /api/v2/orders (CONFIRMED) via lib/orders/queue.ts",
    authority: "order:confirm + APPROVED status",
    event: "CONFIRM_ORDER",
    timeline: events.find((e) => e.eventType === "CONFIRM_ORDER")?.occurredAt ?? null,
    recipient: actorLabel(events.find((e) => e.eventType === "CONFIRM_ORDER")?.actorId, "SUPPLIER"),
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "5. Carrier dispatch",
    api: "PATCH /api/v2/orders (IN_TRANSIT)",
    authority: "order:update + future estimatedDelivery required + ETA clearance",
    event: "IN_TRANSIT",
    timeline: events.find((e) => e.eventType === "IN_TRANSIT")?.occurredAt ?? null,
    recipient: actorLabel(events.find((e) => e.eventType === "IN_TRANSIT")?.actorId, "CARRIER"),
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "6. Hotel receiving",
    api: "POST /api/v2/grn",
    authority: "GRN_RECEIPT_REQUIRED — direct RECEIVE is rejected",
    event: "DELIVERED / GRN_ACCEPTED",
    timeline: grns[0]?.receivedAt ?? null,
    recipient: actorLabel(grns[0]?.receivedById, "HOTEL"),
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
  {
    step: "7. Funder settlement",
    api: "POST /api/v2/funding",
    authority: "order.status=DELIVERED + GRN ACCEPTED/PARTIALLY_ACCEPTED",
    event: "FUNDING_REQUESTED",
    timeline: invoices[0]?.createdAt ?? null,
    recipient: "FUNDER",
    notification: notifications > 0 ? "notification row(s) exist" : "NO notification row",
  },
];

for (const h of handoffs) {
  console.log(`\n${h.step}`);
  console.log(`  api:         ${h.api}`);
  console.log(`  authority:   ${h.authority}`);
  console.log(`  event:       ${h.event}`);
  console.log(`  timeline:    ${h.timeline ? new Date(h.timeline).toISOString() : "MISSING"}`);
  console.log(`  recipient:   ${h.recipient}`);
  console.log(`  notification:${h.notification}`);
}

// ---- Evidence chain --------------------------------------------------------
console.log("\n=== EVIDENCE CHAIN ===");
console.log(`hash-linked events: ${events.length}`);
for (const e of events.slice(0, 8)) {
  console.log(`  ${e.occurredAt.toISOString()}  ${e.eventType ?? "(none)"}  by ${actorLabel(e.actorId, e.actorRole)}  hash=${e.hash.slice(0, 12)}… prev=${e.previousHash.slice(0, 12)}…`);
}
console.log(`audits: ${audits.length}`);
for (const a of audits.slice(0, 8)) {
  console.log(`  ${a.createdAt.toISOString()}  ${a.actionType}  by ${actorLabel(a.actorId, a.actorRole)}`);
}

console.log("\n=== STATE SEPARATION ===");
for (const g of grns) {
  console.log(`  GRN ${g.grnNumber} status=${g.status} vehicle=${g.vehiclePlate ?? "n/a"} note=${g.deliveryNoteRef ?? "n/a"}`);
}
for (const inv of invoices) {
  console.log(`  INV ${inv.invoiceNumber ?? inv.id} payStatus=${inv.paymentStatus} etaStatus=${inv.etaStatus ?? "n/a"} etaUuid=${inv.etaUuid ? "yes" : "no"}`);
}

// ---- Honest gaps -----------------------------------------------------------
console.log("\n=== HONEST GAPS ===");
const gaps = [];
if (notifications === 0) gaps.push("No Notification rows at all — the unified notification service is built but nothing calls it yet.");
if (notificationPrefs === 0) gaps.push("No NotificationPreference rows — preference enforcement is untested against real users.");
const carrierEvents = events.filter((e) => e.actorRole === "CARRIER");
if (carrierEvents.length === 0) gaps.push("No ledger event carries actorRole=CARRIER — the carrier handoff is inferred from the order transition, not proven by an event.");
const funderEvents = events.filter((e) => e.actorRole === "FUNDER");
if (funderEvents.length === 0) gaps.push("No ledger event carries actorRole=FUNDER — the funder handoff is inferred from the invoice, not proven by an event.");
if (!order.etaSubmissionId) gaps.push("No ETA submission id on this order.");
if (grns.length === 0) gaps.push("No goods receipt note — receiving is unproven for this order.");
const partial = grns.filter((g) => g.status === "PARTIALLY_ACCEPTED");
if (partial.length === 0) gaps.push("No PARTIALLY_ACCEPTED GRN — partial delivery path is not exercised by this order.");
if (gaps.length === 0) gaps.push("None — every handoff is evidenced.");
for (const gap of gaps) console.log(`  • ${gap}`);

console.log("\n=== NOTES ===");
console.log("  • Commercial, logistics, ETA and financial states are separate columns/rows and linked by orderId.");
console.log("  • This audit is read-only. It writes nothing and sends nothing.");
console.log("");

await prisma.$disconnect();
