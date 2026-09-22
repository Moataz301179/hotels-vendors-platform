// lib/intelligence/adaptive/relationship-discovery.ts
// Mandate §12 — Relationship Discovery engine.
// Evidence-backed, time-aware relationships (§12). Not guesswork (§26).

export interface RelationshipEvidence {
  sourceProvenance: string; // adapter + ingestion reference (§13)
  evidenceHash: string;
  observedPath: string[];   // investigation path (§4)
  confidence: number;       // 0.0-1.0
  temporalFirstSeen: string;
  temporalLastUpdated?: string;
}

export interface EntityRelationship {
  fromEntityId: string;
  toEntityId: string;
  relationshipType: 'OWNS' | 'OPERATES' | 'SUPPLIES' | 'PURCHASES_FROM' | 'COMPETES_WITH' | 'FINANCES' | 'USES_TECHNOLOGY' | 'MENTIONED_IN_DOCUMENT' | 'POTENTIALLY_NEEDS' | 'POTENTIALLY_BENEFITS_FROM'; // §15 relationship types
  evidence: RelationshipEvidence[];
  firstObserved: string;
  lastUpdated?: string;
  authorizationRequired?: boolean; // relationships derived from non-public sources (§11)
}

export class RelationshipDiscoveryEngine {
  private relationships: Map<string, EntityRelationship[]> = new Map(); // key: fromEntityId

  // Evidence-backed only (§26 — no fabricated relationships)
  discoverRelationship(fromId: string, toId: string, type: string, evidence: RelationshipEvidence): boolean {
    if (!evidence.sourceProvenance || evidence.confidence < 0.5) {
      return false; // strict threshold (§14) — no weak links in graph
    }
    if (!this.relationships.has(fromId)) this.relationships.set(fromId, []);
    const list = this.relationships.get(fromId)!;
    // Avoid duplicate relationship with same evidence hash
    const exists = list.some(r => r.toEntityId === toId && r.relationshipType === type && r.evidence.some(e => e.evidenceHash === evidence.evidenceHash));
    if (exists) return false;
    const rel: EntityRelationship = {
      fromEntityId: fromId,
      toEntityId: toId,
      relationshipType: type as any,
      evidence: [evidence],
      firstObserved: evidence.temporalFirstSeen,
      lastUpdated: evidence.temporalLastUpdated || evidence.temporalFirstSeen,
    };
    list.push(rel);
    return true;
  }

  getRelationships(fromId: string): EntityRelationship[] {
    return this.relationships.get(fromId) || [];
  }

  getAllRelationships(): EntityRelationship[] {
    const all: EntityRelationship[] = [];
    for (const list of this.relationships.values()) {
      all.push(...list);
    }
    return all;
  }
}
