/**
 * ETA JSON document canonicalization.
 *
 * ETA signs a deterministic serialization of the unsigned document, not an
 * alphabetically sorted key/value projection. The order in the submitted JSON
 * is significant; array property names are repeated for every element.
 *
 * Source: ETA SDK "Document Serialization Approach". This helper prepares the
 * bytes for an approved CAdES-BES provider. It neither signs nor submits.
 */

import { createHash } from "node:crypto";

export interface CanonicalEntry {
  key: string;
  value: string;
}

export interface CanonicalResult {
  /** Preserved field sequence, useful only for diagnostics and tests. */
  entries: CanonicalEntry[];
  canonicalString: string;
  sha256Digest: string;
}

type JsonScalar = string | number | boolean | null;
type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };

function quote(value: JsonScalar): string {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("ETA_CANONICALIZATION_INVALID_NUMBER");
  }
  return `"${String(value)}"`;
}

function assertJsonValue(value: unknown): asserts value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("ETA_CANONICALIZATION_INVALID_NUMBER");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(assertJsonValue);
    return;
  }
  if (typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) assertJsonValue(child);
    return;
  }
  throw new Error("ETA_CANONICALIZATION_INVALID_VALUE");
}

function serialize(value: JsonValue, entries: CanonicalEntry[]): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return quote(value);
  }
  if (Array.isArray(value)) {
    throw new Error("ETA_CANONICALIZATION_UNNAMED_ARRAY");
  }

  let serialized = "";
  for (const [key, child] of Object.entries(value)) {
    const upperKey = key.toUpperCase();
    if (Array.isArray(child)) {
      serialized += quote(upperKey);
      entries.push({ key: upperKey, value: "[array]" });
      for (const item of child) {
        serialized += quote(upperKey);
        entries.push({ key: upperKey, value: "[item]" });
        serialized += serialize(item, entries);
      }
      continue;
    }

    serialized += quote(upperKey);
    entries.push({
      key: upperKey,
      value: child === null || typeof child !== "object" ? String(child) : "[object]",
    });
    serialized += serialize(child, entries);
  }
  return serialized;
}

export function canonicalizeEtaPayload(payload: Record<string, unknown>): CanonicalResult {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("ETA_CANONICALIZATION_EMPTY_DOCUMENT");
  }
  if (Object.prototype.hasOwnProperty.call(payload, "signatures")) {
    throw new Error("ETA_CANONICALIZATION_REQUIRES_UNSIGNED_DOCUMENT");
  }

  assertJsonValue(payload);
  const entries: CanonicalEntry[] = [];
  const canonicalString = serialize(payload, entries);
  return {
    entries,
    canonicalString,
    sha256Digest: createHash("sha256").update(canonicalString, "utf8").digest("hex"),
  };
}

export function toCanonicalString(payload: Record<string, unknown>): string {
  return canonicalizeEtaPayload(payload).canonicalString;
}

export function assertCanonicalizable(payload: Record<string, unknown>): void {
  canonicalizeEtaPayload(payload);
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
  arabic: string,
): Record<string, unknown> {
  return {
    ...line,
    description: english,
    descriptionAr: arabic,
  };
}
