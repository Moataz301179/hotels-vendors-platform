import { describe, expect, it } from "vitest";
import { recordedQuoteSpan } from "./quotes";

describe("recorded quote span", () => {
  it("reports the lowest and highest unit prices present in the response", () => {
    const span = recordedQuoteSpan([
      { reference: "Comparable offer 02", unitPrice: "18.5", currency: "EGP" },
      { reference: "Comparable offer 01", unitPrice: 12, currency: "EGP" },
    ]);
    expect(span).toEqual({
      count: 2,
      low: { reference: "Comparable offer 01", unitPrice: 12, currency: "EGP" },
      high: { reference: "Comparable offer 02", unitPrice: 18.5, currency: "EGP" },
    });
  });

  it("returns nothing when the response has no numeric unit price", () => {
    expect(recordedQuoteSpan([{ reference: "Comparable offer 01", unitPrice: "pending", currency: "EGP" }])).toBeNull();
  });
});
