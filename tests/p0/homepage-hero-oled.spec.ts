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
    expect(page).toContain("We are the full operating network for hotel procurement.");
    expect(page).not.toContain("One operating record for hotel purchasing");
    expect(page).toContain("See how it works");
    expect(page).not.toContain('heroStyles.brand');
    expect(page).not.toContain("Technology reimagined for hotel procurement");
    expect(page).not.toContain("Hospitality operating network");
    expect(page).not.toContain("Authorized hospitality imagery");
    expect(page).not.toContain("Built for operators");
  });

  it("keeps the approved cobalt/charcoal palette in the OLED treatment", () => {
    expect(css).toContain("rgba(48, 50, 52");
    expect(css).toContain("rgba(91, 146, 254");
    expect(css).toContain("var(--cobalt-600)");
    expect(css).not.toMatch(/#7c3aed|#a855f7|purple/i);
  });

  it("overlays hero type in white on a dark wash — cobalt only on the CTA", () => {
    expect(css).not.toMatch(/\.brand\s*\{/);
    expect(css).toMatch(/\.copy h1\s*\{[^}]*color:\s*#fff/s);
    expect(css).toMatch(/\.copy h1 em\s*\{[^}]*color:\s*inherit/s);
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*color:\s*rgba\(157,\s*195,\s*230/s);
    expect(css).toMatch(/\.primary\s*\{[^}]*background:\s*var\(--cobalt-600\)/s);
    expect(css).not.toMatch(/\.copy h1\s*\{[^}]*color:\s*var\(--ink\)/s);
    expect(css).not.toMatch(/\.copy h1 em\s*\{[^}]*color:\s*var\(--cobalt/s);
    expect(css).not.toMatch(/color:\s*var\(--amber\)/i);
  });

  it("keeps a dark charcoal band under bottom-aligned mobile copy", () => {
    expect(css).toContain("Copy is bottom-aligned below 950px");
    expect(css).toContain("#303234 100%");
    expect(css).toContain("align-items: end");
  });

  it("offers the Arabic 48-hour funder pathway without claiming HV lends", () => {
    expect(page).toContain('lang="ar"');
    expect(page).toContain('dir="rtl"');
    expect(page).toContain("خيار للمورّد: الحصول على مستحقاته خلال ٤٨ ساعة عبر ممولي الشبكة");
    expect(page).toContain("HotelsVendors does not lend");
    expect(page).toContain("/solutions/funders");
    expect(page).not.toMatch(/HotelsVendors disburses/i);
  });
});
