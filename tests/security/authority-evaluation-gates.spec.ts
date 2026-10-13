import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ order: vi.fn(), rules: vi.fn(), requester: vi.fn(), risk: vi.fn(), eta: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findUnique: mocks.order }, authorityRule: { findMany: mocks.rules }, user: { findUnique: mocks.requester } } }));
vi.mock("@/lib/api-utils", () => ({ ApiError: class extends Error {} }));
vi.mock("@/lib/eta/validator", () => ({ validateForFactoring: mocks.eta }));
vi.mock("@/lib/fintech/risk-engine", () => ({ assessRisk: mocks.risk, generateSmartFixes: vi.fn() }));
import { evaluateAuthority } from "../../lib/auth/authority-matrix";
const ctx = { userId: "approver-1", userRole: "OWNER" as const, tenantId: "tenant-1" };
const order = { id: "order-1", hotelId: "hotel-1", total: 1000, hotel: { tier: "CORE", riskTier: "LOW" }, supplier: { tier: "CORE" }, paymentGuaranteed: true, paymentGuaranteeMethod: "DIRECT", requesterId: "requester-1", invoices: [] };
describe("Authority Matrix gates", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.order.mockResolvedValue(order); mocks.rules.mockResolvedValue([]); mocks.requester.mockResolvedValue({ role: "CLERK" }); mocks.risk.mockResolvedValue({ riskTier: "LOW" }); mocks.eta.mockResolvedValue({ valid: true }); });
  it("allows guaranteed non-factoring orders before a delivery invoice exists", async () => { expect(await evaluateAuthority("order-1", ctx)).toMatchObject({ action: "AUTO_APPROVE", canProceed: true, etaValidationRequired: false }); expect(mocks.eta).not.toHaveBeenCalled(); });
  it("factoring still requires an invoice for ETA validation", async () => { mocks.order.mockResolvedValue({ ...order, paymentGuaranteeMethod: "FACTORING" }); expect(await evaluateAuthority("order-1", ctx)).toMatchObject({ canProceed: false, etaValidationRequired: true }); });
  it("honors explicit tenant ETA requirements for direct orders", async () => { mocks.rules.mockResolvedValue([{ id: "tenant-rule", name: "Tenant ETA required", priority: 2000, minValue: 0, maxValue: 10000, requiresEtaValidation: true, requiresDualSignOff: false, action: "APPROVE", isActive: true }]); expect(await evaluateAuthority("order-1", ctx)).toMatchObject({ canProceed: false, reason: "Invoice required for ETA validation" }); });
  it("matches the order requester role rather than the evaluator role", async () => { mocks.order.mockResolvedValue({ ...order, total: 150000 }); expect(await evaluateAuthority("order-1", ctx)).toMatchObject({ action: "ROUTE_TO_GM", routeToRole: "GM" }); expect(mocks.requester).toHaveBeenCalledWith({ where: { id: "requester-1", tenantId: "tenant-1" }, select: { role: true } }); });
  it("loads orders through the session tenant scope", async () => { mocks.order.mockResolvedValue(null); expect(await evaluateAuthority("other-order", ctx)).toMatchObject({ canProceed: false }); expect(mocks.order.mock.calls[0][0].where).toEqual({ id: "other-order", tenantId: "tenant-1" }); });
});
