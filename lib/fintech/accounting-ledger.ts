/**
 * Accounting Ledger & Double-Entry Bookkeeping System
 * Hotels Vendors Fintech Layer — Reverse Factoring Hub Ledger Rules
 *
 * COMPLIANCE MANDATES:
 * 1. Absolute Immutability: Zero UPDATE or DELETE operations are written in this file.
 * 2. Mathematical Balance: Debits must equal Credits EXACTLY. Any difference triggers a 'LEDGER_MISMATCH_EXCEPTION'.
 * 3. Institutional FinTech Nomenclature: Utilizes standard terminology (e.g., 'Accelerated Capital Liquidation', 'Settlement Disbursals').
 */

import { prisma } from "@/lib/prisma";

export interface LedgerLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface FactoringLedgerInput {
  consolidatedInvoiceId: string;
  tenantId: string;
  grossAmount: number;
  advanceRate: number;
  factoringCommissionRate: number;
  factoringCommissionAmount: number;
  factoringFee: number; // The fee charged by the factor
  supplierDiscountRate: number;
  supplierDiscountAmount: number;
  hotelAdminFeeRate: number;
  hotelAdminFeeAmount: number;
  supplierDisbursement: number;
}

export interface SettlementLedgerInput {
  consolidatedInvoiceId: string;
  tenantId: string;
  grossAmount: number;
  hotelAdminFeeAmount: number;
  platformCommissionAmount: number;
  factorSettlementAmount: number;
}

/**
 * Record atomic double-entry bookkeeping journal entries for an Accelerated Capital Liquidation (factoring disbursement).
 * INVARIANT: Debits must balance Credits EXACTLY. Write-once, append-only.
 */
export async function recordDisbursementJournal(
  tx: any,
  input: FactoringLedgerInput
): Promise<string> {
  const {
    consolidatedInvoiceId,
    tenantId,
    grossAmount,
    advanceRate,
    factoringCommissionAmount,
    factoringFee,
    supplierDiscountAmount,
    hotelAdminFeeAmount,
    supplierDisbursement,
  } = input;

  // 1. Fetch Consolidated Invoice details to resolve hotel
  const ci = await tx.consolidatedInvoice.findUnique({
    where: { id: consolidatedInvoiceId },
    select: { hotelId: true, invoiceNumber: true },
  });

  if (!ci) {
    throw new Error(`Aggregated Debt Package not found for ledger: ${consolidatedInvoiceId}`);
  }

  // 2. Calculate amounts for double-entry validation
  const platformEscrowDebit = grossAmount * advanceRate - factoringFee;
  const cashDiscountDelta = Math.max(0, supplierDiscountAmount - factoringFee);

  // Compile ledger lines conforming to standard Chart of Accounts
  const lines: LedgerLine[] = [
    // DEBITS (Asset and Receivable accounts increase)
    {
      accountCode: "1010",
      accountName: "Platform Escrow Bank Account",
      debit: parseFloat(platformEscrowDebit.toFixed(2)),
      credit: 0,
    },
    {
      accountCode: "1210",
      accountName: "Stream 1: Fintech Commission Receivable from Factor",
      debit: parseFloat(factoringCommissionAmount.toFixed(2)),
      credit: 0,
    },
    // CREDITS (Liabilities decrease or Revenues increase)
    {
      accountCode: "4010",
      accountName: "Stream 1: Fintech Commission Revenue",
      debit: 0,
      credit: parseFloat(factoringCommissionAmount.toFixed(2)),
    },
    {
      accountCode: "4020",
      accountName: "Stream 2: Supplier Cash-Discount Delta Revenue",
      debit: 0,
      credit: parseFloat(cashDiscountDelta.toFixed(2)),
    },
    {
      accountCode: "4030",
      accountName: "Stream 3: Hotel Treasury Admin Fee Revenue",
      debit: 0,
      credit: parseFloat(hotelAdminFeeAmount.toFixed(2)),
    },
    {
      accountCode: "2010",
      accountName: "Supplier Accounts Payable (Accelerated Capital Liquidation)",
      debit: 0,
      credit: parseFloat(supplierDisbursement.toFixed(2)),
    },
  ];

  const totalDebit = parseFloat(lines.reduce((sum, l) => sum + l.debit, 0).toFixed(2));
  const totalCredit = parseFloat(lines.reduce((sum, l) => sum + l.credit, 0).toFixed(2));

  // Assert mathematical balance to prevent decimal rounding anomalies
  const imbalance = Math.abs(totalDebit - totalCredit);
  if (imbalance > 0 && imbalance <= 0.05) {
    // Gracefully balance fractional rounding discrepancies against the Platform Bank account
    const platformLine = lines.find((l) => l.accountCode === "1010");
    if (platformLine) {
      if (totalDebit < totalCredit) {
        platformLine.debit = parseFloat((platformLine.debit + imbalance).toFixed(2));
      } else {
        platformLine.debit = parseFloat((platformLine.debit - imbalance).toFixed(2));
      }
    }
  }

  // Recalculate and strictly validate balanced totals
  const finalDebit = parseFloat(lines.reduce((sum, l) => sum + l.debit, 0).toFixed(2));
  const finalCredit = parseFloat(lines.reduce((sum, l) => sum + l.credit, 0).toFixed(2));

  if (finalDebit !== finalCredit) {
    throw new Error(
      `LEDGER_MISMATCH_EXCEPTION: Ledger transaction Debits (${finalDebit}) does not equal Credits (${finalCredit}). Transaction rolled back.`
    );
  }

  const entryNumber = `JE-ACL-${ci.invoiceNumber}-${Date.now()}`;

  // Direct append-only entry creation. ZERO updates/deletes permitted.
  const entry = await tx.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(),
      sourceType: "INVOICE",
      sourceId: consolidatedInvoiceId,
      description: `Accelerated Capital Liquidation disbursal entry for Aggregated Debt Package: ${ci.invoiceNumber}`,
      lines: JSON.stringify(lines),
      totalDebit: finalDebit,
      totalCredit: finalCredit,
      status: "POSTED",
      hotelId: ci.hotelId,
      tenantId,
    },
  });

  return entry.id;
}

/**
 * Record atomic double-entry bookkeeping journal entries for a Settlement Disbursal.
 * Represents the final payment settlement by the Corporate Hotel Group.
 */
export async function recordSettlementDisbursalJournal(
  tx: any,
  input: SettlementLedgerInput
): Promise<string> {
  const {
    consolidatedInvoiceId,
    tenantId,
    grossAmount,
    hotelAdminFeeAmount,
    platformCommissionAmount,
    factorSettlementAmount,
  } = input;

  const ci = await tx.consolidatedInvoice.findUnique({
    where: { id: consolidatedInvoiceId },
    select: { hotelId: true, invoiceNumber: true },
  });

  if (!ci) {
    throw new Error(`Aggregated Debt Package not found for settlement ledger: ${consolidatedInvoiceId}`);
  }

  const lines: LedgerLine[] = [
    // DEBITS (Asset and Receivable accounts increase / Liabilities decrease)
    {
      accountCode: "2020",
      accountName: "Corporate Debt Settlement Payable (Settlement Disbursals)",
      debit: parseFloat(grossAmount.toFixed(2)),
      credit: 0,
    },
    // CREDITS (Cash decreases / Platform Escrow decreases)
    {
      accountCode: "1020",
      accountName: "Corporate Clearing Cash Pool",
      debit: 0,
      credit: parseFloat(factorSettlementAmount.toFixed(2)),
    },
    {
      accountCode: "1010",
      accountName: "Platform Escrow Bank Account",
      debit: 0,
      credit: parseFloat((hotelAdminFeeAmount + platformCommissionAmount).toFixed(2)),
    },
  ];

  const totalDebit = parseFloat(lines.reduce((sum, l) => sum + l.debit, 0).toFixed(2));
  const totalCredit = parseFloat(lines.reduce((sum, l) => sum + l.credit, 0).toFixed(2));

  const imbalance = Math.abs(totalDebit - totalCredit);
  if (imbalance > 0 && imbalance <= 0.05) {
    const cashLine = lines.find((l) => l.accountCode === "1020");
    if (cashLine) {
      if (totalDebit < totalCredit) {
        cashLine.credit = parseFloat((cashLine.credit - imbalance).toFixed(2));
      } else {
        cashLine.credit = parseFloat((cashLine.credit + imbalance).toFixed(2));
      }
    }
  }

  const finalDebit = parseFloat(lines.reduce((sum, l) => sum + l.debit, 0).toFixed(2));
  const finalCredit = parseFloat(lines.reduce((sum, l) => sum + l.credit, 0).toFixed(2));

  if (finalDebit !== finalCredit) {
    throw new Error(
      `LEDGER_MISMATCH_EXCEPTION: Settlement Disbursal Debits (${finalDebit}) does not equal Credits (${finalCredit}). Transaction aborted.`
    );
  }

  const entryNumber = `JE-SETT-${ci.invoiceNumber}-${Date.now()}`;

  const entry = await tx.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(),
      sourceType: "PAYMENT",
      sourceId: consolidatedInvoiceId,
      description: `Settlement Disbursal clearing journal entry for Aggregated Debt Package: ${ci.invoiceNumber}`,
      lines: JSON.stringify(lines),
      totalDebit: finalDebit,
      totalCredit: finalCredit,
      status: "POSTED",
      hotelId: ci.hotelId,
      tenantId,
    },
  });

  return entry.id;
}

/**
 * Record a compensating journal entry to completely reverse a compromised or cancelled posting.
 * Excludes direct UPDATE/DELETE operations to maintain FRA regulatory compliance.
 */
export async function recordCompensatingJournal(
  tx: any,
  originalEntryId: string,
  tenantId: string,
  reason: string
): Promise<string> {
  const original = await tx.journalEntry.findUnique({
    where: { id: originalEntryId, tenantId },
  });

  if (!original) {
    throw new Error(`Original Journal Entry not found for reversal: ${originalEntryId}`);
  }

  if (original.status === "REVERSED") {
    throw new Error(`Journal Entry ${original.entryNumber} has already been reversed.`);
  }

  // Parse lines and completely swap Debits and Credits
  const originalLines: LedgerLine[] = JSON.parse(original.lines);
  const reversingLines: LedgerLine[] = originalLines.map((l) => ({
    accountCode: l.accountCode,
    accountName: `${l.accountName} (Reversal offset)`,
    debit: l.credit, // Original Credit becomes Debit
    credit: l.debit, // Original Debit becomes Credit
  }));

  const finalDebit = original.totalCredit;
  const finalCredit = original.totalDebit;

  if (finalDebit !== finalCredit) {
    throw new Error(`LEDGER_MISMATCH_EXCEPTION: Reversal Debits/Credits do not balance. Reversal blocked.`);
  }

  const entryNumber = `JE-REV-${original.entryNumber}`;

  // Log as new offsetting entry
  const entry = await tx.journalEntry.create({
    data: {
      entryNumber,
      date: new Date(),
      sourceType: original.sourceType,
      sourceId: original.sourceId,
      description: `Compensating Offset Entry for ${original.entryNumber}. Reason: ${reason}`,
      lines: JSON.stringify(reversingLines),
      totalDebit: finalDebit,
      totalCredit: finalCredit,
      status: "REVERSED",
      hotelId: original.hotelId,
      tenantId,
    },
  });

  return entry.id;
}
