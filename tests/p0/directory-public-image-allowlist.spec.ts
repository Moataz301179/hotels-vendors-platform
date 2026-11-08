import { describe, expect, it } from "vitest";
import { publicDirectoryImages } from "@/lib/directory/public-directory-profile";

describe("supplier-neutral directory image allowlist", () => {
  it("allows only the first-party, opaque Receiving Dock image route", () => {
    expect(publicDirectoryImages([
      "/api/v2/catalog/receiving/images/rec_01/0",
      "/api/v2/catalog/receiving/images/rec-02/3",
    ])).toEqual([
      "/api/v2/catalog/receiving/images/rec_01/0",
      "/api/v2/catalog/receiving/images/rec-02/3",
    ]);
  });

  it("never exposes source supplier URLs, unapproved paths, or malformed image values", () => {
    expect(publicDirectoryImages([
      "https://supplier.example/product.jpg",
      "https://cdn.supplier.example/image.jpg",
      "/api/v2/catalog/receiving/images/rec-01/not-an-index",
      "/api/v2/catalog/receiving/images/rec-01/0?source=supplier.example",
      null,
      12,
    ])).toEqual([]);
  });
});
