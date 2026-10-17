import { createHash } from 'node:crypto';

export type DirectoryItemType = 'PRODUCT' | 'SERVICE';

/** Stable matching text only; the source copy is stored separately for review. */
export function normalizeDirectoryText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function directoryFingerprint(input: { sourceUrl: string; sourceRecordKey?: string | null; itemType: DirectoryItemType; name: string; category: string }) {
  return createHash('sha256')
    .update([input.sourceUrl, input.sourceRecordKey ?? '', input.itemType, normalizeDirectoryText(input.name), normalizeDirectoryText(input.category)].join('|'))
    .digest('hex');
}

/** Bilingual search corpus; stored separately from source evidence and never returned publicly. */
export function directorySearchText(input: { name: string; nameAr?: string; category: string; subcategory?: string; description?: string; searchTerms: string[] }) {
  return normalizeDirectoryText([input.name, input.nameAr, input.category, input.subcategory, input.description, ...input.searchTerms].filter(Boolean).join(' '));
}

export function safeDirectoryImages(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((image): image is string => typeof image === 'string' && /^https:\/\//i.test(image)).slice(0, 8);
}
