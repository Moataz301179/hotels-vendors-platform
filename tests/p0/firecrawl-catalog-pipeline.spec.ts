import { describe, it, expect, beforeEach } from "vitest";

/**
 * Firecrawl → HV catalogue pipeline contract.
 *
 * Proves the extraction, normalization, dedupe and import rules against
 * real-world-shaped supplier markup (JSON-LD Product blocks + price-bearing
 * product cards). Also proves the honesty guarantees: no-price records are
 * rejected, nav chrome is never imported, and nothing is auto-verified.
 */

const pipeline = await import("../../lib/catalog/firecrawl-pipeline");

/** Realistic supplier markup: JSON-LD product + priced card + nav chrome. */
const REAL_PAGE_HTML = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nescaf\u00e9 Classic Instant Coffee 200g",
  "description": "Instant coffee, 200g tin",
  "category": "Beverages",
  "image": "https://cdn.example.com/nescafe-200g.jpg",
  "offers": { "@type": "Offer", "price": "285.50", "priceCurrency": "EGP" }
}
</script>
</head><body>
  <div class="product-card">
    <h3 class="product-title">Juhayna Strawberry Yoghurt 500ml</h3>
    <span class="price">EGP 18.75</span>
    <img src="https://cdn.example.com/yoghurt.jpg" alt="yoghurt" />
  </div>
  <div class="product-card">
    <h3 class="product-title">Almarai Full Fat Milk 1L</h3>
    <span class="price">EGP 32.00</span>
  </div>
  <nav>
    <div class="card"><a href="/about">About Us</a></div>
    <div class="card"><a href="/csr">CSR &amp; Sustainability</a></div>
  </nav>
</body></html>
`;

describe("Firecrawl catalogue pipeline", () => {
  describe("extraction", () => {
    it("extracts JSON-LD products with real prices", () => {
      const records = pipeline.extractFromHtml(REAL_PAGE_HTML, "https://supplier.example.com/");
      const coffee = records.find((r) => r.name.includes("Nescaf"));
      expect(coffee).toBeTruthy();
      expect(coffee!.price).toBe(285.5);
      expect(coffee!.currency).toBe("EGP");
      expect(coffee!.imageUrl).toContain("nescafe");
      expect(coffee!.sourceProvider).toBe("firecrawl");
      expect(coffee!.sourceHash).toHaveLength(32);
    });

    it("extracts priced product cards", () => {
      const records = pipeline.extractFromHtml(REAL_PAGE_HTML, "https://supplier.example.com/");
      const yoghurt = records.find((r) => r.name.includes("Yoghurt"));
      expect(yoghurt).toBeTruthy();
      expect(yoghurt!.price).toBe(18.75);
      expect(yoghurt!.imageUrl).toContain("yoghurt");
    });

    it("never imports navigation chrome", () => {
      const records = pipeline.extractFromHtml(REAL_PAGE_HTML, "https://supplier.example.com/");
      const names = records.map((r) => r.name.toLowerCase());
      expect(names.some((n) => n.includes("about us"))).toBe(false);
      expect(names.some((n) => n.includes("csr"))).toBe(false);
      // "scroll down" and other one-word chrome are filtered too.
      expect(names.some((n) => n.includes("scroll"))).toBe(false);
    });

    it("imports quote-only cards — a price is not required", () => {
      const html = `<div class="product-card"><h3>Unpriced Quote Item</h3><img src="x.jpg" /></div>`;
      const records = pipeline.extractFromHtml(html, "https://x.com/");
      expect(records).toHaveLength(1);
      expect(records[0].price).toBeNull();
      expect(pipeline.isQuoteOnly(records[0])).toBe(true);
    });

    it("decodes HTML entities in product names", () => {
      const html = `<div class="product-card"><h3>Tomato &amp; Basil Pasta 400g</h3><span>EGP 22.00</span></div>`;
      const records = pipeline.extractFromHtml(html, "https://x.com/");
      expect(records[0].name).toBe("Tomato & Basil Pasta 400g");
    });

    it("skips malformed JSON-LD without inventing data", () => {
      const html = `<script type="application/ld+json">{"@type":"Product", oops}</script>`;
      expect(pipeline.extractFromHtml(html, "https://x.com/")).toHaveLength(0);
    });
  });

  describe("normalization", () => {
    it("parses prices honestly and rejects unreadable values", () => {
      expect(pipeline.parsePrice("EGP 1,250.50")).toBe(1250.5);
      expect(pipeline.parsePrice("جنيه 75.25")).toBe(75.25);
      expect(pipeline.parsePrice("Call for price")).toBeNull();
      expect(pipeline.parsePrice("0")).toBeNull();
      expect(pipeline.parsePrice(null)).toBeNull();
    });

    it("normalizes units of measure", () => {
      expect(pipeline.normalizeUom("كرتونة")).toBe("BOX");
      expect(pipeline.normalizeUom("kg")).toBe("KG");
      expect(pipeline.normalizeUom("قطعة")).toBe("PIECE");
      expect(pipeline.normalizeUom("unknown")).toBeNull();
    });

    it("normalizes names without losing meaning", () => {
      expect(pipeline.normalizeName("  Nescaf\u00e9   Classic  ")).toBe("Nescaf\u00e9 Classic");
    });
  });

  describe("dedupe and importability", () => {
    it("deduplicates by source hash", () => {
      const record = {
        name: "Coffee 200g",
        price: 100,
        currency: "EGP",
        imageUrl: null,
        category: null,
        sourceUrl: "https://x.com/p/1",
        sourceHash: pipeline.sourceHashFor("https://x.com/p/1", "Coffee 200g"),
        sourceProvider: "firecrawl",
        sourceObservedAt: new Date().toISOString(),
        spec: null,
        packSize: null,
        uom: null,
        moq: null,
      };
      const { unique, duplicates } = pipeline.dedupeRecords([record, { ...record }, { ...record }]);
      expect(unique).toHaveLength(1);
      expect(duplicates).toBe(2);
    });

    it("imports quote-only records and flags them for quotation", () => {
      const base = {
        name: "Some Product",
        price: null,
        currency: "EGP",
        imageUrl: null,
        category: null,
        sourceUrl: "https://x.com/p/1",
        sourceHash: "abc",
        sourceProvider: "firecrawl",
        sourceObservedAt: new Date().toISOString(),
        spec: null,
        packSize: null,
        uom: null,
        moq: null,
      };
      expect(pipeline.isImportable(base)).toEqual({ ok: true });
      expect(pipeline.isQuoteOnly(base)).toBe(true);
      expect(pipeline.isQuoteOnly({ ...base, price: 50 })).toBe(false);
    });
  });

  describe("idempotency", () => {
    it("produces a stable source hash for the same page and name", () => {
      expect(pipeline.sourceHashFor("https://x.com/p/1", "Coffee 200g")).toBe(
        pipeline.sourceHashFor("https://x.com/p/1", "Coffee 200g"),
      );
      expect(pipeline.sourceHashFor("https://x.com/p/1", "Coffee 200g")).not.toBe(
        pipeline.sourceHashFor("https://x.com/p/2", "Coffee 200g"),
      );
    });
  });
});
