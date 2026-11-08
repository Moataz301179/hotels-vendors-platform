import { describe, expect, it } from "vitest";
import { isGenuineSupplier, isSyntheticProductName } from "@/lib/catalog/synthetic-supplier";

describe("synthetic supplier detection", () => {
  it("treats machine-generated supplier names as synthetic", () => {
    expect(isGenuineSupplier({ name: "Supplier 4e25740960d14668ac7239668b485eb1" })).toBe(false);
    expect(isGenuineSupplier({ name: "Other supplier 4e25740960d14668ac7239668b485eb1" })).toBe(false);
    expect(isGenuineSupplier({ name: "HV E2E verification supplier" })).toBe(false);
    expect(isGenuineSupplier({ name: "test supplier" })).toBe(false);
  });

  it("keeps real business names", () => {
    for (const name of ["Horeca Star", "Al Azima Linen", "ETTC Egypt", "Universal Amenities"]) {
      expect(isGenuineSupplier({ name })).toBe(true);
    }
  });

  it("flags lifecycle test product names", () => {
    expect(isSyntheticProductName("Verified lifecycle product")).toBe(true);
    expect(isSyntheticProductName("Reviewed lifecycle towel")).toBe(true);
    expect(isSyntheticProductName("HV E2E verified receiving item")).toBe(true);
    expect(isSyntheticProductName("Egyptian Premium Tomatoes (10kg crate)")).toBe(false);
  });
});
