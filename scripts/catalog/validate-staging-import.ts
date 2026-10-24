/**
 * Validates a supplier-neutral HoReCa master-catalogue import before it can
 * enter a staging database. This is intentionally offline: it does not scrape,
 * invent products, or publish anything.
 *
 * Run: npx tsx scripts/catalog/validate-staging-import.ts path/to/import.json
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

type TaxCodeScheme = 'EGS' | 'GS1' | 'HV_INTERNAL';
type ImportRow = {
  itemName?: unknown; categoryCode?: unknown; subcategoryCode?: unknown;
  technicalSpecs?: unknown; imageUrls?: unknown; imageRightsStatus?: unknown;
  defaultMoq?: unknown; egsCode?: unknown; taxCodeScheme?: unknown;
  attributionSource?: unknown; sourceRecordKey?: unknown; sourceObservedAt?: unknown;
};
type ValidationResult = { valid: boolean; normalizedKey?: string; errors: string[] };

const consumerRetailTerms = /\b(shortbread|fisherman'?s\s+pie|nature\s+valley|demerara|snack\s*bar|single[- ]serve\s+retail)\b/i;
// A supplier-neutral catalogue can be authored from first-party operating
// specifications.  That is distinct from copying a public supplier catalogue:
// the latter still requires an explicit cleared source policy before staging.
const sourcePermission = new Set(['INTERNALLY_AUTHORED', 'PERMITTED', 'OPEN_LICENSED', 'VENDOR_AUTHORIZED']);

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const isObject = (value: unknown) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function validateStagingRow(row: ImportRow, allowedCategoryCodes: Set<string>, accessPolicy: string): ValidationResult {
  const errors: string[] = [];
  const itemName = text(row.itemName);
  const categoryCode = text(row.categoryCode).toUpperCase();
  const subcategoryCode = text(row.subcategoryCode).toUpperCase();
  const scheme = text(row.taxCodeScheme).toUpperCase() as TaxCodeScheme;
  const egsCode = text(row.egsCode);
  const moq = Number(row.defaultMoq);

  if (!sourcePermission.has(accessPolicy)) errors.push('source access policy is not cleared for staging');
  if (itemName.length < 2) errors.push('itemName is required');
  if (consumerRetailTerms.test(itemName)) errors.push('consumer-retail item is not an allowed HoReCa reference');
  if (!allowedCategoryCodes.has(categoryCode)) errors.push('categoryCode is not in the controlled taxonomy');
  if (!subcategoryCode) errors.push('subcategoryCode is required');
  if (!isObject(row.technicalSpecs) || Object.keys(row.technicalSpecs).length === 0) errors.push('technicalSpecs must be a non-empty object');
  if (!Number.isInteger(moq) || moq < 1) errors.push('defaultMoq must be a positive integer');
  if (!['EGS', 'GS1', 'HV_INTERNAL'].includes(scheme)) errors.push('taxCodeScheme must be EGS, GS1, or HV_INTERNAL');
  if ((scheme === 'GS1' && !/^\d{8,14}$/.test(egsCode)) || (scheme === 'EGS' && egsCode.length < 3) || (scheme === 'HV_INTERNAL' && !/^HV-[A-Z0-9][A-Z0-9-]{4,63}$/.test(egsCode))) errors.push('egsCode does not match its declared scheme');
  if (!text(row.attributionSource)) errors.push('attributionSource is required');
  if (Number.isNaN(new Date(text(row.sourceObservedAt)).valueOf())) errors.push('sourceObservedAt must be a valid date');
  if (!Array.isArray(row.imageUrls) || row.imageUrls.some((url) => typeof url !== 'string' || !/^https:\/\//i.test(url))) errors.push('imageUrls must contain only reviewed HTTPS media URLs');
  if (!['CLEARED', 'NOT_PROVIDED'].includes(text(row.imageRightsStatus))) errors.push('imageRightsStatus must be CLEARED or NOT_PROVIDED');

  return { valid: errors.length === 0, normalizedKey: errors.length ? undefined : createHash('sha256').update(`${itemName.toLowerCase()}\u0000${categoryCode}\u0000${subcategoryCode}\u0000${egsCode}`).digest('hex'), errors };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: npx tsx scripts/catalog/validate-staging-import.ts path/to/import.json');
  const payload = JSON.parse(await readFile(path, 'utf8')) as { accessPolicy?: unknown; taxonomyCodes?: unknown; rows?: unknown };
  const accessPolicy = text(payload.accessPolicy);
  const taxonomyCodes = new Set(Array.isArray(payload.taxonomyCodes) ? payload.taxonomyCodes.map((code) => text(code).toUpperCase()).filter(Boolean) : []);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const results = rows.map((row, index) => ({ index, ...validateStagingRow(isObject(row) ? row as ImportRow : {}, taxonomyCodes, accessPolicy) }));
  const valid = results.filter((result) => result.valid).length;
  console.log(JSON.stringify({ total: rows.length, valid, rejected: rows.length - valid, results }, null, 2));
  if (valid !== rows.length) process.exitCode = 2;
}

if (process.argv[1]?.endsWith('validate-staging-import.ts')) void main();
