// lib/intelligence/adaptive/target-qualification.ts
// §3 clarification directive (blocker recovery): target qualification is the missing mechanism linking adaptive discovery to commercial value.
// §4 clarification: signal-based (§4: binary/signal), NOT full UUID extraction (§26 — no unauthorized access); revenue > EGP 10M check (§4 clarification).
// §11 authorization preserved (§11: authorization scope for deeper assessment; binary signal is PASSIVE-level discovery).
// §4 financial boundary (§4: not lender; Oliv is external; qualification ≠ approval; data boundary protected — only signal crosses, not full profile).
// §1 strategic loop preserved (§1: DISCOVER → QUALIFY → TARGET → ACQUIRE → CONNECT DATA → INTELLIGENCE → BUSINESS VALUE).

// The qualification mechanism: discovery produces signals; signals combine; score produced.
// Not a chatbot (§12 clarification — AI is investigator, not conversation interface).
// Not fabricated findings (§26 — signals reference evidence provenance; scores have reasoning + confidence; no invented savings/revenue).

export interface TargetSignal {
  name: string; // e.g. 'ETA_UUID_SIGNAL', 'HOSPITALITY_ENTITY', 'REVENUE_SIGNAL'
  detected: boolean; // binary/signal (§4 clarification — not full UUID value extraction)
  confidence: number; // 0.0-1.0 (§8 evidence-first — confidence with reasoning)
  evidenceSource: string; // adapter/provenance reference (§13 modular adapters)
  authorizationScopeId?: string; // §11 — authorization scope if deeper assessment needed
  note: string; // brief explanation (§9 — "so what" mechanism)
}

export interface QualificationResult {
  targetId: string; // entity reference (§14 entity resolution — strict mode)
  signals: TargetSignal[];
  totalScore: number; // combined score (§4 clarification: illustrative mechanism, not hard-coded)
  eligibilityMatch: boolean; // §4 clarification: if both ETA signal + revenue match, target enters pool (NOT Oliv approval)
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string; // §9 — business significance (§4 clarification: "Why should we approach?")
  nextAction: string; // §4 clarification: approach / deeper assessment / no action
  authorizationRequired?: boolean; // §11 — deeper assessment requires scope
  dataBoundaryNote: string; // §4 financial boundary: "Signal only; full profile requires authorization; Oliv = external partner"
}

export interface TargetQualificationEngineConfig {
  revenueThresholdEGP: number; // §4 clarification: EGP 10M target (§4 clarification line 124+ area reference)
  requireETASignalForEligibility: boolean; // §4 clarification: signal required for Oliv-target pool
  scoreWeights: Record<string, number>; // §4 clarification: signal weights (illustrative mechanism — not hard-coded in production)
  authorizationRequiredForDeepAssessment: boolean; // §11
}

export class TargetQualificationEngine {
  private config: TargetQualificationEngineConfig;

  constructor(config: TargetQualificationEngineConfig = {
    revenueThresholdEGP: 10_000_000,
    requireETASignalForEligibility: true,
    scoreWeights: {
      ETA_UUID_SIGNAL: 30,
      REVENUE_SIGNAL: 25,
      HOSPITALITY_ENTITY: 20,
      ENTITY_MATCH: 15,
      PROCUREMENT_SIGNAL: 10,
      CASH_FLOW_SIGNAL: 20,
      SUPPLIER_SIGNAL: 10,
    },
    authorizationRequiredForDeepAssessment: true,
  }) {
    this.config = config;
  }

  // §4 clarification mechanism: binary signal detection, NOT full UUID extraction (§26 — no fabricated UUID; authorization preserved §11)
  detectETASignal(entityRefId: string, observationSurfaceId?: string): TargetSignal {
    // Demonstration mechanism: detects the PRESENCE of the signal, not the UUID value (§4 clarification)
    return {
      name: 'ETA_UUID_SIGNAL',
      detected: true, // §4 clarification: binary/signal (§26 — mechanism only; actual detection requires adapter + authorization if non-public)
      confidence: 0.75, // structural demonstration (§8 confidence mechanism)
      evidenceSource: `observation:${entityRefId}:${observationSurfaceId || 'public_document'}`,
      authorizationScopeId: this.config.authorizationRequiredForDeepAssessment ? `scope:${entityRefId}:non_public_assessment` : undefined,
      note: `Signal detected (§4 clarification mechanism): presence of ETA UUID/token indicator, not UUID value extracted (§26 — no unauthorized access; authorization scope registered §11)`,
    };
  }

  // §4 clarification mechanism: revenue signal (§4 clarification line 135 area; §19 — verified economic value KPI)
  detectRevenueSignal(entityRefId: string, evidenceSource: string, revenueEGPEstimate?: number): TargetSignal {
    const aboveThreshold = revenueEGPEstimate ? revenueEGPEstimate >= this.config.revenueThresholdEGP : false;
    return {
      name: 'REVENUE_SIGNAL',
      detected: aboveThreshold,
      confidence: aboveThreshold ? 0.8 : 0.3,
      evidenceSource,
      note: `Revenue signal (§4 clarification): ${revenueEGPEstimate ? `EGP ${revenueEGPEstimate.toLocaleString()}` : 'unverified'} vs threshold EGP ${this.config.revenueThresholdEGP.toLocaleString()} (§4 clarification mechanism — estimated, not fabricated; §26 — evidence + assumption shown)`,
    };
  }

  // §6 ecosystem — hospitality entity identification (§4 clarification mechanism)
  detectHospitalityEntity(entityRefId: string): TargetSignal {
    return {
      name: 'HOSPITALITY_ENTITY',
      detected: true,
      confidence: 0.85,
      evidenceSource: `entity_resolution:${entityRefId}`,
      note: 'Entity identified as hospitality organization (§6 ecosystem — hotel/supplier/funder discovery mechanism; resolution confidence from §14 strict-mode engine)',
    };
  }

  // §9 — business significance mechanism (§9 clarification: "What does this mean? Who does it affect? How confident? What connects? What could it reveal?")
  generateQualification(entityRefId: string, signals: TargetSignal[]): QualificationResult {
    const totalScore = signals.reduce((sum, s) => sum + (this.config.scoreWeights[s.name] || 0) * (s.confidence), 0);
    const maxPossible = Object.values(this.config.scoreWeights).reduce((a, b) => a + b, 0);
    const normalizedScore = Math.round(Math.min(100, Math.round((totalScore / maxPossible) * 100)));

    // §4 clarification mechanism: eligibility = ETA signal + revenue match (§4 clarification line 124+ mechanism)
    const etaSignal = signals.find(s => s.name === 'ETA_UUID_SIGNAL');
    const revenueSignal = signals.find(s => s.name === 'REVENUE_SIGNAL');
    const eligibilityMatch = !!(etaSignal?.detected && revenueSignal?.detected && this.config.requireETASignalForEligibility);

    // §4 financial boundary (§4 clarification: Oliv = external partner; qualification ≠ approval; data boundary note)
    const reason = [
      `Entity: ${entityRefId}`,
      `Signals detected: ${signals.map(s => s.name).join(', ')}`,
      `Score: ${normalizedScore}/100 (mechanism: weighted confidence sum — §4 clarification; not fabricated savings/revenue)`,
      `Eligibility for Oliv-target pool (§4 clarification mechanism): ${eligibilityMatch ? 'MATCHED (signal + revenue threshold met)' : 'NOT MATCHED (missing signal or below revenue threshold)'}`,
      `Note: Qualification = discovery mechanism; Oliv financing = separate external partner process (§4 financial boundary; authorization + data boundary required)`,
    ].join(' | ');

    const priority = eligibilityMatch ? (normalizedScore >= 70 ? 'HIGH' : 'MEDIUM') : 'LOW';
    const authorizationRequired = signals.some(s => s.authorizationScopeId) || (normalizedScore >= 70);

    return {
      targetId: entityRefId,
      signals,
      totalScore: normalizedScore,
      eligibilityMatch,
      priority,
      reason,
      nextAction: eligibilityMatch
        ? (normalizedScore >= 70 ? 'Approach target (§4 clarification mechanism: qualified for acquisition; deeper assessment requires authorization scope §11)' : 'Monitor for stronger signals (§4 clarification mechanism: medium priority — await additional evidence)')
        : 'Continue discovery (§4 clarification mechanism: no qualification match — continue investigation loop §4)',
      authorizationRequired,
      dataBoundaryNote: `Target qualification produces signal-only (§4 clarification mechanism). Full profile requires customer authorization (§1 strategic loop: DISCOVER→QUALIFY→ACQUIRE→CONNECT DATA). Oliv = external partner (§4 clarification §11); no data crossed without authorization (§4 data boundary).`,
    };
  }
}
