// lib/intelligence/graph/entity-resolution.ts
// Mandate §14 — Entity Resolution. One of the hardest + most valuable components.
// NOT a simple string match. Uses non-sensitive identifiers, relationships,
// temporal/geographic signals. Confidence-separated from assertion confidence.

import type { EntityReference, ConfidenceScore } from '../core/types';

export interface ResolutionCandidate {
  entityRef: Partial<EntityReference>;
  supportingSignals: string[];
  contradictionSignals?: string[];
  score: number;
}

export interface ResolutionEngineConfig {
  strictMode: boolean;  // when true, requires multiple signals; false = faster but lower confidence
  maxAliases: number;
}

export class EntityResolutionEngine {
  private config: ResolutionEngineConfig;

  constructor(config: ResolutionEngineConfig = { strictMode: true, maxAliases: 5 }) {
    this.config = config;
  }

  // This is a structural implementation — does NOT fabricate matches.
  // In production, feeds into graph database (see /docs/intelligence-graph-spec.md planned).
  resolve(
    candidates: ResolutionCandidate[],
  ): EntityReference | { resolved: false; reason: string; candidates: ResolutionCandidate[] } {
    if (candidates.length === 0) {
      return { resolved: false, reason: 'no_candidates', candidates };
    }
    // Strict-mode guard: mandate requires evidence, not guesses (§10)
    const best = candidates.sort((a, b) => b.score - a.score)[0];
    if (this.config.strictMode && best.score < 0.7) {
      return {
        resolved: false,
        reason: 'confidence_below_threshold_strict_mode',
        candidates,
      };
    }
    if (best.contradictionSignals && best.contradictionSignals.length > 0) {
      return {
        resolved: false,
        reason: 'contradictory_evidence_exists',
        candidates,
      };
    }
    return {
      resolvedId: `entity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      displayNames: [best.entityRef.displayNames?.[0] || 'unverified_entity'],
      aliases: best.entityRef.aliases || [],
      entityType: best.entityRef.entityType || 'HOTEL',
      identifiers: best.entityRef.identifiers || {},
      confidence: {
        value: best.score,
        reasoning: `Top signal: ${best.supportingSignals.join(', ')}`,
        evidenceCount: best.supportingSignals.length,
      },
      geographicSignals: best.entityRef.geographicSignals,
      temporalSignals: best.entityRef.temporalSignals || { firstSeen: new Date().toISOString(), lastUpdated: new Date().toISOString() },
    };
  }
}
