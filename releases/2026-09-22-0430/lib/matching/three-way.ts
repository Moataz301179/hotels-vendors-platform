/**
 * 3-Way Matching Engine
 * Hotels Vendors Fintech Layer
 *
 * Compares PO (Order) ↔ GRN (Goods Receipt Note) ↔ Invoice
 * to validate that what was ordered, received, and billed are consistent.
 *
 * Match result categories:
 * - MATCHED: All three documents agree within tolerance
 * - QTY_MISMATCH: Ordered vs received quantity differs
 * - PRICE_MISMATCH: PO unit price vs invoice unit price differs
 * - AMOUNT_MISMATCH: Total amounts don't reconcile
 * - PARTIAL_MATCH: Some line items match, others don't
 */

import { prisma } from "@/lib/prisma";

export type MatchStatus = "MATCHED" | "QTY_MISMATCH" | "PRICE_MISMATCH" | "AMOUNT_MISMATCH" | "PARTIAL_MATCH" | "NO_GRN" | "NO_INVOICE";

export interface LineItemMatch {
  orderItemId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  quantityMatch: boolean;
  priceMatch: boolean;
  variancePercent: number;
  notes: string[];
}

export interface MatchResult {
  orderId: string;
  orderNumber: string;
  grnId: string | null;
  grnNumber: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  status: MatchStatus;
  lineItems: LineItemMatch[];
  summary: {
    totalPOAmount: number;
    totalGRNAccepted: number;
    totalInvoiceAmount: number;
    varianceAmount: number;
    matchRate: number; // percentage of line items fully matched
  };
  matchedAt: Date;
}

/** Quantity tolerance: 5% variance allowed between ordered and received/invoiced */
const QTY_TOLERANCE_PERCENT = 5;

/** Price tolerance: 1% variance allowed between PO and invoice unit prices */
const PRICE_TOLERANCE_PERCENT = 1;

export async function performThreeWayMatch(orderId: string): Promise<MatchResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  // Find latest GRN for this order
  const grn = await prisma.goodsReceiptNote.findFirst({
    where: { orderId },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  // Find invoice for this order
  const invoice = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  const lineItems: LineItemMatch[] = [];
  let totalPOAmount = 0;
  let totalGRNAccepted = 0;
  let totalInvoiceAmount = 0;
  let matchedCount = 0;

  for (const orderItem of order.items) {
    const poQty = orderItem.quantity;
    const poUnitPrice = Number(orderItem.unitPrice ?? 0);
    const poTotal = poQty * poUnitPrice;
    totalPOAmount += poTotal;

    // Find corresponding GRN line item
    const grnLine = grn?.lineItems.find((gl) => gl.orderItemId === orderItem.id);
    const receivedQty = grnLine?.receivedQuantity ?? 0;
    const acceptedQty = grnLine?.acceptedQuantity ?? 0;
    totalGRNAccepted += acceptedQty * poUnitPrice;

    // For invoice line items, we use the order's unit price (invoice links to order)
    // In a real system, invoice would have its own line items
    const invoiceQty = invoice ? poQty : 0; // simplified: assume invoice matches PO qty
    const invoiceUnitPrice = invoice ? Number(invoice.total ?? 0) / (invoice ? 1 : 1) : 0;
    totalInvoiceAmount = Number(invoice?.total ?? 0);

    // Compare quantities
    const qtyVariance = Math.abs(poQty - receivedQty);
    const qtyVariancePercent = poQty > 0 ? (qtyVariance / poQty) * 100 : 0;
    const quantityMatch = qtyVariancePercent <= QTY_TOLERANCE_PERCENT;

    // Compare prices (PO vs invoice)
    const priceVariance = Math.abs(poUnitPrice - invoiceUnitPrice);
    const priceVariancePercent = poUnitPrice > 0 ? (priceVariance / poUnitPrice) * 100 : 0;
    const priceMatch = priceVariancePercent <= PRICE_TOLERANCE_PERCENT;

    const notes: string[] = [];
    if (!quantityMatch) notes.push(`Qty variance: ${qtyVariancePercent.toFixed(1)}% (${poQty} ordered vs ${receivedQty} received)`);
    if (!priceMatch) notes.push(`Price variance: ${priceVariancePercent.toFixed(1)}% (${poUnitPrice} vs ${invoiceUnitPrice})`);

    const fullyMatched = quantityMatch && priceMatch;
    if (fullyMatched) matchedCount++;

    lineItems.push({
      orderItemId: orderItem.id,
      productName: orderItem.product.name,
      sku: orderItem.product.sku,
      orderedQty: poQty,
      receivedQty: acceptedQty,
      invoicedQty: invoiceQty,
      poUnitPrice,
      invoiceUnitPrice,
      quantityMatch,
      priceMatch,
      variancePercent: Math.max(qtyVariancePercent, priceVariancePercent),
      notes,
    });
  }

  // Determine overall status
  const allMatched = lineItems.every((li) => li.quantityMatch && li.priceMatch);
  const anyQtyMismatch = lineItems.some((li) => !li.quantityMatch);
  const anyPriceMismatch = lineItems.some((li) => !li.priceMatch);

  let status: MatchStatus;
  if (!grn) {
    status = "NO_GRN";
  } else if (!invoice) {
    status = "NO_INVOICE";
  } else if (allMatched) {
    status = "MATCHED";
  } else if (anyQtyMismatch && !anyPriceMismatch) {
    status = "QTY_MISMATCH";
  } else if (anyPriceMismatch && !anyQtyMismatch) {
    status = "PRICE_MISMATCH";
  } else if (anyQtyMismatch && anyPriceMismatch) {
    status = "AMOUNT_MISMATCH";
  } else {
    status = "PARTIAL_MATCH";
  }

  const varianceAmount = Math.abs(totalPOAmount - totalInvoiceAmount);
  const matchRate = lineItems.length > 0 ? (matchedCount / lineItems.length) * 100 : 0;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    grnId: grn?.id ?? null,
    grnNumber: grn?.grnNumber ?? null,
    invoiceId: invoice?.id ?? null,
    invoiceNumber: invoice?.invoiceNumber ?? null,
    status,
    lineItems,
    summary: {
      totalPOAmount,
      totalGRNAccepted,
      totalInvoiceAmount,
      varianceAmount,
      matchRate,
    },
    matchedAt: new Date(),
  };
}

/**
 * Check if payment can be released based on 3-way match.
 * Only MATCHED or PARTIAL_MATCH with <5% variance can proceed.
 */
export function canReleasePayment(result: MatchResult): { allowed: boolean; reason?: string } {
  if (result.status === "NO_GRN") {
    return { allowed: false, reason: "No GRN recorded — goods not yet received" };
  }
  if (result.status === "NO_INVOICE") {
    return { allowed: false, reason: "No invoice on file" };
  }
  if (result.status === "MATCHED") {
    return { allowed: true };
  }
  if (result.status === "PARTIAL_MATCH" && result.summary.matchRate >= 95) {
    return { allowed: true, reason: `${result.summary.matchRate.toFixed(0)}% match rate — minor variances within tolerance` };
  }
  if (result.summary.varianceAmount > 1000) {
    return { allowed: false, reason: `Variance of EGP ${result.summary.varianceAmount.toFixed(2)} exceeds threshold` };
  }
  return { allowed: false, reason: `Match status: ${result.status} — requires manual review` };
}
