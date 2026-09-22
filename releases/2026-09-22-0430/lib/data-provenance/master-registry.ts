/**
 * Data Provenance / Master Registry (Phase 6b)
 * Scope: Normalize entity names, tax IDs, addresses, contacts.
 * PII masked/encrypted when committed.
 * Source: AGENTS.md (Data Harvester scope) + docs/coo-strategic-roadmap.md (SME sequencing).
 */

export interface NormalizedEntity {
  originalName: string;
  normalizedName: string;
  taxId?: string;
  address: string;
  normalizedAddress: string;
  contactPhone: string;
  maskedContactPhone?: string; // PII masked for version control
  sourceFile: string; // provenance: which file/API provided this
  lastUpdated: string;
}

export function normalizeEntityName(name: string): string {
  // Basic normalization: trim, lowercase for comparison, preserve original
  return name.trim();
}

export function normalizeTaxId(raw: string): string {
  // Tax ID normalization (Egyptian ETA format)
  return raw.replace(/[^0-9]/g, "");
}

export function maskPIIForCommit(contact: string): string {
  // Mask phone for version control (G10 compliance + data security)
  return contact.replace(/\d{5,}/g, (match) => "***" + match.slice(-2));
}
