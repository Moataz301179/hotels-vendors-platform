import { describe, expect, it } from "vitest";
import {
  PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES,
  isPublicHoRecaDirectorySourceType,
  publicMarketplaceDirectoryProfileWhere,
} from "@/lib/directory/public-marketplace";

describe("public marketplace HoReCa source gate", () => {
  it("allows only reviewed HoReCa source classes", () => {
    expect(PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES).toEqual([
      "VENDOR_AUTHORIZED_HORECA_CATALOG",
      "MASKED_OBSERVED_SUPPLIER_PRODUCT",
    ]);
    expect(isPublicHoRecaDirectorySourceType("INTERNAL_HOSPITALITY_SPECIFICATION")).toBe(false);
    expect(isPublicHoRecaDirectorySourceType("VENDOR_AUTHORIZED_HORECA_CATALOG")).toBe(true);
    expect(isPublicHoRecaDirectorySourceType("MASKED_OBSERVED_SUPPLIER_PRODUCT")).toBe(true);
  });

  it("keeps open-data consumer exports and unknown source types out of public discovery", () => {
    expect(isPublicHoRecaDirectorySourceType("OPEN_LICENSED_BULK_EXPORT")).toBe(false);
    expect(isPublicHoRecaDirectorySourceType("PUBLIC_CATALOG_OBSERVATION")).toBe(false);
    expect(isPublicHoRecaDirectorySourceType("PERMISSION_UNKNOWN")).toBe(false);
  });

  it("requires approved, permitted, non-deleted provenance for every public profile", () => {
    expect(publicMarketplaceDirectoryProfileWhere).toMatchObject({
      publicationStatus: "PUBLISHED",
      deletedAt: null,
      candidate: {
        is: {
          reviewStatus: "APPROVED",
          deletedAt: null,
          source: {
            is: {
              permissionStatus: "PERMITTED",
              deletedAt: null,
              sourceType: { in: [...PUBLIC_HORECA_DIRECTORY_SOURCE_TYPES] },
            },
          },
        },
      },
    });
  });
});
