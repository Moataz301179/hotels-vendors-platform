import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  requirePermission: vi.fn(),
  audit: vi.fn(),
  runTask: vi.fn(),
  runWorkflow: vi.fn(),
  integrationRegisterProvider: vi.fn(),
  leadFindMany: vi.fn(),
}));

vi.mock("@/lib/api-utils", () => ({
  apiRoute: (handler: unknown) => handler,
  authenticate: mocks.authenticate,
  requirePermission: mocks.requirePermission,
  audit: mocks.audit,
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

vi.mock("@/lib/integrations/admin-route", () => ({
  integrationAdminRoute: (handler: (request: unknown, context?: unknown) => unknown) =>
    async (request: unknown, context?: unknown) => {
      const auth = await mocks.authenticate(request);
      await mocks.requirePermission(auth, "admin:manage_platform");
      return handler(request, context);
    },
}));

vi.mock("@/lib/agents/orchestrator", () => ({
  AgentOrchestrator: class {
    runTask = mocks.runTask;
    runWorkflow = mocks.runWorkflow;
  },
}));

vi.mock("@/lib/agents/agents", () => ({
  WORKFLOWS: { platform_audit: { objective: "test" } },
}));

vi.mock("@/lib/integrations/engine", () => ({
  integrationEngine: { registerProvider: mocks.integrationRegisterProvider },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { leadCapture: { findMany: mocks.leadFindMany } },
}));

import { POST as runAgents } from "../../app/api/v1/agents/run/route";
import { GET as listLeads } from "../../app/api/v1/leads/route";
import { POST as registerProvider } from "../../app/api/v1/integrations/providers/route";

const adminContext = {
  userId: "user-admin",
  tenantId: "tenant-admin",
  platformRole: "ADMIN",
};

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/v1/agents/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("platform-level API controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue(adminContext);
    mocks.requirePermission.mockResolvedValue(undefined);
    mocks.audit.mockResolvedValue(undefined);
    mocks.runTask.mockResolvedValue({
      taskId: "task-1",
      agentId: "auditor",
      status: "completed",
      output: "ok",
      startedAt: new Date("2026-01-01T00:00:00Z"),
      completedAt: new Date("2026-01-01T00:00:01Z"),
    });
    mocks.runWorkflow.mockResolvedValue([]);
    mocks.leadFindMany.mockResolvedValue([]);
  });

  it("does not start agent work when the caller is unauthenticated", async () => {
    mocks.authenticate.mockRejectedValue(new Error("Unauthorized"));

    await expect(runAgents(postRequest({ workflow: "platform_audit" })))
      .rejects.toThrow("Unauthorized");

    expect(mocks.requirePermission).not.toHaveBeenCalled();
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
    expect(mocks.runTask).not.toHaveBeenCalled();
  });

  it("does not start agent work when platform permission is denied", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("Permission denied"));

    await expect(runAgents(postRequest({ workflow: "platform_audit" })))
      .rejects.toThrow("Permission denied");

    expect(mocks.requirePermission).toHaveBeenCalledWith(adminContext, "admin:manage_platform");
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
  });

  it("rejects invalid agents before any task is created", async () => {
    const response = await runAgents(postRequest({ agentId: "not-an-agent" }));

    expect(response.status).toBe(400);
    expect(mocks.runTask).not.toHaveBeenCalled();
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
  });

  it("scopes agent workflows to the authenticated tenant and audits each run", async () => {
    mocks.runWorkflow.mockResolvedValueOnce([{
      taskId: "workflow-task-1",
      agentId: "auditor",
      status: "completed",
      output: "ok",
    }]);
    const response = await runAgents(postRequest({
      workflow: "platform_audit",
      customPrompt: "Check current controls",
    }));

    expect(response.status).toBe(200);
    expect(mocks.runWorkflow).toHaveBeenCalledWith(
      "platform_audit",
      "Check current controls",
      "tenant-admin"
    );
    expect(mocks.audit).toHaveBeenCalled();
  });

  it("blocks integration provider writes before reaching the engine when permission is denied", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("Permission denied"));

    await expect(registerProvider(postRequest({ providerId: "Oracle OPERA" })))
      .rejects.toThrow("Permission denied");

    expect(mocks.requirePermission).toHaveBeenCalledWith(adminContext, "admin:manage_platform");
    expect(mocks.integrationRegisterProvider).not.toHaveBeenCalled();
  });

  it("blocks lead-contact reads before querying storage when permission is denied", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("Permission denied"));

    await expect(listLeads(new NextRequest("http://localhost/api/v1/leads")))
      .rejects.toThrow("Permission denied");

    expect(mocks.requirePermission).toHaveBeenCalledWith(adminContext, "admin:manage_platform");
    expect(mocks.leadFindMany).not.toHaveBeenCalled();
  });
});
