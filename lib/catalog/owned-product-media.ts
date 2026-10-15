/**
 * Product media may be rendered in buyer-facing surfaces only when both the
 * image and its evidence page belong to the supplier's verified website.
 * This runs at submission and again at publication, so a later data change
 * cannot turn an unrelated URL into a buyer-visible asset.
 */
export function isSupplierOwnedProductMedia(imageUrl: string, imageSourceUrl: string, supplierWebsite: string | undefined | null) {
  try {
    const image = new URL(imageUrl);
    const source = new URL(imageSourceUrl);
    const website = supplierWebsite ? new URL(supplierWebsite) : null;
    if (!website || image.protocol !== 'https:' || source.protocol !== 'https:' || image.username || image.password || source.username || source.password) return false;
    const isOwnedHost = (hostname: string) => hostname === website.hostname || hostname.endsWith(`.${website.hostname}`);
    return isOwnedHost(image.hostname) && isOwnedHost(source.hostname);
  } catch { return false; }
}

export function productImage(images: string | null | undefined) {
  try {
    const values = JSON.parse(images ?? '[]');
    return Array.isArray(values) ? values.find((value): value is string => typeof value === 'string') ?? null : null;
  } catch { return null; }
}
