type ProductImageRecord = { url?: unknown };

/**
 * Product media has historically been stored as either URL strings or source
 * records with a URL. Public responses expose only absolute HTTP(S) images.
 */
export function publicProductImageUrls(images: string | null) {
  try {
    const parsed: unknown = JSON.parse(images ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((image) => {
      const url = typeof image === 'string'
        ? image
        : image && typeof image === 'object'
          ? (image as ProductImageRecord).url
          : null;
      return typeof url === 'string' && /^https?:\/\//i.test(url) ? [url] : [];
    });
  } catch {
    return [];
  }
}

export function firstPublicProductImageUrl(images: string | null) {
  return publicProductImageUrls(images)[0] ?? null;
}
