import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/(marketing)/page.tsx", "utf8");
const css = readFileSync("app/(marketing)/public-home-hero.module.css", "utf8");

describe("homepage Suite Atmosphere hero", () => {
  it("keeps a full-bleed photo stage with brand-first, quiet copy", () => {
    expect(page).toContain("heroStyles.media");
    expect(page).toContain("heroStyles.fade");
    expect(page).toContain("heroStyles.brand");
    expect(page).toContain("HotelsVendors");
    expect(page).toContain("The operating network behind every hotel stay.");
    expect(page).toContain("Explore the platform");
    expect(page).toContain("Register a hotel");
    expect(page).not.toContain("heroStyles.oled");
    expect(page).not.toContain("heroStyles.signal");
    expect(page).not.toContain("Hospitality operating network · Egypt");
    expect(page).not.toContain("Open sourcing areas");
  });

  it("uses a single vignette instead of OLED texture and sheen layers", () => {
    expect(css).toContain(".fade");
    expect(css).toContain("rgba(20, 24, 28");
    expect(css).toContain("var(--cobalt-600)");
    expect(css).not.toContain(".oled");
    expect(css).not.toContain("oledTexture");
    expect(css).not.toContain("oledSheen");
    expect(css).not.toContain("feTurbulence");
    expect(css).not.toMatch(/#7c3aed|#a855f7|purple/i);
  });

  it("keeps mobile copy readable against the photo plane", () => {
    expect(css).toContain("align-items: end");
    expect(css).toContain("rgba(20, 24, 28, 0.92) 100%");
  });
});
