import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: vi.fn(), permission: vi.fn(), runs: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/server-auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { agentRun: { findMany: mocks.runs } } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import AgentsPage from "../../app/(dashboard)/agents/page";

describe("agent history isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ id: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" });
    mocks.permission.mockResolvedValue(undefined);
    mocks.runs.mockResolvedValue([]);
    mocks.redirect.mockImplementation(() => { throw new Error("Redirect"); });
  });
  it("does not query history without a signed-in account", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(AgentsPage()).rejects.toThrow("Redirect");
    expect(mocks.runs).not.toHaveBeenCalled();
  });
  it("does not query history when agent permission is denied", async () => {
    mocks.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(AgentsPage()).rejects.toThrow("Forbidden");
    expect(mocks.runs).not.toHaveBeenCalled();
  });
  it("loads only authenticated tenant history and excludes prompt and output fields", async () => {
    await AgentsPage();
    expect(mocks.permission).toHaveBeenCalledWith({ userId: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" }, "agent:read");
    expect(mocks.runs).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: "tenant-1" }),
      select: { id: true, agentName: true, taskName: true, status: true },
    }));
  });
});
