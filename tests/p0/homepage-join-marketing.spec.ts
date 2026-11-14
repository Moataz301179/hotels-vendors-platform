import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/(marketing)/page.tsx", "utf8");
const css = readFileSync("app/(marketing)/public-home.module.css", "utf8");

describe("homepage join marketing", () => {
  it("replaces the rejected directory and operating-network copy", () => {
    expect(page).not.toContain("Nothing suitable in the directory?");
    expect(page).not.toContain("Enter the operating network");
    expect(page).not.toContain("Open a workspace that matches your responsibility.");
    expect(page).not.toContain("Create hotel workspace");
    expect(page).not.toContain("Create vendor workspace");
    expect(page).not.toContain("Receiving operator");
    expect(page).not.toContain("View HOVIN workflow");

    expect(page).not.toContain("Can&apos;t find the right product yet?");
    expect(page).not.toContain("Custom demand");
    expect(page).not.toContain("When the catalogue ends, keep the trail intact.");
    expect(page).not.toContain("Open a sealed requirement");
    expect(page).not.toContain("Sealed requirement");
    expect(page).toContain("Join the network");
    expect(page).toContain("Register your hotel");
    expect(page).toContain("Register as a vendor");
    expect(page).toContain("See how HOVIN works");
    expect(page).toContain("Vendor identity stays sealed until the authorized stage");
  });

  it("does not render the removed sealed-requirement strip", () => {
    expect(page).not.toContain("styles.requirement");
    expect(css).not.toMatch(/\.requirement\{/);
    expect(css).not.toMatch(/\.requirementCta\{/);
  });

  it("keeps hotel and vendor self-serve registration destinations", () => {
    expect(page).toContain('href: "/hotels/signup"');
    expect(page).toContain('href: "/suppliers/signup"');
    expect(page).toContain('href: "/hovin"');
  });

  it("uses warm paper for the join band — not the rejected charcoal fill", () => {
    expect(css).toMatch(/\.join\{[^}]*background:var\(--paper-100\)/s);
    expect(css).toMatch(/\.join h2\{[^}]*color:var\(--ink\)/s);
    expect(css).not.toMatch(/\.join\{[^}]*background:var\(--charcoal\)/s);
  });

  it("presents join paths as image-backed cards, not icon list rows", () => {
    expect(page).toContain("/hv-procurement-team.webp");
    expect(page).toContain("/category-supplier-catalogue.png");
    expect(page).toContain("/hovin-receiving-field.jpg");
    expect(page).toContain("joinPathMedia");
    expect(css).toMatch(/\.joinPaths\{[^}]*grid-template-columns:repeat\(3/s);
    expect(css).toMatch(/\.joinPathMedia\{[^}]*aspect-ratio/s);
    expect(css).not.toMatch(/\.joinPaths\{[^}]*border-top:1px solid var\(--line\)/s);
  });
});
