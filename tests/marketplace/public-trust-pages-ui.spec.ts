// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import ContactPage from "../../app/(marketing)/contact/page";
import SupportPage from "../../app/(marketing)/support/page";
import PricingPage from "../../app/(marketing)/pricing/page";

vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }));
vi.mock("@/lib/seo", () => ({ canonicalUrl: (path: string) => `https://www.hotelsvendors.com${path}` }));

let root: Root | undefined;
function mountContact() {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(createElement(ContactPage)));
}
function fill(id: string, value: string) {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("public trust and pricing content", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
  afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.replaceChildren(); vi.unstubAllGlobals(); });

  it.each([ContactPage, SupportPage, PricingPage])("uses the scoped neutral public presentation", (Page) => {
    const html = renderToStaticMarkup(createElement(Page));
    expect(html).toContain("hv-maintenance-public");
    expect(html).not.toContain("#0c0c12");
    expect(html).not.toContain("#c8a86b");
  });

  it("removes dummy phone/social links and response-deadline promises", () => {
    const html = renderToStaticMarkup(createElement(ContactPage));
    expect(html).not.toContain("XXX");
    expect(html).not.toContain("https://linkedin.com");
    expect(html).not.toContain("https://x.com");
    expect(html).not.toContain("24 business hours");
    expect(html).toContain("Request a call");
    expect(html).toContain("mailto:info@hotelsvendors.com");
  });

  it("labels contact inputs and preserves the existing transport through a mocked submission", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    mountContact();
    for (const id of ["contact-name", "contact-email", "contact-company", "contact-phone", "contact-message"]) {
      expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(document.getElementById(id)).not.toBeNull();
    }
    fill("contact-name", "Test buyer");
    fill("contact-email", "buyer@example.test");
    fill("contact-company", "Test hotel");
    fill("contact-message", "Please confirm the sourcing entry path.");
    await act(async () => { document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/v1/contact");
    expect(request?.method).toBe("POST");
    expect(JSON.parse(request!.body as string)).toMatchObject({ name: "Test buyer", email: "buyer@example.test", company: "Test hotel", message: "Please confirm the sourcing entry path." });
    expect(document.querySelector('[role="status"]')?.textContent).toContain("Message Sent");
    expect(document.body.textContent).not.toContain("24 business hours");
  });

  it("announces a failed mocked contact submission without claiming success", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: "Unable to send. Please try again." }) } as Response);
    mountContact();
    await act(async () => { document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("Unable to send");
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it("does not promise free plans, full compliance or funded approval on Support", () => {
    const html = renderToStaticMarkup(createElement(SupportPage));
    expect(html).not.toContain("within one business day");
    expect(html).not.toContain("compliant by default");
    expect(html).not.toContain("begin using the platform free");
    expect(html).toContain("independent funders");
    expect(html).toContain("not a funding commitment");
    expect(html).toContain('href="/contact"');
  });

  it("explains written pricing terms without inventing plans or rates", () => {
    const html = renderToStaticMarkup(createElement(PricingPage));
    for (const promise of ["No Per-Transaction Fees", "Get Started Free", "50 orders/month", "net-60", "Most Popular", "Unlimited orders", "Full ETA compliance"]) expect(html).not.toContain(promise);
    expect(html).toContain("platform fee");
    expect(html).toContain("delivery");
    expect(html).toContain("funding");
    expect(html).toContain("written confirmation");
    expect(html).not.toContain('href="/register"');
    expect(html).toContain('href="/contact"');
  });
});
