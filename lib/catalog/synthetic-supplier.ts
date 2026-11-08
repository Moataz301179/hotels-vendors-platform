/**
 * Synthetic supplier detection.
 *
 * Development and lifecycle test data is entered through the same supplier
 * submission path as real vendors, so `source: MANUAL` and
 * `isVerified: true` do NOT establish that a supplier is a real business.
 * These records carry machine-generated names and must never be presented as a
 * buyer-facing supply network.
 *
 * The check is deliberately conservative: it matches only unambiguous
 * machine-generated name shapes. It never deletes or mutates any record.
 */

const SYNTHETIC_NAME_PATTERNS: RegExp[] = [
  // "Supplier 4e25740960d14668ac7239668b485eb1"
  /^(?:other\s+)?supplier\s+[0-9a-f]{16,}$/i,
  // "HV E2E verification supplier"
  /e2e|verification supplier|test supplier|fixture supplier|demo supplier/i,
];

export function isSyntheticSupplierName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  return SYNTHETIC_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isSyntheticProductName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  return /lifecycle product|lifecycle towel|e2e verified receiving item|unreviewed product/i.test(trimmed);
}

export interface SupplierLike {
  name?: string | null;
}

/**
 * True only when the supplier appears to be a genuine, named business.
 * Synthetic and machine-generated suppliers are excluded from buyer results.
 */
export function isGenuineSupplier(supplier: SupplierLike | null | undefined): boolean {
  if (!supplier) return false;
  return !isSyntheticSupplierName(supplier.name);
}
