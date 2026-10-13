// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import ProductDetailClient from "../../components/marketplace/product-detail-client";
import MarketplacePage from "../../components/marketplace/marketplace-client";
import type { MarketplaceProduct } from "../../lib/marketplace/category-mapper";

const mocks = vi.hoisted(() => ({ addItem: vi.fn() }));
vi.mock("../../components/cart/cart-context", () => ({ useCart: () => ({ addItem: mocks.addItem, openCart: vi.fn(), totalItems: 0 }) }));
vi.mock("../../lib/i18n/hooks/use-translation", () => ({ useTranslation: () => ({ t: (key: string) => key === "priceUnavailable" ? "Price unavailable" : key, locale: "en" }) }));
vi.mock("../../components/layout/marketing-nav", () => ({ MarketingNav: () => null }));
vi.mock("../../components/layout/marketing-footer", () => ({ MarketingFooter: () => null }));
vi.mock("../../components/shared/language-switcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }));

const product: MarketplaceProduct = {
  id: "test-product", name: "Test towels", sku: "TEST", description: "Test only",
  category: "ose", prismaCategory: "CONSUMABLES", subcategory: null, unitPrice: null, basePrice: null, pricingMode: "FIXED", rfqThresholdQty: null,
  currency: "EGP", unitOfMeasure: "piece", stockQuantity: 20, minOrderQty: 1, leadTimeDays: 2,
  shelfLifeDays: null, temperatureReq: null, status: "ACTIVE",
  images: [], supplierId: "test-supplier", supplierName: "Test supplier", supplierTier: "CORE",
  supplierCity: "Cairo", supplierRating: 4, supplierReviewCount: 1,
};
let root: Root | undefined;
function render(price: number | null) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(createElement(ProductDetailClient, { product: { ...product, unitPrice: price } })));
}
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.replaceChildren(); mocks.addItem.mockClear(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("private product missing-price safety", () => {
  it("shows unavailable instead of free and disables cart addition", () => {
    render(null);
    expect(document.body.textContent).toContain("Price unavailable");
    expect(document.body.textContent).not.toContain("EGP 0");
    const button = [...document.querySelectorAll("button")].find(item => item.textContent?.includes("addToCart"))!;
    expect(button.disabled).toBe(true);
    act(() => button.click());
    expect(mocks.addItem).not.toHaveBeenCalled();
  });
  it("keeps missing prices unavailable when member presentation is selected", () => {
    render(null);
    const button = [...document.querySelectorAll("button")].find(item => item.textContent?.includes("member"))!;
    expect(button).toBeDefined();
    act(() => button.click());
    expect(document.body.textContent).toContain("Price unavailable");
    expect(mocks.addItem).not.toHaveBeenCalled();
  });
  it("preserves a provided price in cart payloads", () => {
    render(80);
    const button = [...document.querySelectorAll("button")].find(item => item.textContent?.includes("addToCart"))!;
    expect(button.disabled).toBe(false);
    act(() => button.click());
    expect(mocks.addItem).toHaveBeenCalledWith(expect.objectContaining({ price: 80, unitPrice: 80 }));
  });
});

const listings: MarketplaceProduct[] = [
  { ...product, id: "unknown", name: "Unknown price towels" },
  { ...product, id: "high", name: "High price towels", unitPrice: 200 },
  { ...product, id: "low", name: "Low price towels", unitPrice: 80 },
];
async function renderListing() {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: true, data: { products: listings, pagination: { total: listings.length } } }) }));
  const container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(createElement(MarketplacePage)));
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  expect(document.querySelectorAll("h3")).toHaveLength(3);
}
const listingNames = () => [...document.querySelectorAll("h3")]
  .filter(item => item.textContent !== "noResults")
  .map(item => item.textContent);
const buttonNamed = (text: string) => [...document.querySelectorAll("button")].find(item => item.textContent?.trim() === text)!;
describe("private listing missing-price safety", () => {
  it.each([
    ["price_low", ["Low price towels", "High price towels", "Unknown price towels"]],
    ["price_high", ["High price towels", "Low price towels", "Unknown price towels"]],
  ])("sorts unknown prices last for %s", async (sort, expected) => {
    await renderListing();
    const select = document.querySelector("select")!;
    act(() => { select.value = sort as string; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(listingNames()).toEqual(expected);
  });
  it.each([
    ["Under 100 EGP", ["Low price towels"]],
    ["100-500 EGP", ["High price towels"]],
    ["500-1K EGP", []],
    ["1K+ EGP", []],
  ])("excludes unknown prices from %s", async (filter, expected) => {
    await renderListing();
    act(() => buttonNamed("Price").click());
    act(() => buttonNamed(filter as string).click());
    expect(listingNames()).toEqual(expected);
  });
  it("shows unavailable and prevents adding an unknown-price listing", async () => {
    await renderListing();
    const link = document.querySelector('a[href="/marketplace/unknown"]')!;
    const button = link.parentElement!.querySelector("button")!;
    expect(button.disabled).toBe(true);
    expect(document.body.textContent).toContain("Price unavailable");
    expect(document.body.textContent).not.toContain("EGP 0");
    act(() => button.click());
    expect(mocks.addItem).not.toHaveBeenCalled();
    const pricedLink = document.querySelector('a[href="/marketplace/low"]')!;
    act(() => pricedLink.parentElement!.querySelector("button")!.click());
    expect(mocks.addItem).toHaveBeenCalledWith(expect.objectContaining({ productId: "low", price: 80 }));
  });
});
