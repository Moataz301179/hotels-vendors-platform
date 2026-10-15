import { describe, expect, it } from "vitest";
import { toProductCandidate, type WcSource, type WpRestProduct } from "@/lib/sourcing/wc-sources";

const source: WcSource = {
  id: "supplier",
  name: "Supplier",
  baseUrl: "https://supplier.example",
  catalogApiUrl: "https://supplier.example/wp-json/wp/v2/product",
  categoryApiUrl: "https://supplier.example/wp-json/wp/v2/product_cat",
  verified: true,
  defaultCategory: "FFE",
};

function productWithMedia(sourceUrl: string, mimeType = "image/jpeg"): WpRestProduct {
  return {
    id: 42,
    slug: "tabletop-warming-unit",
    title: { rendered: "Tabletop warming unit" },
    _embedded: { "wp:featuredmedia": [{ source_url: sourceUrl, mime_type: mimeType }] },
  };
}

describe("public supplier catalog media", () => {
  it("keeps a secure product image served by the observed supplier", () => {
    const candidate = toProductCandidate(productWithMedia("https://supplier.example/media/unit.jpg"), source);
    expect(candidate.images).toEqual(["https://supplier.example/media/unit.jpg"]);
  });

  it("does not attach off-domain, insecure, or non-image media to the listing", () => {
    expect(toProductCandidate(productWithMedia("https://unrelated.example/unit.jpg"), source).images).toBeUndefined();
    expect(toProductCandidate(productWithMedia("http://supplier.example/unit.jpg"), source).images).toBeUndefined();
    expect(toProductCandidate(productWithMedia("https://supplier.example/specification.pdf", "application/pdf"), source).images).toBeUndefined();
  });
});
