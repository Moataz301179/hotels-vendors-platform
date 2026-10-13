// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: Record<string, unknown>) => {
    provider.props = props;
    // Simulate the provider-owned title: the page must not add a second h1.
    return React.createElement("section", { "aria-label": "Clerk sign-in form" }, React.createElement("h1", null, "Sign in"));
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", props, children),
}));

import LoginPage from "../../app/(auth)/login/page";
import NestedLoginPage from "../../app/(auth)/login/[...clerk]/page";

const roots: Root[] = [];
function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(React.createElement(LoginPage)));
  return container;
}

describe("sign-in presentation and provider routing contract", () => {
  it("renders the existing login component for nested Clerk callback steps", () => {
    expect(NestedLoginPage).toBe(LoginPage);
  });
  beforeEach(() => {
    provider.props = {};
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_presentation");
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });
  afterEach(() => {
    act(() => roots.splice(0).forEach(root => root.unmount()));
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it("uses hash routing on the existing non-catch-all login route", () => {
    mount();
    expect(provider.props.routing).toBe("hash");
    expect(provider.props).not.toHaveProperty("path");
  });

  it("preserves registration and fallback destination without forcing private redirects", () => {
    mount();
    expect(provider.props.signUpUrl).toBe("/register");
    expect(provider.props.fallbackRedirectUrl).toBe("/dashboard");
    expect(provider.props).not.toHaveProperty("forceRedirectUrl");
    expect(provider.props).not.toHaveProperty("redirectUrl");
  });

  it("provides contextual copy without a duplicate h1 or nested main", () => {
    const container = mount();
    expect(container.querySelector('section[aria-label="Sign in to your workspace"]')).not.toBeNull();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBe("Sign in");
    expect(container.querySelector("main")).toBeNull();
    expect(container.textContent).toContain("Continue to your organization’s workspace.");
  });

  it("keeps privacy, terms and sign-in support links visible", () => {
    const container = mount();
    const navigation = container.querySelector('nav[aria-label="Sign-in help and policies"]')!;
    expect([...navigation.querySelectorAll("a")].map(link => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Privacy", "/privacy"], ["Terms", "/terms"], ["Help with sign-in", "/support"],
    ]);
  });
});
