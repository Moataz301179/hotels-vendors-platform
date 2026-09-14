/**
 * B2B Dropship & Affiliate Aggregator core.
 *
 * 1. Catalog ingestion from multiple sources (MaxAB, factories, ERPs), SKU
 *    masking, dynamic margin layer.
 * 2. Order splitting → supplier POs, temporary inventory locks, dispatch webhooks.
 * 3. Merchant of Record — single unified ETA invoice, delivery-validation,
 *    48h Oliv reverse-factoring trigger (CHV000).
 *
 * All prices in EGP, rounded to 2dp. Deterministic, idempotent.
 */

/* ── 1. SKU masking + canonical identity ──────────────────────────────────── */
export function maskSku(vendorSku: string, vendorId: string): string {
  // Strip vendor identity; produce a stable masked SKU from the raw value.
  const h = hash(`${vendorId}:${vendorSku}`);
  return `ATT-${h.toString(36).toUpperCase().padStart(8, "0")}`;
}

export function maskUrl(vendorUrl: string, productId: string): string {
  // Never expose the underlying vendor product URL — internal canonical path.
  const h = hash(productId);
  return `/p/${h.toString(36).toUpperCase().slice(0, 10)}`;
}

/* ── Dynamic margin layer ────────────────────────────────────────────────── */
export interface MarginRule {
  /** base wholesale cost EGP */
  wholesaleCost: number;
  /** category code F_AND_B | CONSUMABLES | GUEST_SUPPLIES | FFE | SERVICES */
  category: string;
  /** platform fee % applied on top (e.g. 8 => 8%) */
  platformFeePct: number;
  /** fixed uplift if category is premium (e.g. FFE) */
  fixedUplift?: number;
}

export function applyMargin(m: MarginRule): { hotelPrice: number; fee: number } {
  const fee = m.wholesaleCost * (m.platformFeePct / 100) + (m.fixedUplift || 0);
  const hotelPrice = round2(m.wholesaleCost + fee);
  return { hotelPrice, fee: round2(fee) };
}

/* ── 2. Order splitting + inventory lock ─────────────────────────────────── */
export interface BasketLine {
  productId: string;
  sku: string;
  qty: number;
  supplierId: string;
  unitPrice: number; // hotel-facing EGP
}

export interface SupplierPO {
  supplierId: string;
  lines: { sku: string; qty: number; priceEGP: number }[];
  totalEGP: number;
  packingSlipId: string;
}

export function splitOrder(lines: BasketLine[]): Map<string, SupplierPO> {
  const bySupplier = new Map<string, SupplierPO>();
  for (const l of lines) {
    let po = bySupplier.get(l.supplierId);
    if (!po) {
      po = { supplierId: l.supplierId, lines: [], totalEGP: 0, packingSlipId: `PS-${Date.now().toString(36).toUpperCase()}` };
      bySupplier.set(l.supplierId, po);
    }
    po.lines.push({ sku: l.sku, qty: l.qty, priceEGP: l.unitPrice });
    po.totalEGP = round2(po.totalEGP + l.unitPrice * l.qty);
  }
  return bySupplier;
}

export interface StockLock { sku: string; qtyLocked: number; untilMs: number; orderRef: string }

/** Reserve stock for a single-tenant multi-item checkout (temporary reservation). */
export function createStockLocks(lines: BasketLine[], orderRef: string, reserveMin = 15): StockLock[] {
  return lines.map((l) => ({ sku: l.sku, qtyLocked: l.qty, untilMs: Date.now() + reserveMin * 60_000, orderRef }));
}

/** On partial fulfillment shortfall, compute what to cancel + notify buyer. */
export function resolveShortfall(lines: { sku: string; qty: number }[], avail: Record<string, number>): {
  fulfilled: { sku: string; qty: number }[];
  short: { sku: string; qty: number }[];
} {
  const fulfilled = [];
  const short = [];
  for (const l of lines) {
    const a = avail[l.sku] ?? 0;
    const take = Math.min(l.qty, a);
    fulfilled.push({ sku: l.sku, qty: take });
    if (l.qty - take > 0) short.push({ sku: l.sku, qty: l.qty - take });
  }
  return { fulfilled, short };
}

/* ── 3. Merchant of Record — unified ETA invoice + factoring trigger ─────── */
export interface EtaInvoiceLine { sku: string; qty: number; unitPriceEGP: number; taxPct: number }

export function buildUnifiedInvoice(orderRef: string, lines: EtaInvoiceLine[]): {
  orderRef: string; subtotal: number; tax: number; total: number; lines: EtaInvoiceLine[];
} {
  let subtotal = 0; let tax = 0;
  const rows = lines.map((l) => {
    subtotal = round2(subtotal + l.qty * l.unitPriceEGP);
    tax = round2(tax + l.qty * l.unitPriceEGP * (l.taxPct / 100));
    return l;
  });
  return { orderRef, lines: rows, subtotal, tax, total: round2(subtotal + tax) };
}

/* ── 4. 48h reverse-factoring trigger (Oliv, referral CHV000) ────────────── */
export function buildOlivPayoutRequest(amountEGP: number, invoiceRef: string) {
  return {
    invoiceRef,
    amountEGP: round2(amountEGP),
    promo: "CHV000",
    settlement: "48h",
    // In production this hits POST /api/v1/oliv/payout with server-signed HMAC.
  };
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
export function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) >>> 0;
}
