// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  sendEmailCode: vi.fn(),
  verifyEmailCode: vi.fn(),
  finalize: vi.fn(),
  replace: vi.fn(),
  fetch: vi.fn(),
  authStatus: "complete",
  fetchStatus: "idle",
}));

vi.mock("@clerk/nextjs", () => ({
  useSignUp: () => ({
    fetchStatus: mocks.fetchStatus,
    signUp: {
      create: mocks.create,
      verifications: {
        sendEmailCode: mocks.sendEmailCode,
        verifyEmailCode: mocks.verifyEmailCode,
      },
      finalize: mocks.finalize,
      status: mocks.authStatus,
    },
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", props, children) }));
vi.mock("@/lib/security/csrf-client", () => ({ getCsrfToken: () => "test-csrf-token" }));

import RegisterPage from "../../app/(auth)/register/page";

// Use React's DOM test API directly: this checkout has @testing-library/react
// installed but its @testing-library/dom peer is missing. No dependencies or
// application configuration are changed by these isolated component tests.
const roots: Root[] = [];
function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(element));
  return { container };
}
function cleanup() {
  act(() => { roots.splice(0).forEach(root => root.unmount()); });
  document.body.replaceChildren();
}
async function waitFor(assertion: () => void) {
  let failure: unknown;
  for (let attempt = 0; attempt < 100; attempt++) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    try { assertion(); return; } catch (error) { failure = error; }
  }
  throw failure;
}
const selectors: Record<string, string> = { button: "button", link: "a", group: "fieldset", alert: '[role="alert"]' };
const screen = {
  getByRole(role: string, options?: { name: string | RegExp }) {
    const element = [...document.querySelectorAll<HTMLElement>(selectors[role])].find(candidate => {
      if (!options) return true;
      const name = (role === "group" ? candidate.querySelector("legend")?.textContent : candidate.textContent)?.trim() || "";
      return typeof options.name === "string" ? name === options.name : options.name.test(name);
    });
    if (!element) throw new Error(`Missing ${role}: ${String(options?.name ?? "")}`);
    return element;
  },
  getByLabelText(text: string) {
    const label = [...document.querySelectorAll<HTMLLabelElement>("label")].find(item => item.textContent?.trim() === text);
    const element = label && document.getElementById(label.htmlFor);
    if (!element) throw new Error(`Missing labelled field: ${text}`);
    return element;
  },
  getByText(text: RegExp) {
    const element = [...document.querySelectorAll("p")].find(item => text.test(item.textContent || ""));
    if (!element) throw new Error(`Missing text: ${text}`);
    return element;
  },
  async findByRole(role: string, options?: { name: string | RegExp }) {
    await waitFor(() => { screen.getByRole(role, options); });
    return screen.getByRole(role, options);
  },
  async findByLabelText(text: string) {
    await waitFor(() => { screen.getByLabelText(text); });
    return screen.getByLabelText(text);
  },
};
const fireEvent = {
  click(element: HTMLElement) { act(() => element.click()); },
  submit(form: HTMLFormElement) { act(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }); },
  change(element: HTMLElement, event: { target: { value: string } }) {
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, event.target.value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
  },
};

async function createAccount(role = "Hotel") {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${role}`) }));
  fireEvent.change(screen.getByLabelText("Your name or company name"), { target: { value: "Sample Hotel" } });
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "staff@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password-123" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);
  await screen.findByLabelText("Verification code");
}

function submitCode() {
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
  fireEvent.submit(screen.getByRole("button", { name: "Verify and continue" }).closest("form")!);
}

describe("registration presentation with existing custom authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchStatus = "idle";
    mocks.authStatus = "complete";
    mocks.create.mockResolvedValue({ error: null });
    mocks.sendEmailCode.mockResolvedValue({ error: null });
    mocks.verifyEmailCode.mockResolvedValue({ error: null });
    mocks.finalize.mockResolvedValue({ error: null });
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", mocks.fetch);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("shows role choices before fields, accessible labels and no nested main landmark", () => {
    const { container } = render(React.createElement(RegisterPage));
    const roleGroup = screen.getByRole("group", { name: "I am joining as" });
    const nameField = screen.getByLabelText("Your name or company name");
    expect(roleGroup.compareDocumentPosition(nameField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Hotel/ }).getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("main")).toBeNull();
    expect(container.querySelector("#clerk-captcha")).not.toBeNull();
    expect(screen.getByLabelText("Work email").getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("new-password");
    expect(screen.getByText(/Selecting a role does not grant workspace access/)).toBeTruthy();
  });

  it("keeps legal, contact, help and existing-login destinations visible", () => {
    render(React.createElement(RegisterPage));
    for (const [label, href] of [["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"], ["Help with signup", "/support"], ["Sign in", "/login"]]) {
      expect(screen.getByRole("link", { name: label }).getAttribute("href")).toBe(href);
    }
  });

  it("preserves supplier selection, signup payload and email-code step", async () => {
    render(React.createElement(RegisterPage));
    await createAccount("Supplier");
    expect(mocks.create).toHaveBeenCalledWith({
      emailAddress: "staff@example.test", password: "test-password-123",
      firstName: "Sample", lastName: "Hotel",
      unsafeMetadata: { platformRole: "SUPPLIER", companyName: "Sample Hotel" },
    });
    expect(mocks.sendEmailCode).toHaveBeenCalledOnce();
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("preserves verification, session finalization and CSRF-protected provisioning before onboarding", async () => {
    render(React.createElement(RegisterPage));
    await createAccount();
    submitCode();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/onboarding"));
    expect(mocks.verifyEmailCode).toHaveBeenCalledWith({ code: "123456" });
    expect(mocks.finalize).toHaveBeenCalledOnce();
    expect(mocks.fetch).toHaveBeenCalledWith("/api/v1/auth/clerk-sync", {
      method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": "test-csrf-token" },
    });
    expect(mocks.verifyEmailCode.mock.invocationCallOrder[0]).toBeLessThan(mocks.finalize.mock.invocationCallOrder[0]);
    expect(mocks.finalize.mock.invocationCallOrder[0]).toBeLessThan(mocks.fetch.mock.invocationCallOrder[0]);
    expect(mocks.fetch.mock.invocationCallOrder[0]).toBeLessThan(mocks.replace.mock.invocationCallOrder[0]);
  });

  it("does not proceed when verification is incomplete", async () => {
    mocks.authStatus = "missing_requirements";
    render(React.createElement(RegisterPage));
    await createAccount();
    submitCode();
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Verification is not complete yet. Follow the email verification steps.");
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("keeps failed provisioning visible and retries before allowing onboarding", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, error: "Workspace setup pending" }) });
    render(React.createElement(RegisterPage));
    await createAccount();
    submitCode();
    const retry = await screen.findByRole("button", { name: "Retry workspace setup" });
    expect(screen.getByRole("alert").textContent).toBe("Workspace setup pending");
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(retry);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/onboarding"));
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.finalize).toHaveBeenCalledOnce();
  });

  it.each([
    [{ longMessage: "Detailed error", message: "Short error" }, "Detailed error"],
    [{ message: "Short error" }, "Short error"],
    [{ longMessage: "", message: "Short error" }, "Short error"],
    [{ longMessage: 3, message: { unsafe: true } }, "Unable to create the account."],
    [null, "Unable to create the account."],
    ["Unexpected provider failure", "Unable to create the account."],
  ])("shows signup error %j safely without proceeding", async (providerError, expectedMessage) => {
    mocks.create.mockRejectedValueOnce(providerError);
    render(React.createElement(RegisterPage));
    fireEvent.change(screen.getByLabelText("Your name or company name"), { target: { value: "Sample Hotel" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "staff@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password-123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toBe(expectedMessage);
    expect(mocks.sendEmailCode).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it.each([
    [{ longMessage: "Detailed verification error", message: "Short verification error" }, "Detailed verification error"],
    [{ message: "Short verification error" }, "Short verification error"],
    [null, "Verification failed."],
  ])("shows verification error %j safely without finalization", async (providerError, expectedMessage) => {
    mocks.verifyEmailCode.mockRejectedValueOnce(providerError);
    render(React.createElement(RegisterPage));
    await createAccount();
    submitCode();
    expect((await screen.findByRole("alert")).textContent).toBe(expectedMessage);
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not allow submission while Clerk is loading", () => {
    mocks.fetchStatus = "fetching";
    render(React.createElement(RegisterPage));
    expect((screen.getByRole("button", { name: "Create account" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
