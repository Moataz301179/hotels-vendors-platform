/**
 * tb-diagnostic-engine.ts
 *
 * TB diagnostic engine: identify procurement-relevant spend, materiality thresholds,
 * cost pools, and required selective drill-down.
 *
 * CORRECTION APPLIED (Correction 3 — Evidence Chain):
 * - Every output carries sourceIngestionId linking back to origin.
 * - Outputs are labeled with evidence type (DERIVED_FACT, INFERENCE).
 *
 * CORRECTION APPLIED (Correction 4 — Savings Calculation):
 * - This engine does NOT compute savings. It identifies cost pools and
 *   materiality. Savings calculation is deferred to the savings calculator
 *   (Phase 3), which enforces methodology requirements.
 *
 * TB SCOPE (from Master Hermes Prompt §15):
 * TB can establish: account structure, procurement-relevant spend, materiality,
 * cost pools, category/account distribution.
 * TB alone cannot establish: item-level price, quantity, supplier concentration,
 * price variance, contract compliance, realized savings.
 *
 * Therefore, this engine explicitly outputs what deeper AP/procurement evidence
 * is required instead of pretending that TB contains it.
 */

import {
  type CanonicalAccount,
  type CurrencyCode,
  monetaryAdd,
  monetarySubtract,
} from './canonical-schema';
import {
  type IngestionId,
  type DerivedFact,
  type Inference,
  type LabeledAssertion,
  EvidenceLabel,
  type EvidenceReference,
  createIngestionId,
} from './evidence-chain';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of TB diagnostic analysis.
 */
export interface TbDiagnosticResult {
  /** Ingestion ID this diagnostic was run on */
  sourceIngestionId: IngestionId;
  /** When the diagnostic was run */
  analyzedAt: string;
  /** Total number of accounts analyzed */
  totalAccounts: number;
  /** Total procurement-relevant accounts identified */
  procurementRelevantAccounts: number;
  /** Total procurement spend (sum of procurement-relevant account balances) */
  totalProcurementSpend: {
    value: number;
    currency: CurrencyCode;
  } | null;
  /** Account type distribution */
  accountTypeDistribution: Record<string, { count: number; totalBalance: number; currency: CurrencyCode | null }>;
  /** Procurement category distribution (derived from account names + types) */
  procurementCategoryDistribution: Record<string, { accounts: string[]; totalBalance: number; currency: CurrencyCode | null }>;
  /** Materiality thresholds computed */
  materiality: {
    /** Threshold: accounts above this % of total procurement spend are "material" */
    materialThresholdPercent: number;
    /** Threshold: accounts above this % of total expenses are "highly material" */
    highMaterialityPercent: number;
    /** Material accounts (flagged for review) */
    materialAccounts: MaterialAccount[];
    /** Highly material accounts (flagged for priority drill-down) */
    highMaterialityAccounts: MaterialAccount[];
  };
  /** Cost pools identified */
  costPools: CostPool[];
  /** Drill-down requests generated (what deeper evidence is needed) */
  drillDownRequests: DrillDownRequest[];
  /** Assertions (labeled facts + inferences) */
  assertions: LabeledAssertion[];
}

/**
 * A material account flagged by the diagnostic engine.
 */
export interface MaterialAccount {
  /** Account ID */
  accountId: string;
  /** Account code */
  accountCode: string;
  /** Account name */
  accountName: string;
  /** Account type */
  accountType: string;
  /** Balance */
  balance: number;
  /** Currency */
  currency: CurrencyCode;
  /** % of total procurement spend (if total procurement spend is known) */
  percentOfProcurementSpend?: number;
  /** % of total expenses (if total expenses are known) */
  percentOfTotalExpenses?: number;
  /** Why this account was flagged */
  reason: string;
  /** Evidence reference linking back to source */
  evidence: EvidenceReference;
}

/**
 * A cost pool identified by the diagnostic engine.
 * A cost pool is a group of accounts that represent a procurement category
 * (e.g., "F&B Supplies", "Housekeeping Consumables", "Engineering Parts").
 */
export interface CostPool {
  /** Unique pool ID */
  poolId: string;
  /** Pool name (derived from account names/types) */
  name: string;
  /** Accounts in this pool */
  accountIds: string[];
  /** Total balance of the pool */
  totalBalance: number;
  /** Currency */
  currency: CurrencyCode;
  /** % of total procurement spend */
  percentOfProcurementSpend?: number;
  /** Why this pool was identified */
  rationale: string;
  /** Evidence references */
  evidence: EvidenceReference[];
  /** Suggested drill-down: what deeper data would help analyze this pool */
  suggestedDrillDown: string[];
}

/**
 * A drill-down request: what deeper AP/procurement data is needed.
 * This is the selective drill-down mechanism — not every hotel provides every
 * data type, and the engine requests only what's needed for flagged cost pools.
 */
export interface DrillDownRequest {
  /** Unique request ID */
  requestId: string;
  /** Which cost pool this request relates to */
  relatedCostPoolId?: string;
  /** Related account IDs */
  relatedAccountIds: string[];
  /** What data is requested */
  requestedData: {
    /** Type of data: 'AP_INVOICE_DETAIL' | 'ITEM_LEVEL' | 'VENDOR_LIST' | 'CONTRACT_REFERENCE' | 'PAYMENT_TERMS' */
    dataType: 'AP_INVOICE_DETAIL' | 'ITEM_LEVEL' | 'VENDOR_LIST' | 'CONTRACT_REFERENCE' | 'PAYMENT_TERMS';
    /** Why this data is needed */
    reason: string;
    /** Specific fields requested (e.g., ["vendorName", "invoiceAmount", "invoiceDate", "quantity", "unitPrice"]) */
    fields: string[];
  }[];
  /** Priority: 'HIGH' | 'MEDIUM' | 'LOW' */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** When this request was generated */
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COST POOL CATEGORIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map account names/types to procurement categories.
 * This is a heuristic — real categorization should be refined with pilot hotel input.
 */
const PROCUREMENT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'F&B Supplies': ['food', 'beverage', 'drink', 'coffee', 'tea', 'juice', 'soft drink', 'mineral water', 'f&b', 'food & beverage'],
  'Housekeeping Consumables': ['cleaning', 'detergent', 'soap', 'shampoo', 'toiletries', 'linen', 'laundry', 'room cleaning', 'housekeeping'],
  'Guest Amenities': ['amenity', 'guest soap', 'guest shampoo', 'toiletry', 'room amenity', 'bath amenity'],
  'Engineering & Maintenance': ['engineering', 'maintenance', 'repair', 'spare part', 'equipment part', 'HVAC', 'electrical', 'plumbing', 'mechanical'],
  'Kitchen & Catering': ['kitchen', 'catering', 'chef', 'cookware', 'kitchenware', 'food prep', ' catering'],
  'Laundry & Linen': ['laundry', 'linen', 'towel', 'bed sheet', 'bed linen', 'table linen'],
  'Safety & Security': ['safety', 'security', 'first aid', 'fire extinguisher', 'emergency'],
  'Administrative Supplies': ['office', 'stationery', 'paper', 'printer', 'toner', 'administrative', 'admin'],
  'Pest Control': ['pest', 'pesticide', 'fumigation', 'insect', 'rodent'],
  'Waste Management': ['waste', 'garbage', 'refuse', 'recycling', 'disposal'],
};

/**
 * Categorize an account into a procurement category.
 */
function categorizeAccount(account: CanonicalAccount): string {
  const nameLower = (account.accountName || '').toLowerCase();
  const codeLower = (account.accountCode || '').toLowerCase();
  const rawCategory = (account.rawData?.['category'] as string | undefined)?.toLowerCase() ?? '';

  // Check raw category first
  if (rawCategory) {
    for (const [poolName, keywords] of Object.entries(PROCUREMENT_CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (rawCategory.includes(kw)) return poolName;
      }
    }
  }

  // Check account name
  for (const [poolName, keywords] of Object.entries(PROCUREMENT_CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (nameLower.includes(kw) || codeLower.includes(kw)) return poolName;
    }
  }

  // Fallback to account type
  if (account.accountType === 'EXPENSE_PROCUREMENT') {
    return 'General Procurement';
  }

  return 'Uncategorized';
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run TB diagnostic analysis on a set of accounts.
 *
 * @param accounts - Canonical accounts from a TB export
 * @param sourceIngestionId - The ingestion ID this analysis is based on
 * @param currencyOverride - Optional currency override (if all accounts are in the same currency)
 * @returns TB diagnostic result with cost pools, materiality, and drill-down requests
 */
export function runTbDiagnostic(
  accounts: CanonicalAccount[],
  sourceIngestionId: IngestionId,
  currencyOverride?: CurrencyCode
): TbDiagnosticResult {
  const analyzedAt = new Date().toISOString();
  const totalAccounts = accounts.length;

  // Step 1: Identify procurement-relevant accounts
  const procurementAccounts = accounts.filter((a) => a.procurementRelevant || a.accountType === 'EXPENSE_PROCUREMENT');

  // Step 2: Compute total procurement spend (sum of procurement account balances)
  let totalProcurementSpend: { value: number; currency: CurrencyCode } | null = null;
  const spendCurrencies = new Set<string>();

  for (const account of procurementAccounts) {
    const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
    if (balance !== undefined && balance !== null) {
      spendCurrencies.add(account.currency);
      if (!totalProcurementSpend) {
        totalProcurementSpend = { value: 0, currency: account.currency };
      } else if (totalProcurementSpend.currency === account.currency) {
        totalProcurementSpend.value += balance;
      } else {
        // Multi-currency: can't sum without FX rates
        totalProcurementSpend = null;
        break;
      }
    }
  }

  // If currency override provided and there's a single currency or no currency, use it
  if (currencyOverride && totalProcurementSpend === null && spendCurrencies.size <= 1) {
    const singleCurrency = spendCurrencies.values().next().value as string || currencyOverride;
    totalProcurementSpend = { value: 0, currency: singleCurrency as CurrencyCode };
    for (const account of procurementAccounts) {
      const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
      if (balance !== undefined && balance !== null) {
        totalProcurementSpend!.value += balance;
      }
    }
  }

  // Step 3: Account type distribution
  const accountTypeDistribution: Record<string, { count: number; totalBalance: number; currency: CurrencyCode | null }> = {};

  for (const account of accounts) {
    const type = account.accountType;
    if (!accountTypeDistribution[type]) {
      accountTypeDistribution[type] = { count: 0, totalBalance: 0, currency: null };
    }
    accountTypeDistribution[type].count++;
    const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
    if (balance !== undefined && balance !== null) {
      if (accountTypeDistribution[type].currency === null) {
        accountTypeDistribution[type].currency = account.currency;
      }
      accountTypeDistribution[type].totalBalance += balance;
    }
  }

  // Step 4: Procurement category distribution
  const procurementCategoryDistribution: Record<string, { accounts: string[]; totalBalance: number; currency: CurrencyCode | null }> = {};

  for (const account of procurementAccounts) {
    const category = categorizeAccount(account);
    if (!procurementCategoryDistribution[category]) {
      procurementCategoryDistribution[category] = { accounts: [], totalBalance: 0, currency: null };
    }
    procurementCategoryDistribution[category].accounts.push(account.id);
    const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
    if (balance !== undefined && balance !== null) {
      if (procurementCategoryDistribution[category].currency === null) {
        procurementCategoryDistribution[category].currency = account.currency;
      }
      procurementCategoryDistribution[category].totalBalance += balance;
    }
  }

  // Step 5: Materiality thresholds
  // Materiality = accounts that represent a meaningful portion of total spend
  // Thresholds: 5% = material, 10% = highly material (configurable)
  const materialThresholdPercent = 5;
  const highMaterialityPercent = 10;

  const materialAccounts: MaterialAccount[] = [];
  const highMaterialityAccounts: MaterialAccount[] = [];

  if (totalProcurementSpend && totalProcurementSpend.value > 0) {
    const materialThreshold = totalProcurementSpend.value * (materialThresholdPercent / 100);
    const highMaterialityThreshold = totalProcurementSpend.value * (highMaterialityPercent / 100);

    for (const account of procurementAccounts) {
      const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
      if (balance === undefined || balance === null) continue;

      const percentOfSpend = (balance / totalProcurementSpend.value) * 100;

      if (percentOfSpend >= materialThresholdPercent) {
        const materialAccount: MaterialAccount = {
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          balance,
          currency: account.currency,
          percentOfProcurementSpend: percentOfSpend,
          reason: `Account represents ${percentOfSpend.toFixed(2)}% of total procurement spend (above ${materialThresholdPercent}% threshold)`,
          evidence: {
            type: 'source_record',
            id: account.id,
            description: `Account ${account.accountCode}: ${account.accountName} — balance ${balance} ${account.currency}`,
          },
        };
        materialAccounts.push(materialAccount);

        if (percentOfSpend >= highMaterialityPercent) {
          highMaterialityAccounts.push(materialAccount);
        }
      }
    }
  }

  // Step 6: Cost pools (group procurement accounts by category)
  const costPools: CostPool[] = [];
  const poolAccountMap = new Map<string, CanonicalAccount[]>();

  for (const account of procurementAccounts) {
    const category = categorizeAccount(account);
    if (!poolAccountMap.has(category)) {
      poolAccountMap.set(category, []);
    }
    poolAccountMap.get(category)!.push(account);
  }

  let poolIdCounter = 1;
  for (const [category, accountsInPool] of poolAccountMap.entries()) {
    let poolTotal = 0;
    let poolCurrency: CurrencyCode | null = null;
    const evidenceRefs: EvidenceReference[] = [];

    for (const account of accountsInPool) {
      const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
      if (balance !== undefined && balance !== null) {
        poolTotal += balance;
      }
      if (poolCurrency === null) poolCurrency = account.currency;
      evidenceRefs.push({
        type: 'source_record',
        id: account.id,
        description: `Account ${account.accountCode}: ${account.accountName}`,
      });
    }

    if (poolCurrency === null) poolCurrency = 'USD' as CurrencyCode; // fallback — should be caught by validation

    const pool: CostPool = {
      poolId: `pool-${poolIdCounter++}`,
      name: category,
      accountIds: accountsInPool.map((a) => a.id),
      totalBalance: poolTotal,
      currency: poolCurrency as CurrencyCode,
      percentOfProcurementSpend: totalProcurementSpend ? (poolTotal / totalProcurementSpend.value) * 100 : undefined,
      rationale: `${accountsInPool.length} accounts categorized as "${category}"`,
      evidence: evidenceRefs,
      suggestedDrillDown: suggestDrillDownForPool(category, accountsInPool),
    };

    costPools.push(pool);
  }

  // Sort cost pools by total balance (descending)
  costPools.sort((a, b) => b.totalBalance - a.totalBalance);

  // Step 7: Drill-down requests
  const drillDownRequests: DrillDownRequest[] = [];
  let requestIdCounter = 1;

  // Request AP invoice detail for highly material cost pools
  for (const pool of costPools) {
    if (pool.percentOfProcurementSpend && pool.percentOfProcurementSpend >= highMaterialityPercent) {
      drillDownRequests.push({
        requestId: `ddr-${requestIdCounter++}`,
        relatedCostPoolId: pool.poolId,
        relatedAccountIds: pool.accountIds,
        requestedData: [
          {
            dataType: 'AP_INVOICE_DETAIL',
            reason: `Cost pool "${pool.name}" represents ${pool.percentOfProcurementSpend?.toFixed(2)}% of procurement spend. AP invoice detail needed to analyze vendor concentration, price variance, and payment terms.`,
            fields: ['vendorName', 'invoiceNumber', 'invoiceDate', 'invoiceAmount', 'dueDate', 'paymentDate', 'currency'],
          },
        ],
        priority: 'HIGH',
        generatedAt: analyzedAt,
      });
    }
  }

  // Request item-level data for cost pools where price variance analysis is needed
  for (const pool of costPools) {
    if (pool.percentOfProcurementSpend && pool.percentOfProcurementSpend >= materialThresholdPercent && pool.percentOfProcurementSpend < highMaterialityPercent) {
      drillDownRequests.push({
        requestId: `ddr-${requestIdCounter++}`,
        relatedCostPoolId: pool.poolId,
        relatedAccountIds: pool.accountIds,
        requestedData: [
          {
            dataType: 'ITEM_LEVEL',
            reason: `Cost pool "${pool.name}" represents ${pool.percentOfProcurementSpend?.toFixed(2)}% of procurement spend. Item-level data would enable price variance and consolidation analysis.`,
            fields: ['itemDescription', 'sku', 'quantity', 'unitPrice', 'vendorName', 'currency'],
          },
        ],
        priority: 'MEDIUM',
        generatedAt: analyzedAt,
      });
    }
  }

  // Step 8: Build assertions (labeled facts + inferences)
  const assertions: LabeledAssertion[] = [];

  // FACT: total accounts analyzed
  assertions.push({
    evidenceLabel: 'DERIVED_FACT',
    statement: `Analyzed ${totalAccounts} accounts from TB export.`,
    sourceIngestionId,
    evidence: [],
    confidence: 1.0,
    createdAt: analyzedAt,
  });

  // FACT: procurement-relevant account count
  assertions.push({
    evidenceLabel: 'DERIVED_FACT',
    statement: `Identified ${procurementAccounts.length} procurement-relevant accounts (${procurementAccounts.length / totalAccounts * 100 || 0}% of total).`,
    sourceIngestionId,
    evidence: [],
    confidence: 0.9,
    createdAt: analyzedAt,
  });

  // FACT: total procurement spend (if computable)
  if (totalProcurementSpend) {
    assertions.push({
      evidenceLabel: 'DERIVED_FACT',
      statement: `Total procurement-relevant spend: ${totalProcurementSpend.value.toLocaleString()} ${totalProcurementSpend.currency}.`,
      sourceIngestionId,
      evidence: [],
      confidence: 0.95,
      createdAt: analyzedAt,
    });
  } else if (spendCurrencies.size > 1) {
    assertions.push({
      evidenceLabel: 'INFERENCE',
      statement: `Multi-currency procurement spend detected (${Array.from(spendCurrencies).join(', ')}). Cannot compute total without FX rates. Request FX rate data or currency conversion.`,
      sourceIngestionId,
      evidence: [],
      confidence: 0.7,
      createdAt: analyzedAt,
    });
  }

  // INFERENCE: category concentration
  if (costPools.length > 0) {
    const topPool = costPools[0];
    if (topPool.percentOfProcurementSpend && topPool.percentOfProcurementSpend > 20) {
      assertions.push({
        evidenceLabel: 'INFERENCE',
        statement: `Category "${topPool.name}" dominates procurement spend at ${topPool.percentOfProcurementSpend.toFixed(2)}%. This is a high-priority area for drill-down analysis.`,
        sourceIngestionId,
        evidence: topPool.evidence.map((e) => ({ ...e, description: `${e.description} — part of ${topPool.name} cost pool` })),
        confidence: 0.8,
        createdAt: analyzedAt,
      });
    }
  }

  // Return result
  return {
    sourceIngestionId,
    analyzedAt,
    totalAccounts,
    procurementRelevantAccounts: procurementAccounts.length,
    totalProcurementSpend,
    accountTypeDistribution,
    procurementCategoryDistribution,
    materiality: {
      materialThresholdPercent,
      highMaterialityPercent,
      materialAccounts,
      highMaterialityAccounts,
    },
    costPools,
    drillDownRequests,
    assertions,
  };
}

/**
 * Suggest drill-down data for a cost pool based on its category.
 */
function suggestDrillDownForPool(category: string, accounts: CanonicalAccount[]): string[] {
  const suggestions: string[] = [];

  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('food') || categoryLower.includes('beverage') || categoryLower.includes('f&b')) {
    suggestions.push('Item-level invoice data (food item, quantity, unit price, vendor)');
    suggestions.push('Vendor list with contract terms for each vendor');
    suggestions.push('Purchase order references for traceability');
  }

  if (categoryLower.includes('housekeeping') || categoryLower.includes('linen') || categoryLower.includes('laundry')) {
    suggestions.push('Item-level detail for cleaning supplies and linens');
    suggestions.push('Vendor consolidation potential — which vendors supply overlapping items?');
    suggestions.push('Payment terms comparison across vendors');
  }

  if (categoryLower.includes('engineering') || categoryLower.includes('maintenance') || categoryLower.includes('repair')) {
    suggestions.push('Item-level spare parts and materials data');
    suggestions.push('Contract references for maintenance contracts');
    suggestions.push('Purchase order history for recurring orders');
  }

  if (categoryLower.includes('amenit')) {
    suggestions.push('Item-level amenity procurement data (brand, quantity, unit price)');
    suggestions.push('Vendor list with contract terms');
  }

  if (suggestions.length === 0) {
    suggestions.push('Item-level invoice detail for category analysis');
    suggestions.push('Vendor list with spend breakdown');
  }

  return suggestions;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIALITY ANALYSIS (standalone helper)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute materiality threshold for a set of accounts.
 * Returns the threshold value and which accounts exceed it.
 *
 * @param accounts - Accounts to analyze
 * @param thresholdPercent - Materiality threshold as percentage of total (default: 5%)
 * @returns Materiality analysis result
 */
export function computeMateriality(
  accounts: CanonicalAccount[],
  thresholdPercent: number = 5
): {
  totalSpend: number | null;
  currency: CurrencyCode | null;
  thresholdValue: number | null;
  materialAccounts: MaterialAccount[];
} {
  // Compute total spend
  let totalSpend = 0;
  let currency: CurrencyCode | null = null;
  const currencies = new Set<string>();

  for (const account of accounts) {
    const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
    if (balance !== undefined && balance !== null) {
      totalSpend += balance;
      currencies.add(account.currency);
      if (currency === null) currency = account.currency;
    }
  }

  // If multi-currency, can't compute without FX
  if (currencies.size > 1) {
    return {
      totalSpend: null,
      currency: null,
      thresholdValue: null,
      materialAccounts: [],
    };
  }

  if (totalSpend === 0 || currency === null) {
    return {
      totalSpend: 0,
      currency,
      thresholdValue: 0,
      materialAccounts: [],
    };
  }

  const thresholdValue = totalSpend * (thresholdPercent / 100);
  const materialAccounts: MaterialAccount[] = [];

  for (const account of accounts) {
    const balance = account.balance ?? (account.debit ?? 0) - (account.credit ?? 0);
    if (balance !== undefined && balance !== null && balance >= thresholdValue) {
      materialAccounts.push({
        accountId: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        balance,
        currency,
        percentOfProcurementSpend: (balance / totalSpend) * 100,
        reason: `Balance of ${balance} ${currency} exceeds ${thresholdPercent}% materiality threshold (${thresholdValue.toLocaleString()} ${currency})`,
        evidence: {
          type: 'source_record',
          id: account.id,
          description: `Account ${account.accountCode}: ${account.accountName}`,
        },
      });
    }
  }

  return {
    totalSpend,
    currency,
    thresholdValue,
    materialAccounts,
  };
}
