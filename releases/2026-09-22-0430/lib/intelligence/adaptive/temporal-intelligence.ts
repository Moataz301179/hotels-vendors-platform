// lib/intelligence/adaptive/temporal-intelligence.ts
// Mandate §14 — understand change over time. Not current-state only.
// First observed / last observed / previous state / current state / change / significance.

export interface TemporalRecord {
  entityRefId: string;
  observationType: string; // e.g. 'DOCUMENT', 'DOMAIN', 'SUPPLIER', 'AI_INTERFACE'
  firstObserved: string;    // ISO timestamp
  lastUpdated: string;
  previousStateSnapshot?: Record<string, unknown>;
  currentStateSnapshot: Record<string, unknown>;
  changeDetected?: {
    changedFields: string[];
    significance: 'LOW' | 'MEDIUM' | 'HIGH'; // §14 — significance, not just presence
    reason: string;
    timestamp: string;
  };
}

export interface TemporalIntelligenceService {
  recordObservation(refId: string, snapshot: Record<string, unknown>, observationType: string): TemporalRecord;
  detectChange(refId: string, newSnapshot: Record<string, unknown>): TemporalRecord | { noChange: true };
  getHistory(refId: string): TemporalRecord[];
}

export class TemporalIntelligenceServiceImpl implements TemporalIntelligenceService {
  private store: Map<string, TemporalRecord[]> = new Map();

  recordObservation(refId: string, snapshot: Record<string, unknown>, observationType: string): TemporalRecord {
    const history = this.store.get(refId) || [];
    const last = history[history.length - 1];
    const now = new Date().toISOString();

    const record: TemporalRecord = {
      entityRefId: refId,
      observationType,
      firstObserved: last ? last.firstObserved : now,
      lastUpdated: now,
      previousStateSnapshot: last ? last.currentStateSnapshot : undefined,
      currentStateSnapshot: snapshot,
    };

    const changedFields = last ? Object.keys(snapshot).filter(
      k => JSON.stringify(last.currentStateSnapshot[k]) !== JSON.stringify(snapshot[k])
    ) : [];

    if (changedFields.length > 0 && last) {
      record.changeDetected = {
        changedFields,
        significance: 'MEDIUM', // default; can be elevated by caller (§14)
        reason: `Fields changed: ${changedFields.join(', ')}`,
        timestamp: now,
      };
    }

    history.push(record);
    this.store.set(refId, history);
    return record;
  }

  detectChange(refId: string, newSnapshot: Record<string, unknown>): TemporalRecord | { noChange: true } {
    const history = this.store.get(refId);
    if (!history || history.length === 0) return { noChange: true };
    return this.recordObservation(refId, newSnapshot, history[history.length - 1].observationType);
  }

  getHistory(refId: string): TemporalRecord[] {
    return this.store.get(refId) || [];
  }
}
