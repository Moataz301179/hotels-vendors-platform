import { describe, expect, it } from "vitest";
import { hotelCommodityBoard, reviewBundlePromotions } from "./commodities";

describe("hotel commodity board", () => {
  it("keeps Arabic names and indicative prices without supplier identity", () => {
    expect(hotelCommodityBoard.length).toBeGreaterThanOrEqual(8);
    for (const item of hotelCommodityBoard) {
      expect(item.nameAr.length).toBeGreaterThan(1);
      expect(item.price).toBeGreaterThan(0);
      expect(JSON.stringify(item)).not.toMatch(/supplier|vendor|مورّد-/i);
    }
  });

  it("keeps catalogue promotions anonymous", () => {
    expect(reviewBundlePromotions.length).toBeGreaterThanOrEqual(2);
    for (const promo of reviewBundlePromotions) {
      expect(promo.titleAr.length).toBeGreaterThan(1);
      expect(promo.unitHintEn.toLowerCase()).toContain("no supplier");
      expect(promo.unitHintAr).toContain("بلا مورّد");
    }
  });
});
