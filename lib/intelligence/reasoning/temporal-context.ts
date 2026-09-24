/**
 * Temporal Contextual Reasoning
 */
export interface TemporalContext {
  findingId: string;
  entityId: string;
  entityName: string;
  temporalObservation: string;
  evidenceChangeCount: number;
  relationshipChanges: RelationshipChange[];
  reasoning: string;
  provenanceReferences: string[];
  confidenceScore: number;
  createdAt: Date;
}

export interface RelationshipChange {
  edgeId: string;
  relationshipType: string;
  validFrom: string;
  validTo: string | null;
  status: string;
}

export function buildTemporalContextSimple(
  entityId: string,
  entityName: string,
  relationshipChanges: RelationshipChange[]
): TemporalContext {
  return {
    findingId: entityId,
    entityId,
    entityName,
    temporalObservation: `${relationshipChanges.length} relationship(s) for entity`,
    evidenceChangeCount: 0,
    relationshipChanges,
    reasoning: 'Temporal context derived from evidence retrieval sequence',
    provenanceReferences: [],
    confidenceScore: 0.7,
    createdAt: new Date(),
  };
}
