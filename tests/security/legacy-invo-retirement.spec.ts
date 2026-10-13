import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), permission: vi.fn(), supabase: vi.fn() }));
vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: unknown) => handler,
  authenticate: mocks.authenticate,
  requirePermission: mocks.permission,
  error: (message: string, status: number) => new Response(JSON.stringify({ success: false, error: message }), { status }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.supabase }));
import * as orders from "../../app/api/v1/invo/orders/route";
import * as invoices from "../../app/api/v1/invo/invoices/route";
import * as factoring from "../../app/api/v1/invo/factoring/route";

const auth = { userId: "user-1", tenantId: "tenant-1", platformRole: "HOTEL" };
const routes = [
  { name: "orders", handlers: orders, read: "order:read", create: "order:create" },
  { name: "invoices", handlers: invoices, read: "invoice:read", create: "invoice:create" },
  { name: "factoring", handlers: factoring, read: "invoice:read", create: "invoice:factor" },
];

describe.each(routes)("retired legacy $name storage", ({ name, handlers, read, create }) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue(auth);
    mocks.permission.mockResolvedValue(undefined);
  });
  for (const method of ["GET", "POST"] as const) {
    const permission = method === "GET" ? read : create;
    const request = () => new NextRequest(`http://localhost/api/v1/invo/${name}?hotel_id=other-tenant`, { method });
    it(`${method} stops unauthenticated requests before permission or storage access`, async () => {
      mocks.authenticate.mockRejectedValue(new Error("Unauthorized"));
      await expect(handlers[method](request())).rejects.toThrow("Unauthorized");
      expect(mocks.permission).not.toHaveBeenCalled();
      expect(mocks.supabase).not.toHaveBeenCalled();
    });
    it(`${method} stops permission-denied requests before storage access`, async () => {
      mocks.permission.mockRejectedValue(new Error("Forbidden"));
      await expect(handlers[method](request())).rejects.toThrow("Forbidden");
      expect(mocks.permission).toHaveBeenCalledWith(auth, permission);
      expect(mocks.supabase).not.toHaveBeenCalled();
    });
    it(`${method} returns unavailable to authorized callers without accessing legacy data`, async () => {
      const response = await handlers[method](request());
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ success: false });
      expect(mocks.permission).toHaveBeenCalledWith(auth, permission);
      expect(mocks.supabase).not.toHaveBeenCalled();
    });
  }
});
