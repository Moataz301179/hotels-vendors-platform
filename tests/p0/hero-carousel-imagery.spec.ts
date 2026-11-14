import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const carousel = readFileSync("components/marketing/hero-carousel.tsx", "utf8");

describe("hero carousel imagery", () => {
  it("does not use the rejected tray or lamp product stills", () => {
    expect(carousel).not.toContain("/catalog/gastronorm-pan.jpg");
    expect(carousel).not.toContain("/catalog/led-lamp.jpg");
    expect(carousel).not.toContain("/catalog/lobby-armchair.jpg");
    expect(carousel).not.toContain("/hovin-delivery-verification.png");
    expect(carousel).toContain("/category-food-beverage.png");
    expect(carousel).toContain("/category-housekeeping.png");
    expect(carousel).toContain("/category-engineering-ffe.png");
    expect(carousel).toContain("/hovin-receiving-field.jpg");
  });

  it("keeps each slide image aligned to its journey copy", () => {
    expect(carousel).toMatch(/Restaurants & bars[\s\S]*?category-food-beverage\.png/);
    expect(carousel).toMatch(/Housekeeping & guest rooms[\s\S]*?category-housekeeping\.png/);
    expect(carousel).toMatch(/Engineering & furniture[\s\S]*?category-engineering-ffe\.png/);
    expect(carousel).toMatch(/HOVIN receiving[\s\S]*?hovin-receiving-field\.jpg/);
  });
});
