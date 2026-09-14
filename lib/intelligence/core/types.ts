// lib/intelligence/core/types.ts
// Black-Box Intelligence Layer — Type Foundation
// Mandate §3, §8, §10, §14, §15 — evidence-first, provenance-tracked

export interface SourceProvenance {
  source: string;       // adapter/module name (not external URL exposed in findings)
  timestamp: string;     // ISO 8601
  adapterVersion: string;
  ingestionId: string;   // traceable back to adapter log only
  evidenceHash: string;  // SHA-256 of raw evidence (immutable reference)
  accessType: 'PASSIVE' | 'PUBLIC_DOCUMENT' | 'METADATA' | 'AUTHORIZED';
}

export interface ConfidenceScore {
  value: number;         // 0.0 - 1.0
  reasoning: string;     // brief explanation
  evidenceCount: number;
  contradictingEvidence?: number;
}

export type FindingCategory =
  | 'SECURITY_EXPOSURE'     // Primary per decision C
  | 'OPERATIONAL_SIGNAL'
  | 'COMMERCIAL_SIGNAL'
  | 'FINANCIAL_SIGNAL'
  | 'RELATIONSHIP'
  | 'ENTITY_RESOLUTION'
  | 'ANOMALY';

export interface IntelligenceAssertion {
  id: string;
  category: FindingCategory;
  entityId: string;       // resolved entity reference (not raw name)
  statement: string;      // what was observed
  inferenceType: 'FACT' | 'INFERENCE' | 'HYPOTHESIS';  // mandate §10
  confidence: ConfidenceScore;
  provenance: SourceProvenance;
  impactEstimate?: {      // mandate §5 — quantified, never fabricated
    low: number;
    high: number;
    currency: 'EGP' | 'USD';
    basis: string;         // what assumption drives range
  };
  recommendedAction?: string;
  createdAt: string;
  updatedAt?: string;
}

// Entity Resolution — mandate §14
export interface EntityReference {
  resolvedId: string;
  displayNames: string[];  // e.g. "ABC Hotel", "ABC Hospitality LLC"
  aliases: string[];
  entityType: 'HOTEL' | 'SUPPLIER' | 'FUNDER' | 'OWNER' | 'BRAND' | 'PROPERTY' | 'DOCUMENT' | 'DOMAIN' | 'TECHNOLOGY';
  identifiers: Record<string, string>; // non-sensitive only
  confidence: ConfidenceScore;         // resolution confidence, separate from assertion confidence
  geographicSignals?: { country: string; region?: string; city?: string };
  temporalSignals?: { firstSeen: string; lastUpdated: string };
}
