// lib/intelligence/adaptive/window-expansion.ts
// Mandate §8 — every significant finding generates new investigation seeds.
// Not a crawler following URLs. A graph-following investigator (§4, §8, §12).

import type { WindowDefinition, InvestigationState } from './investigation-engine';

export interface ExpansionResult {
  newSeeds: string[];
  expandedWindows: WindowDefinition[];
  reason: string;
}

export class WindowExpansionEngine {
  // Given a finding (as a resolved entity or exposure window), generate new seeds
  expandFromFinding(
    findingCategory: 'SECURITY_EXPOSURE' | 'COMMERCIAL_SIGNAL' | 'RELATIONSHIP' | 'ENTITY_RESOLUTION',
    entityReferenceId: string,
    observedPath: string[],
  ): ExpansionResult {
    const seeds: string[] = [];
    const windows: WindowDefinition[] = [];

    // §8 — example: supplier discovery creates hotel/group seeds
    if (findingCategory === 'RELATIONSHIP') {
      seeds.push(`entity:${entityReferenceId}:related_entities`);
      seeds.push(`entity:${entityReferenceId}:supplier_network`);
      windows.push({
        surfaceId: `expanded:${entityReferenceId}:network`,
        surfaceType: 'THIRD_PARTY',
        observedPath: [...observedPath, 'network_expansion'],
        informationRevealed: ['potential supplier relationships', 'technology relationships'],
        relationshipSeeds: seeds,
        authorizationLevel: 'PASSIVE',
      });
    }

    // §8 — security exposure creates deeper investigation paths (with authorization gate)
    if (findingCategory === 'SECURITY_EXPOSURE') {
      seeds.push(`entity:${entityReferenceId}:related_infrastructure`);
      seeds.push(`entity:${entityReferenceId}:document_association`);
      windows.push({
        surfaceId: `expanded:${entityReferenceId}:security_context`,
        surfaceType: 'TECHNICAL_INFRASTRUCTURE',
        observedPath: [...observedPath, 'security_expansion'],
        informationRevealed: ['infrastructure relationships', 'potential document links'],
        relationshipSeeds: seeds,
        authorizationLevel: 'NON_INTRUSIVE',
      });
    }

    if (findingCategory === 'COMMERCIAL_SIGNAL') {
      seeds.push(`entity:${entityReferenceId}:procurement_category`);
      seeds.push(`entity:${entityReferenceId}:alternative_suppliers`);
    }

    return {
      newSeeds: seeds.slice(0, 3), // limit per §24 / engine config
      expandedWindows: windows,
      reason: `Finding ${findingCategory} on entity ${entityReferenceId} generates new investigation paths (§8)`,
    };
  }
}
