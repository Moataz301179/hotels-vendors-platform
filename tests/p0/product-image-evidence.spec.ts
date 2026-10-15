import { describe, expect, it } from "vitest";
import { enrichProduct } from "@/lib/ingestion/ingest";

describe("catalog product-image evidence", () => {
  it("does not create a category substitute when the source has no product image", () => {
    const product = enrichProduct({ title: "Hotel bath towel", priceEGP: 100 }, "tenant-id");
    expect(product.imageURL).toBeUndefined();
  });

  it("retains only a secure source-supplied image URL", () => {
    const secure = enrichProduct({ title: "Hotel bath towel", priceEGP: 100, imageURL: "https://supplier.example/towel.jpg" }, "tenant-id");
    const insecure = enrichProduct({ title: "Hotel bath towel", priceEGP: 100, imageURL: "http://supplier.example/towel.jpg" }, "tenant-id");
    expect(secure.imageURL).toBe("https://supplier.example/towel.jpg");
    expect(insecure.imageURL).toBeUndefined();
  });
});
