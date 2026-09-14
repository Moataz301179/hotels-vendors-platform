const SITE_URL = "https://www.hotelsvendors.com";

/** Canonical URL for a public page. Use in page metadata: alternates: { canonical: canonicalUrl("/pricing") } */
export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
