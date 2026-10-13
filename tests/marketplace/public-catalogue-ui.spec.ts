// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import MarketplaceClient from "../../app/(marketing)/marketplace/marketplace-client";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }));

const listing = {
  id: "supplier-product-1", name: "Hotel towels", category: "ose",
  supplierName: "Textile Supplier", unitPrice: 80, pricingMode: "FIXED", unitOfMeasure: "piece",
};
const response = (products: unknown[]) => ({ ok: true, json: async () => ({ success: true, data: { products } }) });
let root: Root | undefined;
function render(element: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(element));
  return { unmount: () => { act(() => root?.unmount()); root = undefined; } };
}
function byRole(role: string, options?: { name: string }) {
  const selector = role === "link" ? "a[href]" : role === "button" ? "button" : role === "textbox" ? "input[type=text]" : `[role="${role}"]`;
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => !options || (element.getAttribute("aria-label") || element.textContent) === options.name) || null;
}
function byText(text: string | RegExp) {
  return Array.from(document.querySelectorAll<HTMLElement>("body *")).find((element) =>
    element.children.length === 0 && (typeof text === "string" ? element.textContent === text : text.test(element.textContent || ""))
  ) || null;
}
async function waitFor(check: () => void) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
    try { check(); return; } catch (error) { if (attempt === 19) throw error; }
  }
}
const screen = {
  queryByRole: byRole,
  getByRole(role: string, options?: { name: string }) { const element = byRole(role, options); expect(element).not.toBeNull(); return element!; },
  queryByText: byText,
  getByText(text: string | RegExp) { const element = byText(text); expect(element).not.toBeNull(); return element!; },
  async findByRole(role: string, options?: { name: string }) { await waitFor(() => expect(byRole(role, options)).not.toBeNull()); return byRole(role, options)!; },
  async findByText(text: string) { await waitFor(() => expect(byText(text)).not.toBeNull()); return byText(text)!; },
};
const fireEvent = {
  click(element: HTMLElement) { act(() => element.click()); },
  change(element: HTMLElement, event: { target: { value: string } }) {
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, event.target.value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
  },
};

describe("public catalogue states", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
  afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.replaceChildren(); vi.unstubAllGlobals(); });

  it("announces loading without reporting zero inventory", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(createElement(MarketplaceClient));
    expect(screen.getByRole("status").textContent).toContain("Loading verified supplier listings");
    expect(screen.queryByText("0 verified listings")).toBeNull();
  });

  it("offers distinct buyer and supplier next steps for a genuine empty catalogue", async () => {
    vi.mocked(fetch).mockResolvedValue(response([]) as Response);
    render(createElement(MarketplaceClient));
    expect(await screen.findByText("No verified supplier listings are published yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Discuss hotel sourcing needs" }).getAttribute("href")).toBe("/contact");
    const supplierLinks = Array.from(document.querySelectorAll("a")).filter(link => link.textContent?.trim() === "Choose supplier registration");
    expect(supplierLinks).toHaveLength(3);
    expect(supplierLinks.every(link => link.getAttribute("href") === "/register")).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reports HTTP failure as unavailable and retries successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response).mockResolvedValueOnce(response([listing]) as Response);
    render(createElement(MarketplaceClient));
    expect((await screen.findByRole("alert")).textContent).toContain("couldn't load the catalogue");
    expect(screen.queryByText("No verified supplier listings are published yet.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "View Hotel towels supplier terms" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    { success: false, data: { products: [] } },
    { success: true, data: {} },
    { success: true, data: { products: [null] } },
  ])("does not describe malformed/unsuccessful API responses as empty", async (body) => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => body } as Response);
    render(createElement(MarketplaceClient));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("0 verified listings")).toBeNull();
  });

  it("reports network failures without exposing exception details", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Internal connection detail"));
    render(createElement(MarketplaceClient));
    await screen.findByRole("alert");
    expect(screen.queryByText(/Internal connection detail/)).toBeNull();
  });

  it("shows real products, distinguishes no search matches, and restores results", async () => {
    vi.mocked(fetch).mockResolvedValue(response([listing]) as Response);
    render(createElement(MarketplaceClient));
    const product = await screen.findByRole("link", { name: "View Hotel towels supplier terms" });
    expect(product.getAttribute("href")).toBe("/marketplace/supplier-product-1");
    expect(screen.getByText("EGP 80/piece")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Search supplier listings" }), { target: { value: "not-in-catalogue" } });
    expect(screen.getByText("No listings match your search.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "View Hotel towels supplier terms" })).toBeTruthy());
  });

  it("preserves quote-only pricing without inventing a number", async () => {
    vi.mocked(fetch).mockResolvedValue(response([{ ...listing, unitPrice: null, pricingMode: "RFQ" }]) as Response);
    render(createElement(MarketplaceClient));
    expect(await screen.findByText("Request supplier quote")).toBeTruthy();
    expect(screen.queryByText(/EGP 0/)).toBeNull();
  });

  it("aborts its request when the page unmounts", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const { unmount } = render(createElement(MarketplaceClient));
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
