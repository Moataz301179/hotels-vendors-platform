/**
 * Data Lake & Revenue Maximization Engine.
 *
 * 1. Intent & procurement-cycle tracking — reorder intervals per SKU category
 *    per hotel group, and 14-day "purchase intent alerts" for supplier bidding.
 * 2. B2B credit-risk reliability index (0-100) per hotel TRN, licensed to
 *    financial partners.
 * 3. Anonymized manufacturer market-share aggregation (Volume GMV, AUP, share).
 *
 * All metrics anonymized, EGP 2dp, deterministic.
 */

/* ── 1. Procurement cycle / purchase-intent ──────────────────────────────── */
export interface OrderEvent {
  date: string;        // ISO
  hotelGroupId: string;
  category: string;    // F_AND_B | CONSUMABLES | GUEST_SUPPLIES | FFE | SERVICES
  sku: string;
  qty: number;
  priceEGP: number;
}

export interface ReorderProfile {
  hotelGroupId: string;
  category: string;
  sku: string;
  avgIntervalDays: number;
  lastOrderDate: string;
  /** expected next depletion: lastOrderDate + avgIntervalDays */
  nextExpectedOrder: string;
}

/** Average reorder interval per (hotel group, sku) from a time-ordered feed. */
export function computeReorderProfiles(orders: OrderEvent[]): ReorderProfile[] {
  const groups = new Map<string, { hotelGroupId: string; category: string; sku: string; dates: string[] }>();
  for (const o of orders) {
    const key = `${o.hotelGroupId}|${o.category}|${o.sku}`;
    let g = groups.get(key);
    if (!g) { g = { hotelGroupId: o.hotelGroupId, category: o.category, sku: o.sku, dates: [] }; groups.set(key, g); }
    g.dates.push(o.date);
  }
  const out: ReorderProfile[] = [];
  for (const [key, g] of groups) {
    const sorted = [...g.dates].sort();
    let sum = 0; let count = 0;
    for (let i = 1; i < sorted.length; i++) {
      sum += (Date.parse(sorted[i]) - Date.parse(sorted[i - 1])) / 86_400_000;
      count++;
    }
    const avg = count > 0 ? round2(sum / count) : 30;
    const last = sorted[sorted.length - 1];
    out.push({
      hotelGroupId: g.hotelGroupId, category: g.category, sku: g.sku,
      avgIntervalDays: avg, lastOrderDate: last,
      nextExpectedOrder: new Date(Date.parse(last) + avg * 86_400_000).toISOString().slice(0, 10),
    });
  }
  return out;
}

/** Alerts for SKUs whose expected reorder is within the lookahead window (default 14d). */
export function purchaseIntentAlerts(profiles: ReorderProfile[], lookaheadDays = 14, now = Date.now()): {
  sku: string; hotelGroupId: string; category: string; dueInDays: number;
}[] {
  return profiles
    .map((p) => ({ ...p, dueInDays: Math.max(0, Math.ceil((Date.parse(p.nextExpectedOrder) - now) / 86_400_000)) }))
    .filter((p) => p.dueInDays <= lookaheadDays)
    .map((p) => ({ sku: p.sku, hotelGroupId: p.hotelGroupId, category: p.category, dueInDays: p.dueInDays }));
}

/* ── 2. Credit-risk reliability index (0-100) ────────────────────────────── */
export interface RiskInput {
  onTimePaymentPct: number;        // 0-100
  dockDisputeRate: number;         // 0-1 (share of orders disputed)
  etaClearanceDays: number;        // avg days ETA e-invoice clears
  orderVolume: number;             // total orders in window
}

export interface ReliabilityIndex {
  trn: string;
  score: number;                   // 0-100
  grade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C";
  factors: { payment: number; docks: number; eta: number };
}

/**
 * Composite reliability index. Higher is better.
 * Base 100; penalize slow payment, disputes, slow ETA; floor at 0.
 */
export function computeReliabilityIndex(trn: string, input: RiskInput): ReliabilityIndex {
  const paymentScore = (input.onTimePaymentPct / 100) * 40;                     // max 40
  const dockScore = (1 - input.dockDisputeRate) * 30;                           // max 30
  const etaScore = Math.max(0, 1 - Math.max(0, input.etaClearanceDays - 1) / 9) * 30; // 1d→30, 10d→0
  const raw = paymentScore + dockScore + etaScore;
  const score = clamp(Math.round(raw), 0, 100);
  const grade = score >= 90 ? "AAA" : score >= 80 ? "AA" : score >= 70 ? "A" : score >= 60 ? "BBB" : score >= 45 ? "BB" : score >= 30 ? "B" : "C";
  return { trn, score, grade, factors: { payment: round2(paymentScore), docks: round2(dockScore), eta: round2(etaScore) } };
}

/* ── 3. Manufacturer market-share aggregation (anonymized) ───────────────── */
export interface ShareRow {
  category: string;
  brand: string;
  volume: number;      // units
  gmvEGP: number;
  avgUnitPrice: number;
  sharePct: number;    // brand share within category by GMV
}

export function marketShareByCategory(rows: { category: string; brand: string; qty: number; priceEGP: number }[]): ShareRow[] {
  const byCat = new Map<string, { brand: Map<string, { v: number; gmv: number }>; catGmv: number }>();
  for (const r of rows) {
    let cat = byCat.get(r.category);
    if (!cat) { cat = { brand: new Map(), catGmv: 0 }; byCat.set(r.category, cat); }
    let b = cat.brand.get(r.brand);
    if (!b) { b = { v: 0, gmv: 0 }; cat.brand.set(r.brand, b); }
    b.v += r.qty; b.gmv = round2(b.gmv + r.qty * r.priceEGP);
    cat.catGmv = round2(cat.catGmv + r.qty * r.priceEGP);
  }
  const out: ShareRow[] = [];
  for (const [category, cat] of byCat) {
    for (const [brand, b] of cat.brand) {
      out.push({
        category, brand, volume: b.v, gmvEGP: b.gmv,
        avgUnitPrice: b.v > 0 ? round2(b.gmv / b.v) : 0,
        sharePct: cat.catGmv > 0 ? round2((b.gmv / cat.catGmv) * 100) : 0,
      });
    }
  }
  return out;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
export function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
