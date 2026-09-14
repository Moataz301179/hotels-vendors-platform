/**
 * Structured data (JSON-LD) builders for HotelsVendors.
 *
 * NO-FAKE-DATA GUARD: aggregateRating, review, offerCount, supply and any
 * "verified" claim stay undefined until real, sourced data exists. Schema
 * must never contain fabricated ratings or counts — fake schema is spam.
 */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HotelsVendors",
    url: "https://www.hotelsvendors.com",
    logo: "https://www.hotelsvendors.com/logo-white.svg",
    description:
      "Egypt's B2B hospitality procurement infrastructure — AI-driven marketplace connecting hotels with verified suppliers, with ETA e-invoicing and FRA-aligned reverse factoring.",
    sameAs: [
      "https://linkedin.com/company/hotelsvendors",
      "https://twitter.com/hotelsvendors",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
      addressLocality: "Cairo",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Arabic"],
    },
  };
}

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HotelsVendors",
    url: "https://www.hotelsvendors.com",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web & Mobile",
    applicationSubCategory: "Procurement / Hospitality Management",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
      description: "Free for hotels and suppliers during early access.",
    },
    featureList: [
      "ETA e-invoicing & e-Waybill compliance",
      "FRA-compliant reverse factoring",
      "AI demand forecasting & spend analytics",
      "Multi-tier approval matrix",
      "RFQ auctions & bulk pricing",
    ],
  };
}

/** SoftwareApplication node explicitly declaring mobile compatibility. */
export function hovinMobileJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HOVIN",
    operatingSystem: "Android, iOS",
    applicationCategory: "BusinessApplication",
    operatingSystemVersion: "Android 8.0+, iOS 14+",
    mobileRequirements: "Android, iPhone",
    url: "https://www.hotelsvendors.com/hovin",
    description:
      "HOVIN is the mobile layer of HotelsVendors — order fulfillment, dock scanning, and 48-hour cash-out for suppliers, carriers, and dock teams.",
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HotelsVendors",
    url: "https://www.hotelsvendors.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.hotelsvendors.com/marketplace?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}