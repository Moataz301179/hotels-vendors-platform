// lib/intelligence/security/authorized-testing.ts
// Mandate §11 — Security Intelligence with explicit authorization controls
// Separates: PASSIVE DISCOVERY / PUBLIC EXPOSURE / NON-INTRUSIVE VALIDATION / AUTHORIZED ACTIVE TESTING
// No autonomous exfiltration (§26). Scope + authorization + timestamp preserved.

import type { SourceProvenance, IntelligenceAssertion, FindingCategory } from '../core/types';

export interface AuthorizedTestingScope {
  scopeId: string;
  authorizedBy: string;        // user/entity that granted authorization
  authorizationDocumentRef?: string; // internal reference only
  targetEntityIds: string[];
  permittedActions: ('PASSIVE_DISCOVERY' | 'PUBLIC_DOCUMENT' | 'NON_INTRUSIVE_VALIDATION' | 'AUTHORIZED_ACTIVE')[];
  forbiddenActions: string[]; // explicit exclusions
  validFrom: string;
  validUntil?: string;
  auditOnly: boolean;          // if true, no automated action; evidence only
}

export interface SecurityFindingEvidence {
  assertion: IntelligenceAssertion;
  scope: AuthorizedTestingScope | null; // null = passive/public only (no authorization needed)
  evidenceIntegrityHash: string;
  remediationStatus?: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'REMEDIATED';
}

export class SecurityIntelligenceController {
  // Mandate: system must never become an uncontrolled autonomous exfiltration mechanism (§21, §26)
  private activeScopes: Map<string, AuthorizedTestingScope> = new Map();

  constructor() {}

  registerScope(scope: AuthorizedTestingScope): boolean {
    // Basic authorization validation — production version connects to auth/session
    if (!scope.authorizedBy || scope.authorizedBy.trim().length === 0) {
      return false;
    }
    if (scope.targetEntityIds.length === 0) {
      return false;
    }
    this.activeScopes.set(scope.scopeId, scope);
    return true;
  }

  evaluateFinding(
    assertion: IntelligenceAssertion,
    scopeId?: string,
  ): SecurityFindingEvidence | { blocked: true; reason: string } {
    const scope = scopeId ? this.activeScopes.get(scopeId) || null : null;

    // If category requires authorization and none provided → block (§11)
    if (assertion.category === 'SECURITY_EXPOSURE' && !scope && assertion.inferenceType !== 'FACT') {
      // Passive public facts allowed without scope; anything requiring inference/test requires authorization
      if (assertion.provenance.accessType === 'AUTHORIZED' || assertion.provenance.accessType === 'METADATA') {
        return { blocked: true, reason: 'scope_required_for_non_intrusive_or_active_assessment' };
      }
    }

    // Ensure scope covers permitted action
    if (scope && assertion.provenance.accessType) {
      // Map accessType to corresponding permittedAction
      const accessToAction: Record<string, string> = {
        'PASSIVE': 'PASSIVE_DISCOVERY',
        'PUBLIC_DOCUMENT': 'PUBLIC_DOCUMENT',
        'METADATA': 'NON_INTRUSIVE_VALIDATION',
        'AUTHORIZED': 'AUTHORIZED_ACTIVE',
      };
      const requiredAction = accessToAction[assertion.provenance.accessType];
      if (requiredAction && !scope.permittedActions.includes(requiredAction as any)) {
        return { blocked: true, reason: 'scope_does_not_authorize_access_type' };
      }
    }

    return {
      assertion,
      scope: scope || null,
      evidenceIntegrityHash: assertion.provenance.evidenceHash,
      remediationStatus: 'PENDING',
    };
  }
}
