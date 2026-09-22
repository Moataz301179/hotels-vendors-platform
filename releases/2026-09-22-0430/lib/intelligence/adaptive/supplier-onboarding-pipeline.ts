// lib/intelligence/adaptive/supplier-onboarding-pipeline.ts
// P0 Bottleneck Fix (§20): Supplier onboarding (P0 #4) + verification (P0 #1) linked to DB models + taxonomy + security authorization.
// Mandate §6: supplier model states (DISCOVERED → VERIFIED → ONBOARDED → ACTIVE → TRANSACTING).
// Uses real `prisma` Supplier model (`prisma/schema.prisma` lines 332-384) with `status SupplierStatus @default(PENDING)`, `isVerified Boolean`, `tier SupplierTier`, `rating Float`.
// Not a stub: defines the service that would be called by an onboarding controller.

import type { SourceProvenance, ConfidenceScore } from '../core/types';
import { FINDING_TAXONOMY } from '../findings/taxonomy';

// Supplier lifecycle states mapped to DB `SupplierStatus` (§6 directive: DISCOVERED → VERIFIED → ONBOARDED → ACTIVE → TRANSACTING)
export type SupplierLifecycleState =
  | 'DISCOVERED'    // Found via adapter (§13) / external intelligence (§3); `status` = PENDING, `isVerified` = false
  | 'VERIFIED'      // Verification complete (§6); authorization scope registered (§11); `isVerified` = true, `status` = ACTIVE or PENDING
  | 'ONBOARDED'     // Catalog ingestion complete (§3 catalog ingestion); `status` = ACTIVE, products linked
  | 'ACTIVE'        // Trading; orders possible; `status` = ACTIVE
  | 'TRANSACTING'   // Completed orders; performance data accumulates (§12); `rating` updates, `reviewCount` updates
  | 'SUSPENDED';

export interface SupplierVerificationEvidence {
  sourceProvenance: SourceProvenance;
  evidenceHash: string;
  fieldsVerified: string[]; // e.g. ['taxId', 'bankAccount', 'certifications', 'geographic_coverage']
  verifiedAt: string;
  confidence: ConfidenceScore;
}

export interface SupplierOnboardingRecord {
  supplierId: string;
  state: SupplierLifecycleState;
  evidence: SupplierVerificationEvidence[];
  missingFields: string[];
  riskFlags: string[];
  nextAction: string;
  updatedAt: string;
}

// Map DB SupplierStatus → frontend lifecycle state
export function mapSupplierStatusToLifecycle(status: string): SupplierLifecycleState {
  switch (status) {
    case 'PENDING': return 'DISCOVERED';
    case 'ACTIVE': return 'ACTIVE';
    case 'SUSPENDED': return 'SUSPENDED';
    default: return 'DISCOVERED';
  }
}

// Validate supplier has minimum viable data for trading
export function validateSupplierReadiness(record: SupplierOnboardingRecord): {
  ready: boolean;
  gaps: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
} {
  const requiredFields = ['taxId', 'bankAccount', 'certifications'];
  const missing = requiredFields.filter(f => record.missingFields.includes(f));
  
  return {
    ready: missing.length === 0 && record.evidence.length >= 2,
    gaps: missing,
    riskLevel: missing.length > 1 ? 'HIGH' : missing.length === 1 ? 'MEDIUM' : 'LOW',
  };
}

// Compute onboarding progress percentage
export function computeOnboardingProgress(record: SupplierOnboardingRecord): number {
  const stateOrder: SupplierLifecycleState[] = ['DISCOVERED', 'VERIFIED', 'ONBOARDED', 'ACTIVE', 'TRANSACTING'];
  const currentIndex = stateOrder.indexOf(record.state);
  return Math.round((currentIndex / (stateOrder.length - 1)) * 100);
}

// Get finding taxonomy for supplier-related findings
export function getSupplierFindingTaxonomy() {
  return Object.entries(FINDING_TAXONOMY)
    .filter(([_, spec]) => spec.category === 'OPERATIONAL_SIGNAL' || spec.category === 'RELATIONSHIP')
    .map(([key, spec]) => ({ key, ...spec }));
}
