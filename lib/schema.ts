/**
 * Conservative JSON-LD for public brand/entity clarity.
 * Only organization and website facts supported by the public site are emitted.
 */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HotelsVendors",
    url: "https://www.hotelsvendors.com",
    logo: "https://www.hotelsvendors.com/logo-nav-black.svg",
    description:
      "HotelsVendors is a hospitality procurement network for sourcing suppliers, comparing quotes and reviewing organization purchasing activity.",
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HotelsVendors",
    url: "https://www.hotelsvendors.com",
  };
}
