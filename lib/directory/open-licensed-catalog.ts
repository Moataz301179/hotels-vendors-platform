export const openLicensedCatalogues = {
  'https://world.openfoodfacts.org/data': {
    sourceType: 'OPEN_LICENSED_BULK_EXPORT',
    attribution: 'Open Food Facts product data (ODbL) and images (CC BY-SA 4.0).',
    attributionUrl: 'https://world.openfoodfacts.org/data',
  },
  'https://world.openproductsfacts.org/data': {
    sourceType: 'OPEN_LICENSED_BULK_EXPORT',
    attribution: 'Open Products Facts product data (ODbL) and images (CC BY-SA 4.0).',
    attributionUrl: 'https://world.openproductsfacts.org/data',
  },
} as const;

export type OpenLicensedCatalogueUrl = keyof typeof openLicensedCatalogues;

export function openLicensedCatalogue(url: string) {
  return Object.prototype.hasOwnProperty.call(openLicensedCatalogues, url)
    ? openLicensedCatalogues[url as OpenLicensedCatalogueUrl]
    : null;
}

/** Source metadata required before an unattended, licence-bounded publication. */
export function hasOpenLicensedEvidence(attributes: unknown) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false;
  const value = (attributes as Record<string, unknown>).openDataLicense;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.dataLicense === 'ODbL-1.0' && record.imageLicense === 'CC-BY-SA-4.0';
}
