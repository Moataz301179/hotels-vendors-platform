/**
 * GRN Verification, Accountability & Reconciliation — carrier module core.
 *
 * - e-Waybill QR code verification at pickup and at dock
 * - Digital Goods Received Note (GRN) with accountable sign-off
 * - Discrepancy detection + reconciliation between ordered vs received vs damaged
 * - Accountability terms: who is liable for in-consignment damage/loss/shortage
 */

import { createHash } from "crypto";

export type DiscrepancyKind = "SHORTAGE" | "SURPLUS" | "DAMAGED" | "WRONG_ITEM" | "MISSING_DOC";

export interface GrnLine {
  sku: string;
  expected: number;
  received: number;
  damageNote: string | null;
}

export interface GrnResult {
  orderId: string;
  lines: GrnLine[];
  discrepancies: DiscrepancyKind[];
  shortageValue: number;
  damageValue: number;
  accepted: boolean;
  signedBy: string;
  signedAt: string;
  verificationMode: "QR_SCAN" | "MANUAL";
}

export interface AccountabilityTerms {
  carrierLiableUpTo: number;            // EGP cap carrier accepts for in-transit loss/damage
  perKgLiability: number;               // EGP per kg
  insuranceRequired: boolean;
  claimWindowDays: number;
  burdenOfProof: "CARRIER" | "BUYER" | "SHARED";
  subrogationToFunder: boolean;
}

export const DEFAULT_TERMS: AccountabilityTerms = {
  carrierLiableUpTo: 50000,
  perKgLiability: 150,
  insuranceRequired: true,
  claimWindowDays: 7,
  burdenOfProof: "SHARED",
  subrogationToFunder: true,
};

/* ── e-Waybill QR generation (scannable payload) ── */
export function makeWaybillQr(orderId: string, waybillId: string, supplierTaxId: string, parcelCount: number): string {
  const payload = JSON.stringify({ v: 1, waybillId, orderId, supplierTaxId, parcels: parcelCount, ts: Date.now() });
  const sig = createHash("sha256").update(payload + process.env.HOTELSVENDORS_HMAC_SECRET || "").digest("hex").slice(0, 16);
  return `HVWB:${Buffer.from(JSON.stringify({ ...JSON.parse(payload), sig })).toString("base64url")}`;
}

export function verifyWaybillQr(qr: string): { valid: boolean; orderId?: string; waybillId?: string } {
  try {
    if (!qr.startsWith("HVWB:")) return { valid: false };
    const parsed = JSON.parse(Buffer.from(qr.slice(5), "base64url").toString());
    // Recompute signature
    const { sig, ...rest } = parsed;
    const check = createHash("sha256").update(JSON.stringify(rest) + process.env.HOTELSVENDORS_HMAC_SECRET || "").digest("hex").slice(0, 16);
    if (check !== sig) return { valid: false };
    return { valid: true, orderId: rest.orderId, waybillId: rest.waybillId };
  } catch {
    return { valid: false };
  }
}

/* ── GRN reconciliation ── */
export function reconcileGrn(orderId: string, lines: GrnLine[], signedBy: string, verificationMode: "QR_SCAN" | "MANUAL" = "QR_SCAN"): GrnResult {
  const discrepancies: DiscrepancyKind[] = [];
  let shortageValue = 0;
  let damageValue = 0;

  for (const line of lines) {
    if (line.received < line.expected) {
      discrepancies.push("SHORTAGE");
      shortageValue += (line.expected - line.received) * 100; // assume unit cost 100 for demo; real: $.price
    }
    if (line.received > line.expected) discrepancies.push("SURPLUS");
    if (line.damageNote) {
      discrepancies.push("DAMAGED");
      damageValue += line.received * 100 * 0.5; // partial value of damaged units
    }
  }

  // If any line was damaged / short, still accept pending inspection but flag.
  const accepted = !discrepancies.includes("MISSING_DOC");

  return {
    orderId,
    lines,
    discrepancies,
    shortageValue,
    damageValue,
    accepted,
    signedBy,
    signedAt: new Date().toISOString(),
    verificationMode,
  };
}

/* ── Accountability decision for a discrepancy ── */
export function accountabilityDecision(grn: GrnResult, terms: AccountabilityTerms): { liableParty: string; amount: number; note: string } {
  const totalLiability = grn.shortageValue + grn.damageValue;
  if (totalLiability <= 0) return { liableParty: "NONE", amount: 0, note: "No in-transit discrepancy — carrier cleared." };

  const capped = Math.min(totalLiability, terms.carrierLiableUpTo, terms.perKgLiability * 10);

  if (terms.burdenOfProof === "CARRIER") {
    return { liableParty: "CARRIER", amount: capped, note: `Carrier liable up to EGP ${capped.toLocaleString()} (burden of proof on carrier).` };
  }
  if (terms.burdenOfProof === "SHARED") {
    return {
      liableParty: "SHARED",
      amount: Math.round(capped / 2),
      note: `Shared liability — carrier EGP ${Math.round(capped / 2).toLocaleString()}, remainder via claim within ${terms.claimWindowDays}-day window.`,
    };
  }
  return { liableParty: "BUYER", amount: 0, note: "Buyer-assumed risk — claim under carrier insurance required." };
}
