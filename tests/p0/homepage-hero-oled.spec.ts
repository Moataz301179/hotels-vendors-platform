import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/(marketing)/page.tsx", "utf8");
const css = readFileSync("app/(marketing)/public-home-hero.module.css", "utf8");

describe("homepage hero OLED fade", () => {
  it("uses a full-bleed media stage that fades into the title copy", () => {
    expect(page).toContain("heroStyles.media");
    expect(page).toContain("heroStyles.oled");
    expect(page).toContain("heroStyles.oledTexture");
    expect(page).toContain("heroStyles.fade");
    expect(page).toContain("HotelsVendors");
    expect(page).toContain("One operating record for hotel purchasing");
    expect(page).toContain("See how it works");
    expect(page).not.toContain("Technology reimagined for hotel procurement");
    expect(page).not.toContain("Hospitality operating network");
    expect(page).not.toContain("Authorized hospitality imagery");
    expect(page).not.toContain("Built for operators");
  });

  it("keeps the approved cobalt/charcoal palette in the OLED treatment", () => {
    expect(css).toContain("rgba(48, 50, 52");
    expect(css).toContain("rgba(91, 146, 254");
    expect(css).toContain("var(--paper-100)");
    expect(css).toContain("var(--cobalt-600)");
    expect(css).not.toMatch(/#7c3aed|#a855f7|purple/i);
  });

  it("keeps an opaque paper band under bottom-aligned mobile copy", () => {
    expect(css).toContain("Copy is bottom-aligned below 950px");
    expect(css).toContain("var(--paper-100) 100%");
    expect(css).toContain("align-items: end");
  });
});
