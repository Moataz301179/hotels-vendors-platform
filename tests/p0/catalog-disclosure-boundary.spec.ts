import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("catalog field-level disclosure", () => {
  const catalog = read("app/api/v2/catalog/route.ts");
  const marketplace = read("app/api/v2/marketplace/route.ts");
  const disclosure = read("lib/procurement/anonymous-commercial-disclosure.ts");

  it("maps buyer catalog rows through the anonymous product shape", () => {
    expect(catalog).toContain("toAnonymousCatalogProduct");
    expect(marketplace).toContain("toAnonymousCatalogProduct");
  });

  it("never returns the anonymous shape's excluded commercial fields", () => {
    const shape = disclosure.match(/export function toAnonymousCatalogProduct[\s\S]*?(?=\nexport function|\n$)/);
    expect(shape).not.toBeNull();
    expect(shape?.[0]).not.toContain("supplierId");
    expect(shape?.[0]).not.toContain("unitPrice");
    expect(shape?.[0]).not.toContain("sourceKey");
    expect(shape?.[0]).toContain("requestForQuote: true");
  });

  it("serves buyer images through the first-party safe-media helper", () => {
    expect(catalog).toContain("buyerSafeCatalogImageUrls");
    expect(marketplace).toContain("buyerSafeCatalogImageUrls");
    expect(disclosure).not.toContain("supplierId: product.supplierId");
  });

  it("keeps quote comparisons free of supplier identity", () => {
    const quoteShape = disclosure.match(/export function toAnonymousQuoteComparison[\s\S]*?(?=\nexport function|\n$)/);
    expect(quoteShape?.[0]).not.toContain("supplierId");
    expect(quoteShape?.[0]).toContain("Comparable offer");
  });

  it("excludes test fixtures from buyer-facing catalog results", () => {
    // Fixtures are development data and must never reach a buyer's catalog.
    expect(catalog).toMatch(/source:\{not:['"]FIXTURE['"]\}/);
    expect(catalog).toMatch(/status:'ACTIVE'/);
    expect(catalog).toMatch(/isVerified:true/);
    expect(marketplace).toMatch(/source:\{not:['"]FIXTURE['"]\}/);
  });

  it("only serves products whose supplier is active and verified", () => {
    expect(catalog).toMatch(/supplier:\{status:'ACTIVE',isVerified:true,deletedAt:null\}/);
    expect(marketplace).toMatch(/supplier:\s*\{\s*status:"ACTIVE",\s*isVerified:true,\s*deletedAt:null\s*\}/);
  });
});
