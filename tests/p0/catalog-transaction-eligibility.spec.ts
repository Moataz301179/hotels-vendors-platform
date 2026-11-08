import { describe, expect, it } from "vitest";
import { evaluateCatalogTransaction } from "@/lib/catalog/transaction-eligibility";

const confirmed = {
  status: "ACTIVE",
  source: "MANUAL",
  sourceProvider: "SUPPLIER_SUBMISSION",
  supplier: { status: "ACTIVE", isVerified: true },
  hasResolvedEvidence: true,
};

describe("server-derived catalog transaction eligibility", () => {
  it("allows a confirmed, published and evidenced supplier product", () => {
    expect(evaluateCatalogTransaction(confirmed)).toEqual({ eligible: true, reasons: [] });
  });

  it("rejects a researched ecommerce preview with a machine-readable reason", () => {
    expect(evaluateCatalogTransaction({ ...confirmed, source: "ECOMMERCE", sourceProvider: "firecrawl" })).toEqual({
      eligible: false,
      reasons: ["SUPPLIER_CONFIRMATION_REQUIRED"],
    });
  });

  it("returns every failed server condition", () => {
    expect(evaluateCatalogTransaction({
      ...confirmed,
      status: "INACTIVE",
      source: "FIXTURE",
      sourceProvider: null,
      supplier: { status: "PENDING", isVerified: false },
      hasResolvedEvidence: false,
    }).reasons).toEqual([
      "PRODUCT_NOT_PUBLISHED",
      "SUPPLIER_NOT_ACTIVE",
      "SUPPLIER_NOT_VERIFIED",
      "SUPPLIER_CONFIRMATION_REQUIRED",
      "RESOLVED_PRODUCT_EVIDENCE_REQUIRED",
    ]);
  });
});
