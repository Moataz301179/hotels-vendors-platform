/**
 * ETA Payload Canonicalizer
 * Hotels Vendors Compliance Layer
 *
 * Alphabetical canonical flattening for ETA invoice payloads.
 * Produces a deterministic key=value string suitable for RSA signing.
 */

import { createHash } from "crypto";

export interface CanonicalEntry {
  key: string;
  value: string;
}

export interface CanonicalResult {
  entries: CanonicalEntry[];
  canonicalString: string;
  sha256Digest: string;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = ""
): CanonicalEntry[] {
  const entries: CanonicalEntry[] = [];

  for (const [rawKey, val] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey;

    if (val === null || val === undefined) {
      entries.push({ key, value: "" });
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        const arrayKey = `${key}.${idx}`;
        if (typeof item === "object" && item !== null) {
          entries.push(...flattenObject(item as Record<string, unknown>, arrayKey));
        } else {
          entries.push({ key: arrayKey, value: formatValue(item) });
        }
      });
    } else if (typeof val === "object") {
      entries.push(...flattenObject(val as Record<string, unknown>, key));
    } else {
      entries.push({ key, value: formatValue(val) });
    }
  }

  // Sort alphabetically by key (case-insensitive)
  entries.sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: "base" }));
  return entries;
}

function formatValue(val: unknown): string {
  if (typeof val === "number") {
    // Avoid scientific notation
    if (Number.isInteger(val)) return val.toString();
    // Use fixed notation for decimals
    return val.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 20,
    });
  }
  if (typeof val === "string") {
    // Normalize ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val;
    return val;
  }
  return String(val);
}

function toCanonical(entries: CanonicalEntry[]): string {
  return entries.map((e) => `${e.key}=${e.value}`).join("\n");
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function canonicalizeEtaPayload(
  payload: Record<string, unknown>
): CanonicalResult {
  const entries = flattenObject(payload);
  const canonicalString = toCanonical(entries);
  const sha256Digest = sha256(canonicalString);
  return { entries, canonicalString, sha256Digest };
}

export function toCanonicalString(payload: Record<string, unknown>): string {
  return canonicalizeEtaPayload(payload).canonicalString;
}

export function assertCanonicalizable(payload: Record<string, unknown>): void {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("Cannot canonicalize empty payload");
  }
}

export function buildDualField(english: string, arabic: string) {
  return {
    codeName: english,
    codeNameAr: arabic,
    description: english,
    descriptionAr: arabic,
  };
}

export function applyDualLanguage(
  line: Record<string, unknown>,
  english: string,
  arabic: string
): Record<string, unknown> {
  return {
    ...line,
    description: english,
    descriptionAr: arabic,
  };
}
