import { describe, expect, it } from "vitest";

import { marketOfferObservations } from "@/lib/sourcing/scrapegraph-discovery";

const sources = [
  { url: "https://supplier.example/bath-towel", title: "Bath towel", content: "Bath towel 500g public offer" },
  { url: "https://supplier.example/soap", title: "Soap", content: "Guest soap public offer" },
];

describe("market offer observations", () => {
  it("retains an offer only when its exact returned source and product match are established", () => {
    expect(marketOfferObservations("bath towel", [{ sourceUrl: sources[0].url, productName: "Hotel bath towel", unitPrice: 80 }], sources)).toEqual([
      expect.objectContaining({ sourceUrl: sources[0].url, productName: "Hotel bath towel", unitPrice: 80 }),
    ]);
  });

  it("rejects model rows with an unreturned URL or an unrelated product", () => {
    expect(marketOfferObservations("bath towel", [
      { sourceUrl: "https://unrelated.example/towel", productName: "Hotel bath towel", unitPrice: 80 },
      { sourceUrl: sources[1].url, productName: "Guest soap", unitPrice: 20 },
    ], sources)).toEqual([]);
  });
});
