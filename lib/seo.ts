import type { Metadata } from "next";

export const SITE_URL = "https://www.hotelsvendors.com";

/** Canonical URL for a public page. Use in page metadata: alternates: { canonical: canonicalUrl("/pricing") } */
export function canonicalUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "HotelsVendors",
      type: "website",
      images: [{ url: "/hero-clean.jpeg", width: 1920, height: 1080, alt: "Hotel suite representing the HotelsVendors hospitality network" }],
    },
  };
}
