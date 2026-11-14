import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  accessFromStage,
  assertCreditLineForOrders,
  creditLineRequiredForRole,
} from "@/lib/credit/workspace-access";
import { decideHandoff } from "@/lib/auth/handoff";
import { resolveTenantActions, TENANT_ASSISTANT_SYSTEM } from "@/lib/ai/tenant-assistant";

const m = vi.hoisted(() => ({
  hotelFindFirst: vi.fn(),
  facilityFindFirst: vi.fn(),
  applicationFindFirst: vi.fn(),
  olivFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    hotel: { findFirst: m.hotelFindFirst },
    creditFacility: { findFirst: m.facilityFindFirst },
    creditLineApplication: { findFirst: m.applicationFindFirst },
    olivCreditFacility: { findFirst: m.olivFindFirst },
  },
}));

import { resolveCreditAccess } from "@/lib/credit/workspace-access";

describe("credit-line workspace gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.hotelFindFirst.mockResolvedValue({ id: "hotel-1" });
    m.facilityFindFirst.mockResolvedValue(null);
    m.applicationFindFirst.mockResolvedValue(null);
    m.olivFindFirst.mockResolvedValue(null);
  });

  it("requires credit lines for hotels and suppliers only", () => {
    expect(creditLineRequiredForRole("HOTEL")).toBe(true);
    expect(creditLineRequiredForRole("SUPPLIER")).toBe(true);
    expect(creditLineRequiredForRole("FACTORING")).toBe(false);
    expect(creditLineRequiredForRole("ADMIN")).toBe(false);
  });

  it("keeps orders closed until an ACTIVE funder facility exists", async () => {
    const access = await resolveCreditAccess({ platformRole: "HOTEL", tenantId: "tenant-1" });
    expect(access.stage).toBe("needs_legibility");
    expect(access.canPlaceOrders).toBe(false);
    expect(access.canOpenFullDashboard).toBe(false);

    const blocked = await assertCreditLineForOrders({ platformRole: "HOTEL", tenantId: "tenant-1" });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("CREDIT_LINE_REQUIRED");
  });

  it("unlocks after a funder-recorded ACTIVE CreditFacility", async () => {
    m.facilityFindFirst.mockResolvedValue({
      id: "fac-1",
      status: "ACTIVE",
      approvedAt: new Date("2026-11-01"),
      limit: { toString: () => "250000" },
      utilized: { toString: () => "0" },
    });
    const access = await resolveCreditAccess({ platformRole: "HOTEL", tenantId: "tenant-1", hotelId: "hotel-1" });
    expect(access.stage).toBe("active");
    expect(access.canPlaceOrders).toBe(true);
    expect(access.facility?.source).toBe("CreditFacility");
  });

  it("marks pending applications as awaiting funder — never invents approval", async () => {
    m.applicationFindFirst.mockResolvedValue({
      id: "app-1",
      status: "PENDING_REVIEW",
      hotelName: "Coast Hotel",
      createdAt: new Date("2026-11-01"),
      rejectedReason: null,
      approvedLimit: null,
    });
    const access = await resolveCreditAccess({ platformRole: "HOTEL", tenantId: "tenant-1" });
    expect(access.stage).toBe("awaiting_funder");
    expect(access.canPlaceOrders).toBe(false);
  });

  it("exposes helper stage mapping without inventing facilities", () => {
    const access = accessFromStage(
      { platformRole: "HOTEL", tenantId: "t" },
      "awaiting_funder",
      { application: null, facility: null }
    );
    expect(access.nextAction.href).toBe("/credit-line");
    expect(access.boundary).toMatch(/solely from the external funder/i);
  });
});

describe("credit-line handoff and AI routing", () => {
  it("sends active hotel sessions without a credit line to /credit-line", () => {
    expect(
      decideHandoff({
        signedIn: true,
        actor: { status: "ACTIVE", platformRole: "HOTEL" },
        publicRoleDeclared: true,
        creditLineActive: false,
      }).href
    ).toBe("/credit-line");
  });

  it("allows returnTo to win when the caller already chose a destination", () => {
    expect(
      decideHandoff({
        signedIn: true,
        actor: { status: "ACTIVE", platformRole: "HOTEL" },
        publicRoleDeclared: true,
        creditLineActive: false,
        returnTo: "/orders?view=approval",
      }).href
    ).toBe("/orders?view=approval");
  });

  it("routes empty-order / credit questions to the credit-line screen", () => {
    expect(TENANT_ASSISTANT_SYSTEM).toMatch(/credit-line legibility/i);
    const actions = resolveTenantActions("I cannot place an order — do I need funder approval?", "HOTEL");
    expect(actions.some((action) => action.href === "/credit-line")).toBe(true);
  });
});
