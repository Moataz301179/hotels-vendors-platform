/**
 * savings-calculator.ts
 *
 * Savings calculator with evidence-backed methodology enforcement.
 *
 * CORRECTION APPLIED (Correction 4 — Savings Calculation):
 * - baseline - proposed is valid ONLY when proposed has an evidence-backed
 *   CalculationMethodology.
 * - If proposed is based on an assumption (e.g., "assume 10% discount"),
 *   the result is classified as SCENARIO, not a saving.
 * - Industry-average discount without a verified source is NOT market evidence.
 * - The calculator enforces this distinction.
 *
 * EVIDENCE CLASSIFICATION:
 * - VERIFIED SAVING: Requires subsequent real hotel outcome data (Phase 7).
 *   Not produced by this calculator — that's future work.
 * - CALCULATED OPPORTUNITY: baseline - proposed where proposed has
 *   evidence-backed methodology. Requires actual hotel evidence.
 * - SCENARIO: Labelled assumption about what could happen if conditions were met.
 * - HYPOTHESIS: Labelled hypothesis that needs evidence to confirm.
 *
 * FROM MASTER HERMES PROMPT §13:
 *   CALCULATED OPPORTUNITY requires actual hotel evidence plus an explicit
 *   calculation methodology.
 *   A VERIFIED SAVING requires subsequent real hotel outcome data.
 */

import {
  type MonetaryAmount,
  type CurrencyCode,
  monetarySubtract,
  type IngestionRecord,
} from './canonical-schema';
import {
  type IngestionId,
  type CalculatedOpportunity,
  type ScenarioHypothesis,
  type EvidenceReference,
  type CalculationMethodology,
  isMethodologyEvidenceBacked,
  type LabeledAssertion,
  EVIDENCE_LABEL_VALUES,
} from './evidence-chain';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Input for calculating a single opportunity.
 */
export interface OpportunityInput {
  /** Source ingestion ID */
  sourceIngestionId: IngestionId;
  /** Opportunity category */
  category: string;
  /** Human-readable title */
  title: string;
  /** Baseline state description */
  baselineDescription: string;
  /** Baseline value */
  baselineValue: number;
  /** Baseline currency */
  baselineCurrency: CurrencyCode;
  /** Baseline evidence references */
  baselineEvidence: EvidenceReference[];
  /** Proposed state description */
  proposedDescription: string;
  /** Proposed value */
  proposedValue: number;
  /** Proposed currency (must match baseline) */
  proposedCurrency: CurrencyCode;
  /** Calculation methodology (MUST be evidence-backed for CALCULATED_OPPORTUNITY) */
  methodology: CalculationMethodology;
  /** Evidence supporting the proposed value */
  proposedEvidence: EvidenceReference[];
  /** Implementation effort estimate */
  implementationEffort: string | number;
  /** Assumptions made */
  assumptions: string[];
}

/**
 * Output of the savings calculator.
 */
export interface SavingsCalculationResult {
  /** Source ingestion ID */
  sourceIngestionId: IngestionId;
  /** Calculated opportunity (if methodology is evidence-backed) */
  calculatedOpportunity?: CalculatedOpportunity;
  /** Scenario/hypothesis (if methodology is NOT evidence-backed) */
  scenarioHypothesis?: ScenarioHypothesis;
  /** Classification of the result */
  classification: 'CALCULATED_OPPORTUNITY' | 'SCENARIO' | 'HYPOTHESIS';
  /** Whether the calculation is valid (has evidence-backed methodology) */
  isValid: boolean;
  /** Warning messages (e.g., if methodology is not evidence-backed) */
  warnings: string[];
  /** When the calculation was performed */
  calculatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVINGS CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate a savings opportunity from baseline and proposed values.
 *
 * CORRECTION APPLIED:
 * - If methodology is evidence-backed → CALCULATED_OPPORTUNITY with
 *   baseline - proposed as the saving.
 * - If methodology is NOT evidence-backed → SCENARIO, not a saving.
 * - The calculator enforces this distinction.
 *
 * @param input - Opportunity input with baseline, proposed, methodology, and evidence
 * @returns Savings calculation result with appropriate classification
 */
export function calculateOpportunity(input: OpportunityInput): SavingsCalculationResult {
  const calculatedAt = new Date().toISOString();
  const warnings: string[] = [];

  // Validate currency match
  if (input.baselineCurrency !== input.proposedCurrency) {
    warnings.push(`Currency mismatch: baseline is ${input.baselineCurrency}, proposed is ${input.proposedCurrency}. Savings calculation requires same currency.`);
    return {
      sourceIngestionId: input.sourceIngestionId,
      calculatedOpportunity: undefined,
      scenarioHypothesis: undefined,
      classification: 'SCENARIO',
      isValid: false,
      warnings,
      calculatedAt,
    };
  }

  // Validate methodology
  const methodologyIsEvidenceBacked = isMethodologyEvidenceBacked(input.methodology);

  if (!methodologyIsEvidenceBacked) {
    warnings.push(`Methodology "${input.methodology}" is NOT evidence-backed. This cannot be presented as a saving. Classified as SCENARIO.`);
  }

  // Check for assumption-based methodologies
  const assumptionMethodologies = [
    'ASSUMED_DISCOUNT',
    'ASSUMED_MARKET_PRICE',
    'INDUSTRY_AVERAGE',
    'ASSUMED_VOLUME',
    'ASSUMED_TERMS',
  ];

  const isAssumption = assumptionMethodologies.some(
    (m) => input.methodology.toUpperCase().includes(m)
  );

  if (isAssumption) {
    warnings.push(`Methodology "${input.methodology}" is assumption-based. Result is SCENARIO, not a saving.`);
  }

  // Compute saving
  const savingResult = monetarySubtract(
    { value: input.baselineValue, currency: input.baselineCurrency },
    { value: input.proposedValue, currency: input.proposedCurrency }
  );

  if (!savingResult) {
    warnings.push('Cannot compute saving: currency mismatch or invalid values.');
    return {
      sourceIngestionId: input.sourceIngestionId,
      calculatedOpportunity: undefined,
      scenarioHypothesis: undefined,
      classification: 'SCENARIO',
      isValid: false,
      warnings,
      calculatedAt,
    };
  }

  const saving = savingResult.value;

  // Build evidence references (combine baseline + proposed)
  const allEvidence: EvidenceReference[] = [
    ...input.baselineEvidence,
    ...input.proposedEvidence,
  ];

  if (methodologyIsEvidenceBacked && !isAssumption) {
    // CALCULATED OPPORTUNITY
    const opportunity: CalculatedOpportunity = {
      sourceIngestionId: input.sourceIngestionId,
      opportunityId: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: input.category,
      title: input.title,
      baseline: {
        description: input.baselineDescription,
        value: input.baselineValue,
        currency: input.baselineCurrency,
        evidence: input.baselineEvidence,
      },
      proposed: {
        description: input.proposedDescription,
        value: input.proposedValue,
        currency: input.proposedCurrency,
        methodology: input.methodology,
        evidence: input.proposedEvidence,
      },
      saving,
      savingCurrency: input.baselineCurrency,
      confidence: computeConfidence(input.methodology, input.baselineEvidence, input.proposedEvidence),
      implementationEffort: input.implementationEffort,
      calculatedAt,
      assumptions: input.assumptions,
    };

    return {
      sourceIngestionId: input.sourceIngestionId,
      calculatedOpportunity: opportunity,
      scenarioHypothesis: undefined,
      classification: 'CALCULATED_OPPORTUNITY',
      isValid: true,
      warnings,
      calculatedAt,
    };
  } else {
    // SCENARIO / HYPOTHESIS
    const scenario: ScenarioHypothesis = {
      sourceIngestionId: input.sourceIngestionId,
      scenarioId: `scn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isAssumption ? 'SCENARIO' : 'HYPOTHESIS',
      description: `${input.title}: If ${input.proposedDescription.toLowerCase()}, the projected saving would be ${saving.toLocaleString()} ${input.baselineCurrency}.`,
      assumption: input.proposedDescription,
      projectedValue: saving,
      projectedCurrency: input.baselineCurrency,
      basis: input.methodology,
      confidence: computeConfidence(input.methodology, input.baselineEvidence, input.proposedEvidence),
      createdAt: calculatedAt,
    };

    return {
      sourceIngestionId: input.sourceIngestionId,
      calculatedOpportunity: undefined,
      scenarioHypothesis: scenario,
      classification: isAssumption ? 'SCENARIO' : 'HYPOTHESIS',
      isValid: false,
      warnings,
      calculatedAt,
    };
  }
}

/**
 * Compute confidence for a calculated opportunity.
 * Based on methodology strength and evidence quality.
 */
function computeConfidence(
  methodology: CalculationMethodology,
  baselineEvidence: EvidenceReference[],
  proposedEvidence: EvidenceReference[]
): number {
  let confidence = 0.5; // baseline

  // Stronger methodologies get higher confidence
  const strongMethodologies = [
    'ACTUAL_HISTORICAL_PRICE_COMPARISON',
    'ACTUAL_SUPPLIER_CONSOLIDATION',
    'ACTUAL_PAYMENT_TERM_ANALYSIS',
  ];

  if (strongMethodologies.some((m) => methodology.toUpperCase().includes(m))) {
    confidence = 0.8;
  }

  // More evidence = higher confidence
  const totalEvidence = baselineEvidence.length + proposedEvidence.length;
  if (totalEvidence >= 5) confidence = Math.min(confidence + 0.1, 0.95);
  else if (totalEvidence >= 3) confidence = Math.min(confidence + 0.05, 0.9);
  else if (totalEvidence === 0) confidence = Math.max(confidence - 0.2, 0.3);

  return confidence;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPPORTUNITY REGISTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A register of all calculated opportunities for a given ingestion.
 */
export interface OpportunityRegister {
  /** Source ingestion ID */
  sourceIngestionId: IngestionId;
  /** All opportunities (calculated + scenarios) */
  opportunities: OpportunityEntry[];
  /** Total calculated opportunity value (sum of CALCULATED_OPPORTUNITY savings) */
  totalCalculatedSavings: number;
  /** Total scenario projected value (sum of SCENARIO projections) */
  totalScenarioProjection: number;
  /** Currency of all values (must be consistent) */
  currency: CurrencyCode;
  /** When the register was generated */
  generatedAt: string;
}

/**
 * A single entry in the opportunity register.
 */
export interface OpportunityEntry {
  /** Opportunity ID */
  id: string;
  /** Category */
  category: string;
  /** Title */
  title: string;
  /** Classification */
  classification: 'CALCULATED_OPPORTUNITY' | 'SCENARIO' | 'HYPOTHESIS';
  /** Baseline value */
  baselineValue: number;
  /** Proposed value */
  proposedValue: number;
  /** Saving (if CALCULATED_OPPORTUNITY) or projected value (if SCENARIO) */
  savingOrProjection: number;
  /** Currency */
  currency: CurrencyCode;
  /** Confidence */
  confidence: number;
  /** Implementation effort */
  implementationEffort: string | number;
  /** Methodology */
  methodology: string;
  /** Evidence references */
  evidence: EvidenceReference[];
  /** Assumptions */
  assumptions: string[];
  /** When created */
  createdAt: string;
}

/**
 * Build an opportunity register from multiple calculation results.
 *
 * @param sourceIngestionId - Source ingestion ID
 * @param results - Array of savings calculation results
 * @param currency - Currency of all values
 * @returns Opportunity register
 */
export function buildOpportunityRegister(
  sourceIngestionId: IngestionId,
  results: SavingsCalculationResult[],
  currency: CurrencyCode
): OpportunityRegister {
  const opportunities: OpportunityEntry[] = [];
  let totalCalculatedSavings = 0;
  let totalScenarioProjection = 0;

  for (const result of results) {
    if (result.calculatedOpportunity) {
      const opp = result.calculatedOpportunity;
      opportunities.push({
        id: opp.opportunityId,
        category: opp.category,
        title: opp.title,
        classification: 'CALCULATED_OPPORTUNITY',
        baselineValue: opp.baseline.value,
        proposedValue: opp.proposed.value,
        savingOrProjection: opp.saving,
        currency: opp.savingCurrency,
        confidence: opp.confidence,
        implementationEffort: opp.implementationEffort,
        methodology: opp.proposed.methodology,
        evidence: opp.baseline.evidence.concat(opp.proposed.evidence),
        assumptions: opp.assumptions,
        createdAt: opp.calculatedAt,
      });
      totalCalculatedSavings += opp.saving;
    }

    if (result.scenarioHypothesis) {
      const scn = result.scenarioHypothesis;
      opportunities.push({
        id: scn.scenarioId,
        category: 'Scenario',
        title: scn.description,
        classification: scn.type,
        baselineValue: 0,
        proposedValue: scn.projectedValue,
        savingOrProjection: scn.projectedValue,
        currency: scn.projectedCurrency,
        confidence: scn.confidence,
        implementationEffort: 'Unknown',
        methodology: scn.assumption,
        evidence: [],
        assumptions: [scn.assumption],
        createdAt: scn.createdAt,
      });
      totalScenarioProjection += scn.projectedValue;
    }
  }

  return {
    sourceIngestionId,
    opportunities,
    totalCalculatedSavings,
    totalScenarioProjection,
    currency,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMON METHODOLOGIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Predefined evidence-backed methodologies that are valid for CALCULATED_OPPORTUNITY.
 */
export const EVIDENCE_BACKED_METHODOLOGIES = [
  'ACTUAL_HISTORICAL_PRICE_COMPARISON',
  'ACTUAL_SUPPLIER_CONSOLIDATION',
  'ACTUAL_PAYMENT_TERM_ANALYSIS',
  'ACTUAL_VOLUME_MIX_ANALYSIS',
  'ACTUAL_CONTRACT_COMPLIANCE_CHECK',
  'ACTUAL_ANOMALY_DETECTION',
] as const;

/**
 * Predefined assumption-based methodologies that produce SCENARIO, not savings.
 */
export const ASSUMPTION_METHODOLOGIES = [
  'ASSUMED_DISCOUNT',
  'ASSUMED_MARKET_PRICE',
  'INDUSTRY_AVERAGE_DISCOUNT',
  'ASSUMED_VOLUME_DISCOUNT',
  'ASSUMED_TERMS_IMPROVEMENT',
  'INDUSTRY_AVERAGE',
] as const;

/**
 * Check if a methodology string is evidence-backed.
 */
export function isEvidenceBackedMethodology(methodology: string): boolean {
  return EVIDENCE_BACKED_METHODOLOGIES.some(
    (m) => methodology.toUpperCase() === m.toUpperCase()
  );
}

/**
 * Check if a methodology string is assumption-based.
 */
export function isAssumptionMethodology(methodology: string): boolean {
  return ASSUMPTION_METHODOLOGIES.some(
    (m) => methodology.toUpperCase() === m.toUpperCase()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION (Phase 7 — future)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark an opportunity as VERIFIED SAVING based on subsequent outcome data.
 *
 * This is Phase 7 work — not implemented in the current calculator.
 * A VERIFIED SAVING requires:
 * - The original opportunity (CALCULATED_OPPORTUNITY)
 * - Subsequent real hotel data showing the actual outcome
 * - Evidence that the proposed action was taken
 * - Evidence that the saving was realized
 *
 * @param opportunityId - ID of the original opportunity
 * @param actualSaving - Actual saving realized (from subsequent data)
 * @param outcomeEvidence - Evidence from subsequent data
 * @returns Verified saving record (placeholder for Phase 7)
 */
export interface VerifiedSaving {
  /** Original opportunity ID */
  originalOpportunityId: string;
  /** Actual saving realized */
  actualSaving: number;
  /** Currency */
  currency: CurrencyCode;
  /** Evidence from outcome data */
  outcomeEvidence: EvidenceReference[];
  /** When verified */
  verifiedAt: string;
  /** Difference between projected and actual (positive = over-performed, negative = under-performed) */
  variance: number;
}

/**
 * Stub for Phase 7 — not implemented yet.
 * A VERIFIED SAVING requires subsequent real hotel outcome data.
 */
export function verifySaving(
  opportunityId: string,
  actualSaving: number,
  currency: CurrencyCode,
  outcomeEvidence: EvidenceReference[]
): VerifiedSaving {
  // TODO: Phase 7 — implement outcome verification
  // This requires:
  // 1. The original opportunity (from the register)
  // 2. Subsequent TB/AP data showing actual outcome
  // 3. Evidence that the proposed action was taken
  // 4. Comparison of projected vs actual
  throw new Error(`Phase 7 not implemented: verifySaving(${opportunityId})`);
}
