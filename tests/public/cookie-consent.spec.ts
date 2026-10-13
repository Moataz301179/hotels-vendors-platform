// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CookieConsentBanner } from "../../components/shared/cookie-consent-banner";

const consentKey = "hv-cookie-consent";
const roots: Root[] = [];

function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(React.createElement(CookieConsentBanner)));
  return container;
}
function dialog(container: HTMLElement) { return container.querySelector('[role="dialog"][aria-label="Cookie consent"]'); }

describe("cookie consent presentation and existing persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(XMLHttpRequest.prototype, "open");
  });
  afterEach(() => {
    act(() => roots.splice(0).forEach(root => root.unmount()));
    document.body.replaceChildren();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers all three choices when no consent has been stored", () => {
    const container = mount();
    expect(dialog(container)).not.toBeNull();
    expect([...container.querySelectorAll("button")].map(button => button.textContent?.trim())).toEqual(["Essential Only", "+ Analytics", "Accept All"]);
    expect(localStorage.getItem(consentKey)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
  });

  it.each([
    ["Essential Only", "essential"],
    ["+ Analytics", "analytics"],
    ["Accept All", "all"],
  ])("persists %s as %s and dismisses without external calls", (label, level) => {
    const container = mount();
    const button = [...container.querySelectorAll("button")].find(item => item.textContent?.trim() === label)!;
    const earliestTimestamp = Date.now();
    act(() => button.click());
    const consent = JSON.parse(localStorage.getItem(consentKey)!);
    expect(consent.level).toBe(level);
    expect(consent.timestamp).toBeGreaterThanOrEqual(earliestTimestamp);
    expect(consent.timestamp).toBeLessThanOrEqual(Date.now());
    expect(dialog(container)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(XMLHttpRequest.prototype.open).not.toHaveBeenCalled();
    expect(dialog(mount())).toBeNull();
  });

  it.each(["essential", "analytics", "all"])("keeps the banner hidden for preexisting %s consent", level => {
    const original = JSON.stringify({ level, timestamp: 123456 });
    localStorage.setItem(consentKey, original);
    expect(dialog(mount())).toBeNull();
    expect(localStorage.getItem(consentKey)).toBe(original);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("recovers the banner when stored JSON is malformed", () => {
    localStorage.setItem(consentKey, "{malformed");
    expect(dialog(mount())).not.toBeNull();
  });

  it("updates for consent changes made by another tab", () => {
    const container = mount();
    act(() => {
      localStorage.setItem(consentKey, JSON.stringify({ level: "essential", timestamp: 123456 }));
      window.dispatchEvent(new StorageEvent("storage", { key: consentKey }));
    });
    expect(dialog(container)).toBeNull();
    act(() => {
      localStorage.removeItem(consentKey);
      window.dispatchEvent(new StorageEvent("storage", { key: consentKey }));
    });
    expect(dialog(container)).not.toBeNull();
  });

  it("hydrates server output without mismatch, then shows the missing-consent choice", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(React.createElement(CookieConsentBanner));
    expect(container.innerHTML).toBe("");
    document.body.append(container);
    const recoverableErrors: unknown[] = [];
    await act(async () => {
      roots.push(hydrateRoot(container, React.createElement(CookieConsentBanner), {
        onRecoverableError: error => recoverableErrors.push(error),
      }));
    });
    expect(recoverableErrors).toEqual([]);
    expect(dialog(container)).not.toBeNull();
  });
});
