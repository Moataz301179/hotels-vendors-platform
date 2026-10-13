import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ sensitive: vi.fn() }));
vi.mock("@/lib/admin/access", () => ({ requireSensitiveAdmin: mocks.sensitive }));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: unknown) => handler,
  validateBody: (schema: { parse: (body: unknown) => unknown }, body: unknown) => schema.parse(body),
  error: (message: string, status: number) => Response.json({ success: false, error: message }, { status }),
}));
import { POST as environment } from "@/app/api/v1/admin/env/route";
import { POST as freeze } from "@/app/api/v1/admin/control-center/freeze-credit-line/route";
import { POST as unfreeze } from "@/app/api/v1/admin/control-center/unfreeze-credit-line/route";
const request = (body: unknown) => new NextRequest("https://hotelsvendors.com/api/v1/admin/env", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const credit = { creditFacilityId: "cmux8bffs0000crz4uy37rtpg", coAuthorizerId: "cmux8bfqt0002crz4bx0hk586", reason: "Independent authorization must be obtained" };
describe("admin controls never report non-executed changes as successful", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.sensitive.mockResolvedValue({ userId: "admin" }); });
  it("reports disabled environment update with no success claim", async () => { const response = await environment(request({ key: "NEXT_PUBLIC_FINTECH_SANDBOX", value: "false" })); expect(response.status).toBe(501); expect(await response.json()).toMatchObject({ success: false }); expect(mocks.sensitive).toHaveBeenCalledWith(expect.anything(), "admin:manage_env"); });
  it("rejects secret-key modifications", async () => { await expect(environment(request({ key: "CLERK_SECRET_KEY", value: "false" }))).rejects.toThrow(); });
  it.each([freeze, unfreeze])("does not accept a supplied co-authorizer ID as proof", async handler => { const response = await handler(request(credit)); expect(response.status).toBe(501); expect(await response.json()).toMatchObject({ success: false }); });
  it("denies before body handling when sensitive permission fails", async () => { mocks.sensitive.mockRejectedValue(new Error("Permission denied")); await expect(environment(request({ key: "NEXT_PUBLIC_FINTECH_SANDBOX", value: "false" }))).rejects.toThrow("Permission denied"); });
});
