import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const carousel = readFileSync("components/marketing/hero-carousel.tsx", "utf8");

describe("hero carousel imagery", () => {
  it("does not use the rejected tray or lamp product stills", () => {
    expect(carousel).not.toContain("/catalog/gastronorm-pan.jpg");
    expect(carousel).not.toContain("/catalog/led-lamp.jpg");
    expect(carousel).toContain("/category-food-beverage.png");
    expect(carousel).toContain("/catalog/lobby-armchair.jpg");
    expect(carousel).toContain("/hovin-receiving-field.jpg");
  });
});
