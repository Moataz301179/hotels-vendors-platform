import { afterEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn(), findUnique: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@clerk/nextjs/server", () => ({ auth: m.auth, currentUser: m.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.findUnique } } }));

import { getCurrentUser } from "@/lib/auth/server-auth";

const clerkUser = (verification: string = "verified") => ({
  primaryEmailAddressId: "primary",
  emailAddresses: [{ id: "primary", emailAddress: "user@example.com", verification: { status: verification } }],
});

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: "db-user", email: "user@example.com", name: "User", role: "DEPARTMENT_HEAD",
  platformRole: "HOTEL", tenantId: "tenant-a", hotelId: null, supplierId: null,
  factoringCompanyId: null, canOverride: false, clerkUserId: "clerk-a", status: "ACTIVE", deletedAt: null,
  ...overrides,
});

afterEach(() => vi.resetAllMocks());

describe("legacy server auth identity boundary", () => {
  it.each([
    ["a mismatched Clerk subject", dbUser({ clerkUserId: "clerk-other" })],
    ["a deleted user", dbUser({ deletedAt: new Date() })],
    ["an inactive user", dbUser({ status: "SUSPENDED" })],
    ["a pending user", dbUser({ status: "PENDING_VERIFICATION" })],
  ])("rejects %s", async (_label, record) => {
    m.auth.mockResolvedValue({ userId: "clerk-a" });
    m.currentUser.mockResolvedValue(clerkUser());
    m.findUnique.mockResolvedValue(record);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("rejects an unverified primary email", async () => {
    m.auth.mockResolvedValue({ userId: "clerk-a" });
    m.currentUser.mockResolvedValue(clerkUser("unverified"));
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(m.findUnique).not.toHaveBeenCalled();
  });

  it("accepts an active Clerk-bound user", async () => {
    m.auth.mockResolvedValue({ userId: "clerk-a" });
    m.currentUser.mockResolvedValue(clerkUser());
    m.findUnique.mockResolvedValue(dbUser());
    await expect(getCurrentUser()).resolves.toMatchObject({ id: "db-user", tenantId: "tenant-a" });
  });
});
