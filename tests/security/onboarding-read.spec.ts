import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  userFindUnique: vi.fn(),
  progressFindUnique: vi.fn(),
  progressCreate: vi.fn(),
  stepFindMany: vi.fn(),
  stepUpsert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    onboardingProgress: {
      findUnique: mocks.progressFindUnique,
      create: mocks.progressCreate,
    },
    onboardingStepProgress: {
      findMany: mocks.stepFindMany,
      upsert: mocks.stepUpsert,
    },
  },
}));

vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: unknown) => handler,
  success: (data: unknown, status = 200) =>
    new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { "content-type": "application/json" },
    }),
  error: (message: string, status = 500) =>
    new Response(JSON.stringify({ success: false, error: message }), {
      status,
      headers: { "content-type": "application/json" },
    }),
}));

import { GET } from "../../app/api/v1/onboarding/progress/route";

describe("onboarding progress GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-user" });
    mocks.currentUser.mockResolvedValue({
      primaryEmailAddressId: "primary-email",
      emailAddresses: [{ id: "primary-email", emailAddress: "staff@example.test" }],
    });
    mocks.userFindUnique
      .mockResolvedValueOnce({
        id: "db-user",
        tenantId: "tenant-1",
        platformRole: "HOTEL",
      })
      .mockResolvedValueOnce({
        id: "db-user",
        platformRole: "HOTEL",
        phoneVerifiedAt: null,
        kycLevel: 0,
        name: "Hotel User",
        email: "staff@example.test",
        phone: null,
      });
    mocks.progressFindUnique.mockResolvedValue(null);
    mocks.stepFindMany.mockResolvedValue([]);
  });

  it("returns an initial state without creating database rows", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/onboarding/progress"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.overallStatus).toBe("IN_PROGRESS");
    expect(body.data.completedAt).toBeNull();
    expect(mocks.progressCreate).not.toHaveBeenCalled();
    expect(mocks.stepUpsert).not.toHaveBeenCalled();
  });
});
