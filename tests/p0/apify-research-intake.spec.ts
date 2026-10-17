import { describe, expect, it } from "vitest";

import { toResearchCandidate } from "@/lib/sourcing/apify";

describe("public discovery research intake", () => {
  it("converts a cited public discovery into a review-only candidate without invented commercial identity", () => {
    expect(toResearchCandidate({
      businessName: "Example Hospitality Supplies",
      category: "linen supplier",
      website: "https://supplier.example/",
      sourceUrl: "https://maps.example/place/example-hospitality-supplies",
      source: "APIFY_DISCOVERY",
    })).toEqual(expect.objectContaining({
      name: "Example Hospitality Supplies",
      candidateType: "SUPPLIER",
      website: "https://supplier.example/",
      sourceUrl: "https://maps.example/place/example-hospitality-supplies",
      categories: ["linen supplier"],
      status: "RESEARCH_CANDIDATE",
    }));
  });

  it("rejects a discovery without a source URL instead of creating a supplier-like record", () => {
    expect(toResearchCandidate({
      businessName: "Uncited Supplier",
      category: "hotel supplies",
      website: "https://supplier.example",
      source: "APIFY_DISCOVERY",
    })).toBeNull();
  });
});
