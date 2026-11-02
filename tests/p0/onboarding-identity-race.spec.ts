import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn(), findUnique: vi.fn(), transaction: vi.fn(), tenant: vi.fn(), user: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: m.auth, currentUser: m.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.findUnique }, $transaction: m.transaction } }));
import { getActor, getOnboardingActor } from "@/lib/v2-auth";

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ userId: "user_alpha_same12345678" });
  m.currentUser.mockResolvedValue({ primaryEmailAddressId: "primary", emailAddresses: [{ id: "primary", emailAddress: "signup@example.test", verification: { status: "verified" } }], unsafeMetadata: {} });
  m.findUnique.mockResolvedValue(null);
  m.tenant.mockResolvedValue({ id: "tenant-created" });
  m.user.mockResolvedValue({ id: "new", clerkUserId: "user_alpha_same12345678", status: "PENDING_VERIFICATION" });
  const upsert = vi.fn().mockResolvedValue({ id: "record" });
  m.transaction.mockImplementation(async (callback) => callback({ tenant: { upsert: m.tenant }, role: { upsert }, permission: { upsert }, rolePermission: { upsert }, user: { upsert: m.user } }));
});

describe("onboarding identity provisioning boundary", () => {
  it("never provisions or returns a pending identity from operational auth", async () => {
    expect(await getActor()).toBeNull();
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it.each(["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"])("does not rebind a concurrent existing %s identity", async (platformRole) => {
    m.user.mockResolvedValue({ id: "existing", clerkUserId: "another-subject", platformRole, status: "ACTIVE", tenantId: "another-tenant" });
    expect(await getOnboardingActor()).toBeNull();
    expect(m.user.mock.calls[0][0].update).toEqual({});
  });

  it.each(["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"])("preserves persisted %s authorization and tenant", async (platformRole) => {
    const row = { id: "existing", clerkUserId: "user_alpha_same12345678", platformRole, tenantId: "assigned-tenant", status: "ACTIVE", deletedAt: null };
    m.findUnique.mockResolvedValue(row);
    m.currentUser.mockResolvedValue({ primaryEmailAddressId: "primary", emailAddresses: [{ id: "primary", emailAddress: "signup@example.test", verification: { status: "verified" } }], unsafeMetadata: { platformRole: "ADMIN", tenantId: "forged-tenant" } });
    expect(await getActor()).toEqual(row);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("returns a newly provisioned pending user only for onboarding", async () => {
    expect(await getOnboardingActor()).toMatchObject({ id: "new", status: "PENDING_VERIFICATION" });
  });

  it.each([
    { status: "SUSPENDED" },
    { status: "ACTIVE", deletedAt: new Date() },
  ])("rejects a concurrently disabled identity: %j", async (overrides) => {
    m.user.mockResolvedValue({ id: "existing", clerkUserId: "user_alpha_same12345678", ...overrides });
    expect(await getOnboardingActor()).toBeNull();
  });

  it("derives independent tenant slugs from the whole subject", async () => {
    await getOnboardingActor();
    const first = m.tenant.mock.calls[0][0].where.slug;
    m.auth.mockResolvedValue({ userId: "user_beta_same12345678" });
    await getOnboardingActor();
    expect(m.tenant.mock.calls[1][0].where.slug).not.toBe(first);
  });
});
