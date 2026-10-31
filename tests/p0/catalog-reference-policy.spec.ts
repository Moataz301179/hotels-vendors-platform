import { describe, expect, it } from "vitest";
import { validateStagingRow } from "@/scripts/catalog/validate-staging-import";

const controlledCategories = new Set(["HOUSEKEEPING_LAUNDRY"]);
const internalReference = {
  itemName: "Commercial microfiber cleaning cloth, 40 × 40 cm",
  categoryCode: "HOUSEKEEPING_LAUNDRY",
  subcategoryCode: "CLEANING_TEXTILES",
  technicalSpecs: { material: "microfiber", dimensions: "40 x 40 cm", use: "housekeeping" },
  imageUrls: [],
  imageRightsStatus: "NOT_PROVIDED",
  defaultMoq: 24,
  egsCode: "HV-HK-CLEAN-CLOTH-0040",
  taxCodeScheme: "HV_INTERNAL",
  attributionSource: "HotelsVendors internally authored hospitality specification",
  sourceObservedAt: "2026-10-24T00:00:00.000Z",
};

describe("supplier-neutral catalogue reference policy", () => {
  it("allows an internally authored HoReCa specification to enter controlled staging", () => {
    expect(validateStagingRow(internalReference, controlledCategories, "INTERNALLY_AUTHORED")).toMatchObject({ valid: true, errors: [] });
  });

  it("does not allow a public observation to bypass source policy", () => {
    expect(validateStagingRow(internalReference, controlledCategories, "PUBLIC_DISCOVERY_ONLY")).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["source access policy is not cleared for staging"]),
    });
  });

  it("continues to reject consumer-retail noise even for internally authored rows", () => {
    expect(validateStagingRow({ ...internalReference, itemName: "Nature Valley snack bar" }, controlledCategories, "INTERNALLY_AUTHORED")).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["consumer-retail item is not an allowed HoReCa reference"]),
    });
  });
});
