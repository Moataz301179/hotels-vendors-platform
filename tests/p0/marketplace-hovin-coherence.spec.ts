import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  marketplaceCategoryHref,
  marketplaceSearchHref,
  PROCUREMENT_JOURNEY,
  PUBLIC_NAV_LINKS,
} from "@/lib/marketing/procurement-journey";

const root = process.cwd();

describe("marketplace / public / HOVIN coherence", () => {
  it("keeps catalogue search, category deep-links and receiving handoffs on one journey", () => {
    expect(marketplaceSearchHref("rice")).toBe("/marketplace?q=rice");
    expect(marketplaceCategoryHref("Restaurants & bars")).toBe(
      "/marketplace?category=Restaurants%20%26%20bars",
    );
    expect(PROCUREMENT_JOURNEY.hotelList.href).toBe("/workspace/marketplace/basket");
    expect(PROCUREMENT_JOURNEY.receivingWeb.href).toBe("/orders?view=receiving");
    expect(PROCUREMENT_JOURNEY.receivingLogin.href).toContain("orders%3Fview%3Dreceiving");
    expect(PUBLIC_NAV_LINKS.some((link) => link.href === "/hovin")).toBe(true);
  });

  it("wires marketplace searchParams.q into the directory and keeps solutions on public role pages", () => {
    const marketplace = readFileSync(resolve(root, "app/(marketing)/marketplace/page.tsx"), "utf8");
    const directory = readFileSync(resolve(root, "components/marketing/marketplace-directory.tsx"), "utf8");
    const solutions = readFileSync(resolve(root, "app/(marketing)/solutions/page.tsx"), "utf8");
    const home = readFileSync(resolve(root, "app/(marketing)/page.tsx"), "utf8");
    const hovin = readFileSync(resolve(root, "app/(marketing)/hovin/page.tsx"), "utf8");
    const downloadApp = readFileSync(resolve(root, "components/marketing/download-hovin-app.tsx"), "utf8");
    const layout = readFileSync(resolve(root, "app/(marketing)/layout.tsx"), "utf8");
    const about = readFileSync(resolve(root, "app/(marketing)/about/page.tsx"), "utf8");

    expect(marketplace).toContain("initialQuery");
    expect(marketplace).toContain("query.q");
    expect(directory).toContain("initialQuery");
    expect(directory).toContain("PROCUREMENT_JOURNEY.hotelList.href");
    expect(solutions).toContain("/solutions/hotels");
    expect(solutions).toContain("/solutions/suppliers");
    expect(solutions).toContain("/solutions/carriers");
    expect(solutions).toContain("/solutions/funders");
    expect(solutions).not.toContain("href: '/intelligence'");
    expect(solutions).not.toContain("href: '/suppliers'");
    expect(home).toContain("HovinReceivingPreview");
    expect(home).toContain("OPERATING_GROUPS");
    expect(home).toContain("PROCUREMENT_JOURNEY");
    expect(home).not.toContain("<main");
    expect(hovin).toContain("HovinReceivingPreview");
    expect(hovin).toContain("RECEIVING_ROLE_REQUIRED");
    expect(downloadApp).toContain("NEXT_PUBLIC_ANDROID_DOWNLOAD_URL");
    expect(downloadApp).not.toContain("Download HOVIN App on the Apple App Store");
    expect(downloadApp).not.toContain("Get HOVIN App on Google Play");
    expect(downloadApp).toContain("receivingLogin");
    expect(layout).toContain('<main id="main-content">');
    expect(about).toContain('<div className="hv-public-page">');
    expect(about).not.toContain("<main");
  });
});
