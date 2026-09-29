/**
 * management-report-generator.ts
 *
 * Generates actionable management reports from the evidence chain.
 *
 * CORRECTION APPLIED (Correction 4 — Savings Calculation):
 * - The report MUST distinguish VERIFIED SAVING / CALCULATED OPPORTUNITY / SCENARIO / HYPOTHESIS.
 * - No illustrative figures presented as real evidence.
 * - No assumption presented as a saving.
 *
 * CORRECTION APPLIED (Correction 3 — Evidence Chain):
 * - Every figure in the report traces back to sourceIngestionId and evidence references.
 * - If evidence is missing, the report states that explicitly.
 *
 * The report is the management-facing output of the procurement economic loop.
 * It should be actionable: specific recommendations, not generic advice.
 */

import {
  type CanonicalAccount,
  type CanonicalTransaction,
  type CurrencyCode,
  type IngestionRecord,
} from './canonical-schema';
import {
  type IngestionId,
  type LabeledAssertion,
  type EvidenceReference,
} from './evidence-chain';
import {
  type TbDiagnosticResult,
  type CostPool,
  type MaterialAccount,
  type DrillDownRequest,
} from './tb-diagnostic-engine';
import {
  type OpportunityRegister,
  type OpportunityEntry,
  type SavingsCalculationResult,
} from './savings-calculator';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A section in the management report.
 */
export interface ReportSection {
  /** Section title */
  title: string;
  /** Section content (markdown-compatible plain text) */
  content: string;
  /** Section type: 'executivesummary' | 'baseline' | 'opportunities' | 'scenarios' | 'drilldown' | 'nextsteps' | 'appendix' */
  type: 'executivesummary' | 'baseline' | 'opportunities' | 'scenarios' | 'drilldown' | 'nextsteps' | 'appendix';
  /** Whether this section requires attention */
  requiresAttention: boolean;
}

/**
 * Complete management report.
 */
export interface ManagementReport {
  /** Source ingestion ID this report is based on */
  sourceIngestionId: IngestionId;
  /** Report generated at */
  generatedAt: string;
  /** Hotel ID (if available) */
  hotelId?: string;
  /** Source system */
  sourceSystem: string;
  /** Report title */
  title: string;
  /** Executive summary */
  executiveSummary: string;
  /** Report sections */
  sections: ReportSection[];
  /** Total procurement spend analyzed */
  totalProcurementSpend?: {
    value: number;
    currency: CurrencyCode;
  };
  /** Number of opportunities identified */
  opportunitiesCount: number;
  /** Number of scenarios identified */
  scenariosCount: number;
  /** Total calculated opportunity value */
  totalCalculatedOpportunity: number;
  /** Total scenario projection value */
  totalScenarioProjection: number;
  /** Currency of all financial figures */
  currency: CurrencyCode;
  /** Confidence in the overall analysis */
  overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Evidence references for the entire report */
  evidence: EvidenceReference[];
  /** Data quality notes */
  dataQualityNotes: string[];
  /** Warnings */
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a management report from TB diagnostic results and opportunity register.
 *
 * @param diagnostic - TB diagnostic results
 * @param opportunityRegister - Opportunity register (from savings calculator)
 * @param sourceIngestionId - Source ingestion ID
 * @param sourceSystem - Source system name
 * @param hotelId - Optional hotel ID
 * @returns Management report
 */
export function generateReport(
  diagnostic: TbDiagnosticResult,
  opportunityRegister: OpportunityRegister,
  sourceIngestionId: IngestionId,
  sourceSystem: string,
  hotelId?: string
): ManagementReport {
  const generatedAt = new Date().toISOString();

  // Build sections
  const sections: ReportSection[] = [];

  // 1. Executive Summary
  sections.push(buildExecutiveSummary(diagnostic, opportunityRegister));

  // 2. Baseline (TB analysis)
  sections.push(buildBaselineSection(diagnostic));

  // 3. Opportunities (calculated)
  sections.push(buildOpportunitiesSection(opportunityRegister, 'CALCULATED_OPPORTUNITY'));

  // 4. Scenarios (assumptions)
  sections.push(buildOpportunitiesSection(opportunityRegister, 'SCENARIO'));

  // 5. Drill-down requests
  sections.push(buildDrillDownSection(diagnostic));

  // 6. Next steps
  sections.push(buildNextStepsSection(diagnostic, opportunityRegister));

  // 7. Appendix (assertions, data quality)
  sections.push(buildAppendixSection(diagnostic, opportunityRegister));

  // Compute overall confidence
  const overallConfidence = computeOverallConfidence(diagnostic, opportunityRegister);

  // Build evidence references
  const evidence: EvidenceReference[] = [];
  for (const assertion of diagnostic.assertions) {
    evidence.push(...assertion.evidence);
  }
  for (const opp of opportunityRegister.opportunities) {
    evidence.push(...opp.evidence);
  }

  // Data quality notes
  const dataQualityNotes: string[] = [];
  if (diagnostic.totalProcurementSpend === null) {
    dataQualityNotes.push('Multi-currency procurement spend detected. Total procurement spend could not be computed without FX rates. This limits some calculations.');
  }
  if (diagnostic.drillDownRequests.length > 0) {
    dataQualityNotes.push(`${diagnostic.drillDownRequests.length} drill-down requests were generated. The analysis is limited by available data — deeper insights require the requested data.`);
  }
  if (opportunityRegister.opportunities.some((o) => o.classification === 'SCENARIO' || o.classification === 'HYPOTHESIS')) {
    dataQualityNotes.push('Some opportunities are classified as SCENARIO or HYPOTHESIS. These are not presented as savings — they are labelled assumptions that require evidence to confirm.');
  }

  // Warnings
  const warnings: string[] = [];
  for (const section of sections) {
    if (section.requiresAttention) {
      warnings.push(`Section "${section.title}" requires attention.`);
    }
  }

  // Count opportunities and scenarios
  const opportunitiesCount = opportunityRegister.opportunities.filter(
    (o) => o.classification === 'CALCULATED_OPPORTUNITY'
  ).length;
  const scenariosCount = opportunityRegister.opportunities.filter(
    (o) => o.classification === 'SCENARIO' || o.classification === 'HYPOTHESIS'
  ).length;

  // Title
  const title = `Procurement Economic Analysis Report — ${sourceSystem}`;

  // Executive summary (built separately)
  const executiveSummary = buildExecutiveSummaryText(diagnostic, opportunityRegister);

  return {
    sourceIngestionId,
    generatedAt,
    hotelId,
    sourceSystem,
    title,
    executiveSummary,
    sections,
    totalProcurementSpend: diagnostic.totalProcurementSpend ?? undefined,
    opportunitiesCount,
    scenariosCount,
    totalCalculatedOpportunity: opportunityRegister.totalCalculatedSavings,
    totalScenarioProjection: opportunityRegister.totalScenarioProjection,
    currency: opportunityRegister.currency,
    overallConfidence,
    evidence,
    dataQualityNotes,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildExecutiveSummary(diagnostic: TbDiagnosticResult, register: OpportunityRegister): ReportSection {
  const content = buildExecutiveSummaryText(diagnostic, register);
  return {
    title: 'Executive Summary',
    content,
    type: 'executivesummary',
    requiresAttention: register.totalCalculatedSavings > 0 || diagnostic.drillDownRequests.length > 0,
  };
}

function buildExecutiveSummaryText(diagnostic: TbDiagnosticResult, register: OpportunityRegister): string {
  const parts: string[] = [];

  parts.push(`## Executive Summary`);
  parts.push(``);
  parts.push(`**Analysis based on:** Trial Balance data from ${diagnostic.totalAccounts} accounts.`);
  parts.push(`**Analysis date:** ${new Date(diagnostic.analyzedAt).toLocaleDateString()}`);
  parts.push(``);

  if (diagnostic.totalProcurementSpend) {
    parts.push(`**Total procurement-relevant spend:** ${diagnostic.totalProcurementSpend.value.toLocaleString()} ${diagnostic.totalProcurementSpend.currency}`);
    parts.push(`**Procurement-relevant accounts:** ${diagnostic.procurementRelevantAccounts} of ${diagnostic.totalAccounts} (${Math.round(diagnostic.procurementRelevantAccounts / diagnostic.totalAccounts * 100)}%)`);
  } else {
    parts.push(`**Total procurement-relevant spend:** Unable to compute (multi-currency or missing data)`);
    parts.push(`**Procurement-relevant accounts:** ${diagnostic.procurementRelevantAccounts} of ${diagnostic.totalAccounts}`);
  }

  parts.push(``);

  if (register.opportunities.length > 0) {
    parts.push(`**Opportunities identified:** ${register.opportunities.length}`);
    parts.push(`  - **Calculated opportunity (evidence-backed):** ${register.opportunities.filter(o => o.classification === 'CALCULATED_OPPORTUNITY').length}`);
    if (register.totalCalculatedSavings > 0) {
      parts.push(`    - **Total potential saving:** ${register.totalCalculatedSavings.toLocaleString()} ${register.currency}`);
    }
    parts.push(`  - **Scenarios / hypotheses (labelled assumptions):** ${register.opportunities.filter(o => o.classification === 'SCENARIO' || o.classification === 'HYPOTHESIS').length}`);
    if (register.totalScenarioProjection > 0) {
      parts.push(`    - **Total projected (not confirmed):** ${register.totalScenarioProjection.toLocaleString()} ${register.currency}`);
    }
  } else {
    parts.push(`**Opportunities identified:** None (further data may be needed)`);
  }

  parts.push(``);

  if (diagnostic.drillDownRequests.length > 0) {
    parts.push(`**Drill-down requests:** ${diagnostic.drillDownRequests.length} (deeper data needed for full analysis)`);
  }

  parts.push(``);
  parts.push(`**Confidence:** ${diagnostic.assertions.filter(a => a.confidence >= 0.8).length > 0 ? 'MEDIUM-HIGH' : 'MEDIUM'} (based on available data quality)`);
  parts.push(``);

  return parts.join('\n');
}

function buildBaselineSection(diagnostic: TbDiagnosticResult): ReportSection {
  const parts: string[] = [];

  parts.push(`## Baseline: Trial Balance Analysis`);
  parts.push(``);
  parts.push(`### Account Overview`);
  parts.push(``);
  parts.push(`- **Total accounts analyzed:** ${diagnostic.totalAccounts}`);
  parts.push(`- **Procurement-relevant accounts:** ${diagnostic.procurementRelevantAccounts}`);
  parts.push(``);

  if (Object.keys(diagnostic.accountTypeDistribution).length > 0) {
    parts.push(`### Account Type Distribution`);
    parts.push(``);
    parts.push(`| Account Type | Count | Total Balance |`);
    parts.push(`|--------------|-------|---------------|`);
    for (const [type, data] of Object.entries(diagnostic.accountTypeDistribution)) {
      const balanceStr = data.currency
        ? `${data.totalBalance.toLocaleString()} ${data.currency}`
        : `${data.totalBalance.toLocaleString()} (multi-currency)`;
      parts.push(`| ${type} | ${data.count} | ${balanceStr} |`);
    }
    parts.push(``);
  }

  if (Object.keys(diagnostic.procurementCategoryDistribution).length > 0) {
    parts.push(`### Procurement Category Distribution`);
    parts.push(``);
    parts.push(`| Category | Accounts | Total Balance | % of Procurement Spend |`);
    parts.push(`|----------|----------|---------------|----------------------|`);

    const totalSpend = diagnostic.totalProcurementSpend?.value ?? 0;

    for (const [category, data] of Object.entries(diagnostic.procurementCategoryDistribution)) {
      const pct = totalSpend > 0 ? ((data.totalBalance / totalSpend) * 100).toFixed(1) : 'N/A';
      const balanceStr = data.currency
        ? `${data.totalBalance.toLocaleString()} ${data.currency}`
        : `${data.totalBalance.toLocaleString()} (multi-currency)`;
      parts.push(`| ${category} | ${data.accounts.length} | ${balanceStr} | ${pct}% |`);
    }
    parts.push(``);
  }

  if (diagnostic.materiality.highMaterialityAccounts.length > 0) {
    parts.push(`### Highly Material Accounts (> ${diagnostic.materiality.highMaterialityPercent}% of procurement spend)`);
    parts.push(``);
    parts.push(`These accounts represent a significant portion of procurement spend and are priority targets for drill-down analysis.`);
    parts.push(``);
    parts.push(`| Account | Balance | % of Spend |`);
    parts.push(`|---------|---------|------------|`);
    for (const account of diagnostic.materiality.highMaterialityAccounts) {
      const pctStr = account.percentOfProcurementSpend ? `${account.percentOfProcurementSpend.toFixed(1)}%` : 'N/A';
      parts.push(`| ${account.accountName} (${account.accountCode}) | ${account.balance.toLocaleString()} ${account.currency} | ${pctStr} |`);
    }
    parts.push(``);
  }

  if (diagnostic.materiality.materialAccounts.length > 0 && diagnostic.materiality.highMaterialityAccounts.length === 0) {
    parts.push(`### Material Accounts (> ${diagnostic.materiality.materialThresholdPercent}% of procurement spend)`);
    parts.push(``);
    parts.push(`| Account | Balance | % of Spend |`);
    parts.push(`|---------|---------|------------|`);
    for (const account of diagnostic.materiality.materialAccounts) {
      const pctStr = account.percentOfProcurementSpend ? `${account.percentOfProcurementSpend.toFixed(1)}%` : 'N/A';
      parts.push(`| ${account.accountName} (${account.accountCode}) | ${account.balance.toLocaleString()} ${account.currency} | ${pctStr} |`);
    }
    parts.push(``);
  }

  if (diagnostic.materiality.materialAccounts.length === 0) {
    parts.push(`### Materiality Assessment`);
    parts.push(``);
    parts.push(`No accounts exceeded the ${diagnostic.materiality.materialThresholdPercent}% materiality threshold. This may indicate:`);
    parts.push(`- The procurement spend is well-distributed across many small accounts`);
    parts.push(`- The TB data does not contain detailed enough categorization`);
    parts.push(`- Further drill-down data is needed to identify cost pools`);
    parts.push(``);
  }

  return {
    title: 'Baseline Analysis',
    content: parts.join('\n'),
    type: 'baseline',
    requiresAttention: diagnostic.materiality.highMaterialityAccounts.length > 0,
  };
}

function buildOpportunitiesSection(register: OpportunityRegister, classification: 'CALCULATED_OPPORTUNITY' | 'SCENARIO' | 'HYPOTHESIS'): ReportSection {
  const filtered = register.opportunities.filter((o) => o.classification === classification);

  if (filtered.length === 0) {
    return {
      title: classification === 'CALCULATED_OPPORTUNITY' ? 'Calculated Opportunities (Evidence-Backed)' : 'Scenarios & Hypotheses (Labelled Assumptions)',
      content: classification === 'CALCULATED_OPPORTUNITY'
        ? 'No evidence-backed calculated opportunities were identified from the available data. This may change after drill-down data is received.'
        : 'No scenarios or hypotheses were generated. This is expected when all analysis is evidence-backed.',
      type: classification === 'CALCULATED_OPPORTUNITY' ? 'opportunities' : 'scenarios',
      requiresAttention: false,
    };
  }

  const parts: string[] = [];
  const title = classification === 'CALCULATED_OPPORTUNITY'
    ? `Calculated Opportunities (${filtered.length})`
    : `Scenarios & Hypotheses (${filtered.length})`;

  parts.push(`## ${title}`);
  parts.push(``);

  if (classification === 'SCENARIO' || classification === 'HYPOTHESIS') {
    parts.push(`**IMPORTANT:** The following are ${classification.toLowerCase()} — they are NOT presented as savings. `);
    parts.push(`They are labelled assumptions that require additional evidence or confirmation to become verified savings.`);
    parts.push(``);
  }

  for (let i = 0; i < filtered.length; i++) {
    const opp = filtered[i];
    const number = i + 1;

    parts.push(`### ${number}. ${opp.title}`);
    parts.push(``);
    parts.push(`- **Category:** ${opp.category}`);
    parts.push(`- **Classification:** ${opp.classification}`);
    parts.push(`- **Confidence:** ${(opp.confidence * 100).toFixed(0)}%`);
    parts.push(`- **Implementation effort:** ${opp.implementationEffort}`);
    parts.push(``);

    if (opp.classification === 'CALCULATED_OPPORTUNITY') {
      parts.push(`**Baseline:** ${opp.baselineValue.toLocaleString()} ${opp.currency}`);
      parts.push(`**Proposed:** ${opp.proposedValue.toLocaleString()} ${opp.currency}`);
      parts.push(`**Potential saving:** ${opp.savingOrProjection.toLocaleString()} ${opp.currency}`);
      parts.push(``);
      parts.push(`**Methodology:** ${opp.methodology}`);
      parts.push(`**Assumptions:** ${opp.assumptions.length > 0 ? opp.assumptions.join('; ') : 'None'}`);
    } else {
      parts.push(`**Projected value (if assumption holds):** ${opp.savingOrProjection.toLocaleString()} ${opp.currency}`);
      parts.push(`**Assumption:** ${opp.methodology}`);
      parts.push(`**Basis:** ${opp.assumptions.join('; ') || 'Not specified'}`);
    }

    if (opp.evidence.length > 0) {
      parts.push(``);
      parts.push(`**Supporting evidence:**`);
      for (const ev of opp.evidence) {
        parts.push(`- ${ev.description}`);
      }
    }

    parts.push(``);
  }

  return {
    title,
    content: parts.join('\n'),
    type: classification === 'CALCULATED_OPPORTUNITY' ? 'opportunities' : 'scenarios',
    requiresAttention: filtered.length > 0,
  };
}

function buildDrillDownSection(diagnostic: TbDiagnosticResult): ReportSection {
  const requests = diagnostic.drillDownRequests;

  if (requests.length === 0) {
    return {
      title: 'Drill-Down Requests',
      content: 'No drill-down requests were generated. The available TB data is sufficient for the current analysis.',
      type: 'drilldown',
      requiresAttention: false,
    };
  }

  const parts: string[] = [];
  parts.push(`## Drill-Down Requests`);
  parts.push(``);
  parts.push(`The following deeper data is needed to complete the analysis. These requests are selective — `);
  parts.push(`they target the cost pools that represent the highest procurement spend.`);
  parts.push(``);

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const number = i + 1;

    parts.push(`### ${number}. ${req.priority === 'HIGH' ? '🔴 HIGH' : req.priority === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW'} Priority`);
    parts.push(``);

    if (req.relatedCostPoolId) {
      const pool = diagnostic.costPools.find((p) => p.poolId === req.relatedCostPoolId);
      if (pool) {
        parts.push(`**Related cost pool:** ${pool.name} (${pool.totalBalance.toLocaleString()} ${pool.currency})`);
      }
    }

    for (const dataReq of req.requestedData) {
      parts.push(`**Data type:** ${dataReq.dataType}`);
      parts.push(`**Reason:** ${dataReq.reason}`);
      parts.push(`**Fields requested:** ${dataReq.fields.join(', ')}`);
      parts.push(``);
    }

    parts.push(`---`);
    parts.push(``);
  }

  return {
    title: 'Drill-Down Requests',
    content: parts.join('\n'),
    type: 'drilldown',
    requiresAttention: requests.some((r) => r.priority === 'HIGH'),
  };
}

function buildNextStepsSection(diagnostic: TbDiagnosticResult, register: OpportunityRegister): ReportSection {
  const parts: string[] = [];

  parts.push(`## Next Steps`);
  parts.push(``);

  const steps: string[] = [];

  // Step 1: Review high-priority drill-down requests
  const highPriorityRequests = diagnostic.drillDownRequests.filter((r) => r.priority === 'HIGH');
  if (highPriorityRequests.length > 0) {
    steps.push(`1. **Provide drill-down data for high-priority cost pools.** The following data is needed to complete the analysis:`);
    for (const req of highPriorityRequests) {
      for (const dataReq of req.requestedData) {
        steps.push(`   - ${dataReq.dataType}: ${dataReq.fields.join(', ')}`);
      }
    }
    steps.push(``);
  }

  // Step 2: Review calculated opportunities
  const calculatedOpps = register.opportunities.filter((o) => o.classification === 'CALCULATED_OPPORTUNITY');
  if (calculatedOpps.length > 0) {
    steps.push(`2. **Review calculated opportunities.** The following evidence-backed opportunities were identified:`);
    for (const opp of calculatedOpps) {
      steps.push(`   - **${opp.title}:** Potential saving of ${opp.savingOrProjection.toLocaleString()} ${opp.currency} (${opp.confidence * 100}% confidence)`);
    }
    steps.push(``);
  }

  // Step 3: Review scenarios
  const scenarios = register.opportunities.filter((o) => o.classification === 'SCENARIO' || o.classification === 'HYPOTHESIS');
  if (scenarios.length > 0) {
    steps.push(`3. **Validate scenarios.** The following scenarios are labelled assumptions and require validation before they can become savings:`);
    for (const scn of scenarios) {
      steps.push(`   - **${scn.title}:** Projected ${scn.savingOrProjection.toLocaleString()} ${scn.currency} (assumption: ${scn.methodology})`);
    }
    steps.push(``);
  }

  // Step 4: Schedule follow-up
  steps.push(`4. **Schedule follow-up analysis.** Once drill-down data is received, a follow-up analysis can:`);
  steps.push(`   - Identify vendor concentration and price variance`);
  steps.push(`   - Compute actual savings opportunities with greater precision`);
  steps.push(`   - Validate or refute the current scenarios`);
  steps.push(``);

  // Step 5: Outcome tracking
  steps.push(`5. **Track outcomes.** After implementing any changes, provide follow-up TB/AP data to verify realized savings. This enables the transition from CALCULATED OPPORTUNITY to VERIFIED SAVING.`);
  steps.push(``);

  parts.push(steps.join('\n'));

  return {
    title: 'Next Steps',
    content: parts.join('\n'),
    type: 'nextsteps',
    requiresAttention: true,
  };
}

function buildAppendixSection(diagnostic: TbDiagnosticResult, register: OpportunityRegister): ReportSection {
  const parts: string[] = [];

  parts.push(`## Appendix: Data Quality & Evidence`);
  parts.push(``);

  // Assertions
  if (diagnostic.assertions.length > 0) {
    parts.push(`### Evidence Assertions`);
    parts.push(``);
    parts.push(`The following assertions were made during the analysis, each with an evidence label:`);
    parts.push(``);

    for (const assertion of diagnostic.assertions) {
      const labelColor = assertion.evidenceLabel === 'DERIVED_FACT' ? '🔵' :
                        assertion.evidenceLabel === 'INFERENCE' ? '🟡' : '⚪';
      parts.push(`${labelColor} **[${assertion.evidenceLabel}]** (${assertion.confidence * 100}% confidence): ${assertion.statement}`);
      if (assertion.evidence.length > 0) {
        parts.push(`   Evidence: ${assertion.evidence.map(e => e.description).join('; ')}`);
      }
      parts.push(``);
    }
  }

  // Data quality notes
  if (diagnostic.assertions.some((a) => a.evidenceLabel === 'INFERENCE')) {
    parts.push(`### Inference Notes`);
    parts.push(``);
    parts.push(`The following inferences were made from the available data. These are interpretations, not facts, and should be validated with additional evidence where possible:`);
    parts.push(``);
    for (const assertion of diagnostic.assertions.filter((a) => a.evidenceLabel === 'INFERENCE')) {
      parts.push(`- ${assertion.statement}`);
      parts.push(``);
    }
  }

  return {
    title: 'Appendix',
    content: parts.join('\n'),
    type: 'appendix',
    requiresAttention: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function computeOverallConfidence(
  diagnostic: TbDiagnosticResult,
  register: OpportunityRegister
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // If we have high-confidence assertions and calculated opportunities, confidence is HIGH
  const highConfidenceAssertions = diagnostic.assertions.filter((a) => a.confidence >= 0.8);
  const calcOpps = register.opportunities.filter((o) => o.classification === 'CALCULATED_OPPORTUNITY');

  if (highConfidenceAssertions.length >= 3 && calcOpps.length >= 1) {
    return 'HIGH';
  }

  // If we have some confidence but limited data, MEDIUM
  if (highConfidenceAssertions.length >= 1 || calcOpps.length >= 1) {
    return 'MEDIUM';
  }

  // Otherwise LOW
  return 'LOW';
}

/**
 * Export report to plain text (for email, document, etc.)
 */
export function exportToText(report: ManagementReport): string {
  const parts: string[] = [];

  parts.push(`# ${report.title}`);
  parts.push(``);
  parts.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  if (report.hotelId) {
    parts.push(`**Hotel ID:** ${report.hotelId}`);
  }
  parts.push(`**Source system:** ${report.sourceSystem}`);
  parts.push(`**Currency:** ${report.currency}`);
  parts.push(`**Overall confidence:** ${report.overallConfidence}`);
  parts.push(``);

  // Data quality notes
  if (report.dataQualityNotes.length > 0) {
    parts.push(`### Data Quality Notes`);
    parts.push(``);
    for (const note of report.dataQualityNotes) {
      parts.push(`- ${note}`);
    }
    parts.push(``);
  }

  // Warnings
  if (report.warnings.length > 0) {
    parts.push(`### Warnings`);
    parts.push(``);
    for (const warning of report.warnings) {
      parts.push(`- ${warning}`);
    }
    parts.push(``);
  }

  // Executive summary
  parts.push(report.executiveSummary);
  parts.push(``);

  // Sections
  for (const section of report.sections) {
    parts.push(section.content);
    parts.push(``);
  }

  return parts.join('\n');
}

/**
 * Export report to JSON (for API responses, machine-readable output)
 */
export function exportToJson(report: ManagementReport): string {
  return JSON.stringify(report, null, 2);
}
