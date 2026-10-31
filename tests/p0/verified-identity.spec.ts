import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  current: vi.fn(),
  user: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: m.auth, currentUser: m.current }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.user }, $transaction: m.transaction } }));
import { getActor, getOnboardingActor } from "@/lib/v2-auth";

const verifiedClerkUser = (email: string, overrides: Record<string, unknown> = {}) => ({
  primaryEmailAddressId: "primary",
  emailAddresses: [{ id: "primary", emailAddress: email, verification: { status: "verified" } }],
  ...overrides,
});

describe("identity boundary: pending users and verified email", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.auth.mockResolvedValue({ userId: "clerk-user" });
    m.user.mockResolvedValue({ id: "u", platformRole: "SUPPLIER", tenantId: "own", status: "ACTIVE", deletedAt: null });
  });

  it("getActor rejects an ACTIVE user with an unverified primary email", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("admin@example.com", { emailAddresses: [{ id: "primary", emailAddress: "admin@example.com", verification: { status: "unverified" } }] }));
    expect(await getActor()).toBeNull();
    expect(m.user).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
  });

  it("getActor uses the verified primary email, not the first address or browser metadata", async () => {
    m.current.mockResolvedValue({
      primaryEmailAddressId: "primary",
      unsafeMetadata: { platformRole: "ADMIN" },
      emailAddresses: [
        { id: "secondary", emailAddress: "admin@example.com", verification: { status: "verified" } },
        { id: "primary", emailAddress: "Supplier@Example.com", verification: { status: "verified" } },
      ],
    });
    expect(await getActor()).toMatchObject({ platformRole: "SUPPLIER", tenantId: "own" });
    expect(m.user).toHaveBeenCalledWith({ where: { email: "supplier@example.com" } });
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("getActor rejects suspended database users", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ status: "SUSPENDED" });
    expect(await getActor()).toBeNull();
  });

  it("getActor rejects a deleted user", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ id: "u", status: "ACTIVE", deletedAt: new Date() });
    expect(await getActor()).toBeNull();
  });

  it("getActor REJECTS a pending-verification user — the general path is not a bypass", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("pending@example.com", { emailAddresses: [{ id: "primary", emailAddress: "pending@example.com", verification: { status: "unverified" } }] }));
    m.user.mockResolvedValue({ id: "u", platformRole: "HOTEL", tenantId: "own", status: "PENDING_VERIFICATION", deletedAt: null });
    expect(await getActor()).toBeNull();
  });

  it("getOnboardingActor ALLOWS a pending-verification user so the handoff can route to onboarding", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("pending@example.com", { emailAddresses: [{ id: "primary", emailAddress: "pending@example.com", verification: { status: "unverified" } }] }));
    m.user.mockResolvedValue({ id: "u", platformRole: "HOTEL", tenantId: "own", status: "PENDING_VERIFICATION", deletedAt: null });
    expect(await getOnboardingActor()).toMatchObject({ status: "PENDING_VERIFICATION" });
  });

  it("getOnboardingActor still rejects an ACTIVE user with an unverified email", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("admin@example.com", { emailAddresses: [{ id: "primary", emailAddress: "admin@example.com", verification: { status: "unverified" } }] }));
    m.user.mockResolvedValue({ id: "u", platformRole: "HOTEL", tenantId: "own", status: "ACTIVE", deletedAt: null });
    expect(await getOnboardingActor()).toBeNull();
  });

  it("getOnboardingActor rejects an unauthenticated Clerk session", async () => {
    m.auth.mockResolvedValue({ userId: null });
    expect(await getOnboardingActor()).toBeNull();
    expect(m.user).not.toHaveBeenCalled();
  });

  it("getOnboardingActor allows a verified legacy unbound pending user (email-only, pre-Clerk)", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("legacy@example.com"));
    m.user.mockResolvedValue({ id: "legacy", platformRole: "HOTEL", tenantId: "legacy-tenant", status: "PENDING_VERIFICATION", deletedAt: null, clerkUserId: null });
    expect(await getOnboardingActor()).toMatchObject({ status: "PENDING_VERIFICATION", id: "legacy" });
  });

  it("getOnboardingActor REJECTS an unverified legacy unbound pending user", async () => {
    m.current.mockResolvedValue({
      primaryEmailAddressId: "primary",
      emailAddresses: [{ id: "primary", emailAddress: "legacy@example.com", verification: { status: "unverified" } }],
    });
    m.user.mockResolvedValue({ id: "legacy", platformRole: "HOTEL", tenantId: "legacy-tenant", status: "PENDING_VERIFICATION", deletedAt: null, clerkUserId: null });
    expect(await getOnboardingActor()).toBeNull();
  });
});