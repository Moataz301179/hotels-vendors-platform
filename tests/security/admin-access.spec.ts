import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), permission: vi.fn(), account: vi.fn(), clerk: vi.fn(), has: vi.fn() }));
vi.mock("@/lib/api-utils", () => ({ authenticate: mocks.authenticate, requirePermission: mocks.permission,
  ApiError: class extends Error { constructor(message: string, public statusCode: number) { super(message); } } }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.account } } }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.clerk }));
import { requirePlatformAdmin, requireSensitiveAdmin } from "@/lib/admin/access";
import { NextRequest } from "next/server";
const ctx = { userId: "owner", tenantId: "platform", platformRole: "ADMIN" };
describe("admin assurance boundary", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.authenticate.mockResolvedValue(ctx); mocks.permission.mockResolvedValue(undefined); mocks.account.mockResolvedValue({ id: "owner" }); mocks.has.mockReturnValue(true); mocks.clerk.mockResolvedValue({ userId: "clerk-owner", sessionId: "session", has: mocks.has }); });
  it("requires explicit permission and active platform identity", async () => { await requirePlatformAdmin(ctx, "admin:manage_tenants"); expect(mocks.permission).toHaveBeenCalledWith(ctx, "admin:manage_tenants"); expect(mocks.account).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "ACTIVE", tenant: { type: "PLATFORM", status: "ACTIVE", deletedAt: null } }) })); });
  it("denies missing grants before querying account", async () => { mocks.permission.mockRejectedValue(new Error("Missing permission")); await expect(requirePlatformAdmin(ctx, "admin:manage_env")).rejects.toThrow(); expect(mocks.account).not.toHaveBeenCalled(); });
  it("denies tenant administrators outside platform tenant", async () => { mocks.account.mockResolvedValue(null); await expect(requirePlatformAdmin(ctx, "admin:read")).rejects.toMatchObject({ statusCode: 403 }); });
  it("denies bearer assurance even with permitted account", async () => { await expect(requireSensitiveAdmin(new NextRequest("https://hotelsvendors.com/api/v1/admin/env", { headers: { authorization: "Bearer supplied" } }), "admin:manage_env")).rejects.toMatchObject({ statusCode: 403 }); expect(mocks.clerk).not.toHaveBeenCalled(); });
  it("denies absent or stale second factor", async () => { mocks.has.mockReturnValue(false); await expect(requireSensitiveAdmin(new NextRequest("https://hotelsvendors.com/api/v1/admin/env"), "admin:manage_env")).rejects.toMatchObject({ statusCode: 403 }); });
  it("requires five-minute second-factor assurance", async () => { await expect(requireSensitiveAdmin(new NextRequest("https://hotelsvendors.com/api/v1/admin/env"), "admin:manage_env")).resolves.toEqual(ctx); expect(mocks.has).toHaveBeenCalledWith({ reverification: { level: "second_factor", afterMinutes: 5 } }); });
  it("denies missing session even if a verifier returns true", async () => { mocks.clerk.mockResolvedValue({ userId: "owner", sessionId: null, has: mocks.has }); await expect(requireSensitiveAdmin(new NextRequest("https://hotelsvendors.com/api/v1/admin/env"), "admin:manage_env")).rejects.toMatchObject({ statusCode: 403 }); });
});
