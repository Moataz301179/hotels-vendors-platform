const PUBLIC_SPECIFICATION_KEYS = [
  'material',
  'dimensions',
  'capacity',
  'composition',
  'colour',
  'color',
  'weight',
  'technicalSpecification',
] as const;

export function publicDirectoryText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 500) return null;
  if (/https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]{0,62}(?:\.[a-z]{2,63})+\b|(?:tel|mailto):|@|(?:\+?\d[\d\s().-]{7,}\d)|\b(?:vendor|supplier|source|contact|attribution|website)\b|(?:مورد|المورد|موردين)/i.test(normalized)) return null;
  return normalized;
}

function normalizedDirectoryText(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function textLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(textLeaves);
  return Object.values(value).flatMap(textLeaves);
}

function identityTextLeaves(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(identityTextLeaves);
  return Object.entries(value).flatMap(([key, child]) => {
    if (/(supplier|vendor|manufacturer|brand|company|seller|contact)/i.test(key)) return textLeaves(child);
    return identityTextLeaves(child);
  });
}

const genericIdentityTokens = new Set(['and', 'company', 'group', 'hospitality', 'hotel', 'limited', 'ltd', 'the']);

/** Prevent a reviewer from copying a source observation verbatim into public copy. */
export function copiesDirectorySourceText(publicValues: unknown[], candidate: {
  name: string;
  nameAr: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  attributes: unknown;
  unitOfMeasure: string | null;
  purchaseUnit: string | null;
  searchTerms: unknown;
  sourceSnapshot: unknown;
}) {
  const candidateAttributes = candidate.attributes && typeof candidate.attributes === 'object' && !Array.isArray(candidate.attributes)
    ? candidate.attributes as Record<string, unknown>
    : {};
  const sensitiveAttributes = Object.fromEntries(
    ['technicalSpecification', 'manufacturer', 'brand', 'model', 'sourceAttribution']
      .filter((key) => key in candidateAttributes)
      .map((key) => [key, candidateAttributes[key]]),
  );
  const sourceValues = textLeaves([candidate.name, candidate.nameAr, candidate.category, candidate.subcategory, candidate.description, sensitiveAttributes, candidate.unitOfMeasure, candidate.purchaseUnit, candidate.searchTerms])
    .map(normalizedDirectoryText)
    .filter((value) => value.length >= 3);
  const snapshotValues = textLeaves(candidate.sourceSnapshot)
    .map(normalizedDirectoryText)
    .filter((value) => value.length >= 4);
  const identityTokens = identityTextLeaves(candidate.sourceSnapshot)
    .flatMap((value) => normalizedDirectoryText(value).split(' '))
    .filter((value) => value.length >= 3 && !genericIdentityTokens.has(value));
  return textLeaves(publicValues)
    .map(normalizedDirectoryText)
    .filter((value) => value.length >= 3)
    .some((value) => sourceValues.includes(value) || snapshotValues.some((sourceValue) => value.includes(sourceValue)) || value.split(' ').some((token) => identityTokens.includes(token)));
}

type PublicDirectoryFieldsInput = {
  name: unknown;
  nameAr: unknown;
  category: unknown;
  subcategory: unknown;
  unitOfMeasure: unknown;
  purchaseUnit: unknown;
};

/**
 * All text rendered with an anonymous catalogue reference crosses this
 * boundary. Required labels fail closed; optional labels are omitted when
 * they contain source, contact, or Vendor-identifying evidence.
 */
export function publicDirectoryFields(value: PublicDirectoryFieldsInput) {
  const name = publicDirectoryText(value.name);
  const category = publicDirectoryText(value.category);
  if (!name || !category) return null;
  return {
    name,
    nameAr: publicDirectoryText(value.nameAr),
    category,
    subcategory: publicDirectoryText(value.subcategory),
    unitOfMeasure: publicDirectoryText(value.unitOfMeasure),
    purchaseUnit: publicDirectoryText(value.purchaseUnit),
  };
}

/** Reject review publication when any persisted public label is unsafe. */
export function hasSafePublicDirectoryFields(value: PublicDirectoryFieldsInput): boolean {
  const fields = publicDirectoryFields(value);
  if (!fields) return false;
  return [value.nameAr, value.subcategory, value.unitOfMeasure, value.purchaseUnit]
    .every((field) => field == null || publicDirectoryText(field) !== null);
}

/**
 * Directory profiles retain full review evidence internally. Public discovery
 * receives only explicitly approved product specifications, never free-form
 * metadata that could expose a Vendor, source, contact, or commercial record.
 */
export function publicDirectorySpecifications(attributes: unknown) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return {};
  const source = attributes as Record<string, unknown>;
  return Object.fromEntries(
    PUBLIC_SPECIFICATION_KEYS.flatMap((key) => {
      const value = publicDirectoryText(source[key]);
      return value ? [[key, value]] : [];
    }),
  );
}

/**
 * Reviewed image URLs are source evidence. Do not send browser clients to
 * third-party hosts until an origin-pinned, first-party media proxy exists.
 */
export function publicDirectoryImages(_images: unknown): string[] {
  return [];
}
