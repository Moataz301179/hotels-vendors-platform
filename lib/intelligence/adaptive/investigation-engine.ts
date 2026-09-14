// lib/intelligence/adaptive/investigation-engine.ts
// Mandate §4 (Adaptive Investigation Loop) — NOT a fixed linear scraper.
// §7 (Exposure Window) — each discovery is an investigation seed.
// §8 (Window Expansion) — findings generate new seeds continuously.

import type { IntelligenceAssertion, FindingCategory, SourceProvenance } from '../core/types';

export interface InvestigationState {
  seedId: string;           // initial observation or previous finding
  depth: number;             // how deep in expansion loop
  observedSurfaces: string[]; // categories: WEB, APPLICATION, AI_INTERFACE, DOCUMENT, TECHNICAL, HUMAN, THIRD_PARTY (§5)
  generatedHypotheses: string[];
  collectedEvidence: IntelligenceAssertion[];
  resolvedEntities: string[];
  nextSeeds: string[];       // new investigation seeds (§8)
  maxDepthReached: number;
}

export interface WindowDefinition {
  surfaceId: string;
  surfaceType: 'WEB_PAGE' | 'APPLICATION' | 'AI_INTERFACE' | 'DOCUMENT' | 'TECHNICAL_INFRASTRUCTURE' | 'HUMAN_SIGNAL' | 'THIRD_PARTY';
  observedPath: string[];      // investigation path that led here
  informationRevealed: string[]; // what this window reveals (§7)
  relationshipSeeds: string[];  // new entities or surfaces it points to (§8)
  authorizationLevel: 'PASSIVE' | 'PUBLIC_DOCUMENT' | 'NON_INTRUSIVE' | 'AUTHORIZED';
}

export interface AdaptiveInvestigationConfig {
  maxDepth: number;         // prevent infinite expansion (§24 — don't overbuild loops)
  maxSeedsPerIteration: number;
  authorizationRequiredForDepthAbove: number; // deeper = more sensitive (§11)
}

export class AdaptiveInvestigationEngine {
  private config: AdaptiveInvestigationConfig;

  constructor(config: AdaptiveInvestigationConfig = { maxDepth: 4, maxSeedsPerIteration: 3, authorizationRequiredForDepthAbove: 2 }) {
    this.config = config;
  }

  // §4 loop implementation — each call advances one loop cycle, not full crawl
  runCycle(state: InvestigationState, newWindow?: WindowDefinition): InvestigationState {
    const updated = { ...state, depth: state.depth + 1 };

    if (newWindow) {
      updated.observedSurfaces = [...updated.observedSurfaces, newWindow.surfaceType];
      // §8 — window expansion: new seeds from relationships and revealed surfaces
      updated.nextSeeds = [
        ...updated.nextSeeds,
        ...newWindow.relationshipSeeds.slice(0, this.config.maxSeedsPerIteration),
      ];
      // Generate hypotheses from revealed information (§4 — "generate hypotheses")
      updated.generatedHypotheses = [
        ...updated.generatedHypotheses,
        ...newWindow.informationRevealed.map(i => `Hypothesis from ${newWindow.surfaceType}: ${i}`),
      ];
      updated.maxDepthReached = Math.max(updated.maxDepthReached, updated.depth);
    }

    // §11 security: deeper investigation may require authorization
    if (updated.depth > this.config.authorizationRequiredForDepthAbove) {
      // Engine does NOT automatically proceed — requires registered authorization scope (§11)
      // This is structural: authorization check must happen before deeper collection
      return { ...updated, nextSeeds: [] }; // halt without authorization
    }

    // Prevent unbounded loop (§24 — no overbuild loops; §26 — no unnecessary complexity)
    if (updated.depth > this.config.maxDepth || updated.maxDepthReached > this.config.maxDepth) {
      return { ...updated, nextSeeds: [] };
    }

    return updated;
  }

  // §6 AI-MEDIATED SURFACES — treat AI interfaces as first-class discovery
  describeAISurface(window: WindowDefinition): Record<string, unknown> {
    if (window.surfaceType !== 'AI_INTERFACE') return {};
    // High-level architecture observation only (§6 — no unauthorized access)
    return {
      surfaceType: 'AI_INTERFACE',
      appearsToKnow: 'categories inferred from interaction scope',
      businessFunctionsRepresented: 'derived from interface context',
      systemsRepresented: 'indicated by response patterns',
      authorizationNote: 'systematic boundary evaluation requires authorized scope (§11)',
      furtherInvestigationPaths: window.relationshipSeeds,
    };
  }
}
