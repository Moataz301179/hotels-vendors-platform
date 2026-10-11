const MONEY_TOLERANCE = 0.01;

export type EtaTaxLine = {
  taxAmount: number;
  taxRate: number;
};

export type EtaTaxBreakdown =
  | { ok: true; lines: EtaTaxLine[] }
  | { ok: false; reason: string };

/**
 * Converts supplier-stated, invoice-level VAT into ETA line amounts only when
 * the stated rate and amount reconcile. This deliberately does not infer 14%
 * (or any other rate) for an incomplete commercial record.
 */
export function buildEtaTaxBreakdown(input: {
  lineTotals: unknown[];
  vatRate: unknown;
  vatAmount: unknown;
}): EtaTaxBreakdown {
  if (input.vatRate === null || input.vatRate === undefined) {
    return { ok: false, reason: "A supplier-stated VAT rate is required for ETA submission." };
  }
  if (input.vatAmount === null || input.vatAmount === undefined) {
    return { ok: false, reason: "A supplier-stated VAT amount is required for ETA submission." };
  }
  const taxRate = Number(input.vatRate);
  const expectedVat = Number(input.vatAmount);
  const lineTotals = input.lineTotals.map(Number);

  if (!Number.isFinite(taxRate) || taxRate < 0) {
    return { ok: false, reason: "A supplier-stated VAT rate is required for ETA submission." };
  }
  if (!Number.isFinite(expectedVat) || expectedVat < 0) {
    return { ok: false, reason: "A supplier-stated VAT amount is required for ETA submission." };
  }
  if (!lineTotals.length || lineTotals.some(total => !Number.isFinite(total) || total <= 0)) {
    return { ok: false, reason: "Every invoice line must have a positive stated amount for ETA submission." };
  }

  const rawAmounts = lineTotals.map(total => total * taxRate / 100);
  const roundedAmounts = rawAmounts.map(amount => Math.round(amount * 100) / 100);
  const roundedTotal = Math.round(roundedAmounts.reduce((sum, amount) => sum + amount, 0) * 100) / 100;
  const reconciliationDelta = Math.round((expectedVat - roundedTotal) * 100) / 100;

  if (Math.abs(reconciliationDelta) > MONEY_TOLERANCE) {
    return { ok: false, reason: "Supplier-stated VAT rate and amount do not reconcile with the invoice lines." };
  }

  // Preserve the stated invoice VAT exactly while keeping cent-level totals stable.
  roundedAmounts[roundedAmounts.length - 1] += reconciliationDelta;
  return { ok: true, lines: roundedAmounts.map(taxAmount => ({ taxAmount, taxRate })) };
}
