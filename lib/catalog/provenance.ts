import { createHash } from "node:crypto";

export type CatalogSourceMetadata = {
  sourceReference: string;
  sourceUrl?: string;
  observedAt: Date | string;
};

export type ValidatedCatalogProvenance = {
  sourceReference: string;
  sourceUrl?: string;
  observedAt: Date;
};

export class CatalogProvenanceError extends Error {
  readonly code = "CATALOG_PROVENANCE_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "CatalogProvenanceError";
  }
}

/**
 * Catalogue observations are publishable only after review, but they must be
 * traceable at intake. This validates the minimum source receipt without
 * treating a URL, supplier label, or scraped value as a verified offer.
 */
export function validateCatalogProvenance(
  input: CatalogSourceMetadata,
  now = new Date(),
): ValidatedCatalogProvenance {
  const sourceReference = input.sourceReference.trim();
  if (!sourceReference || sourceReference.length > 200) {
    throw new CatalogProvenanceError("sourceReference must contain 1-200 characters");
  }

  let sourceUrl: string | undefined;
  if (input.sourceUrl) {
    try {
      const parsed = new URL(input.sourceUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("unsupported protocol");
      parsed.hash = "";
      sourceUrl = parsed.toString();
    } catch {
      throw new CatalogProvenanceError("sourceUrl must be an absolute HTTP(S) URL");
    }
  }

  const observedAt = input.observedAt instanceof Date ? input.observedAt : new Date(input.observedAt);
  if (Number.isNaN(observedAt.getTime())) {
    throw new CatalogProvenanceError("observedAt must be a valid timestamp");
  }
  if (observedAt.getTime() > now.getTime() + 5 * 60_000) {
    throw new CatalogProvenanceError("observedAt cannot be in the future");
  }

  return { sourceReference, sourceUrl, observedAt };
}

export function catalogDedupeKey(input: {
  tenantId: string;
  supplierId: string;
  sku: string;
  sourceReference: string;
}): string {
  const parts = [input.tenantId, input.supplierId, input.sku, input.sourceReference]
    .map((part) => part.trim().toLocaleLowerCase("en-US"));
  if (parts.some((part) => !part)) throw new CatalogProvenanceError("dedupe key fields cannot be empty");
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

export function catalogEvidenceHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
