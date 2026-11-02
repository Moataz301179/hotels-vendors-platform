import { afterEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  current: vi.fn(),
  user: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: m.auth, currentUser: m.current }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.user }, $transaction: m.transaction } }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));

import { getActor, getOnboardingActor } from "@/lib/v2-auth";
import { requireTenant, tenantWhereClause } from "@/lib/tenant/scope";

const verifiedClerkUser = (email: string, overrides: Record<string, unknown> = {}) => ({
  primaryEmailAddressId: "primary",
  emailAddresses: [{ id: "primary", emailAddress: email, verification: { status: "verified" } }],
  ...overrides,
});

afterEach(() => vi.resetAllMocks());

describe("identity boundary recovery", () => {
  beforeEach(() => {
    m.auth.mockResolvedValue({ userId: "clerk-user" });
    m.user.mockResolvedValue({ id: "u", platformRole: "SUPPLIER", tenantId: "own", status: "ACTIVE", deletedAt: null });
  });

  it("getActor rejects an unverified primary email", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("admin@example.com", {
      emailAddresses: [{ id: "primary", emailAddress: "admin@example.com", verification: { status: "unverified" } }],
    }));
    expect(await getActor()).toBeNull();
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

  it("getActor rejects a clerkUserId mismatch (trusted binding)", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ id: "u", status: "ACTIVE", deletedAt: null, clerkUserId: "other-clerk-id" });
    expect(await getActor()).toBeNull();
  });

  it("getActor allows a legacy row with no clerkUserId", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ id: "u", status: "ACTIVE", deletedAt: null, clerkUserId: null });
    expect(await getActor()).toMatchObject({ id: "u" });
  });

  it("getActor REJECTS a PENDING_VERIFICATION user", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ id: "u", platformRole: "HOTEL", tenantId: "own", status: "PENDING_VERIFICATION", deletedAt: null });
    expect(await getActor()).toBeNull();
  });

  it("getOnboardingActor ALLOWS a PENDING_VERIFICATION user", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("a@example.com"));
    m.user.mockResolvedValue({ id: "u", platformRole: "HOTEL", tenantId: "own", status: "PENDING_VERIFICATION", deletedAt: null });
    expect(await getOnboardingActor()).toMatchObject({ status: "PENDING_VERIFICATION" });
  });

  it("getOnboardingActor rejects an unauthenticated Clerk session", async () => {
    m.auth.mockResolvedValue({ userId: null });
    expect(await getOnboardingActor()).toBeNull();
    expect(m.user).not.toHaveBeenCalled();
  });

  it("getOnboardingActor still rejects an ACTIVE user with unverified email", async () => {
    m.current.mockResolvedValue(verifiedClerkUser("admin@example.com", {
      emailAddresses: [{ id: "primary", emailAddress: "admin@example.com", verification: { status: "unverified" } }],
    }));
    m.user.mockResolvedValue({ id: "u", status: "ACTIVE", deletedAt: null });
    expect(await getOnboardingActor()).toBeNull();
  });
});

describe("tenant scope helpers", () => {
  it("requireTenant throws on missing tenantId", () => {
    expect(() => requireTenant({ userId: "u" } as never)).toThrow(/tenantId/i);
  });

  it("requireTenant throws on missing userId", () => {
    expect(() => requireTenant({ tenantId: "tenant-x" } as never)).toThrow(/userId/i);
  });

  it("tenantWhereClause injects tenantId into any additional filter", () => {
    const where = tenantWhereClause(
      { tenantId: "tenant-a", platformRole: "HOTEL", userId: "user-a" },
      { status: "ACTIVE" },
    );
    expect(where).toEqual({ tenantId: "tenant-a", status: "ACTIVE" });
  });
});