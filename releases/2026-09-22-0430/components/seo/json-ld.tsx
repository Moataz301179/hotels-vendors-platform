/**
 * Renders the full JSON-LD structured-data set for HotelsVendors.
 * Declares Organization, SoftwareApplication (web + HOVIN mobile), and WebSite.
 * NO-FAKE-DATA: no ratings/reviews/counts are emitted.
 */
import { organizationJsonLd, softwareJsonLd, hovinMobileJsonLd, webSiteJsonLd } from "@/lib/schema";

export function JsonLd() {
  const blocks = [organizationJsonLd(), softwareJsonLd(), hovinMobileJsonLd(), webSiteJsonLd()];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}