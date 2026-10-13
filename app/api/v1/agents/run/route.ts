/**
 * /api/v1/agents/run
 * POST — drive the REAL AgentOrchestrator.
 *
 * Body:
 *   { workflow: 'market_research_sprint' | 'feature_ideation_sprint' | 'platform_audit' }
 *   | { agentId: string }            → run a single FEATURE_IDEA task for that agent
 *   optional { customPrompt?: string }
 *
 * Returns { success: true, results: AgentTaskResult[] } — live orchestrator output,
 * never fabricated. Each task is executed and persisted to the agentRun table.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, audit } from "@/lib/api-utils";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";
import { WORKFLOWS } from "@/lib/agents/agents";
import { AgentTaskResult, AgentId } from "@/lib/agents/types";

const WORKFLOW_NAMES = Object.keys(WORKFLOWS) as (keyof typeof WORKFLOWS)[];
const AgentRunSchema = z.object({
  workflow: z.string().max(80).optional(),
  agentId: z.enum([
    "fintech-architect",
    "security-expert",
    "integration-lead",
    "business-strategist",
    "seo-strategist",
    "ux-designer",
    "data-harvester",
    "auditor",
  ]).optional(),
  customPrompt: z.string().trim().max(4000).optional(),
}).strict().refine(
  (input) => !(input.workflow && input.agentId),
  "Choose either a workflow or a single agent",
);

function serializeResult(r: AgentTaskResult) {
  return {
    taskId: r.taskId,
    agentId: r.agentId,
    status: r.status,
    output: r.output,
    findings: r.findings ?? null,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    durationMs:
      r.startedAt && r.completedAt
        ? r.completedAt.getTime() - r.startedAt.getTime()
        : null,
  };
}

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = AgentRunSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid agent run request" },
      { status: 400 }
    );
  }

  const { workflow, agentId, customPrompt } = parsed.data;
  const orch = new AgentOrchestrator();

  if (agentId) {
    const task = {
      id: `single-${Date.now()}`,
      type: "FEATURE_IDEA" as const,
      title: `${agentId} features`,
      prompt: customPrompt || "Generate features exploiting our market gaps",
      agentId: agentId as AgentId,
      tenantId: auth.tenantId,
    };

    try {
      const result = await orch.runTask(task);
      await audit({
        entityType: "AGENT_RUN",
        entityId: result.taskId,
        action: "EXECUTE",
        tenantId: auth.tenantId,
        actorId: auth.userId,
        actorRole: auth.platformRole,
        afterState: { agentId, status: result.status },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent"),
      });
      return NextResponse.json(
        { success: true, results: [serializeResult(result)] },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "Agent task execution failed" },
        { status: 500 }
      );
    }
  }

  const name = workflow ?? "platform_audit";
  if (!WORKFLOW_NAMES.includes(name as keyof typeof WORKFLOWS)) {
    return NextResponse.json(
      { success: false, error: "Unknown workflow" },
      { status: 400 }
    );
  }

  try {
    const results = await orch.runWorkflow(
      name as keyof typeof WORKFLOWS,
      customPrompt,
      auth.tenantId
    );
    await Promise.all(results.map((result) => audit({
      entityType: "AGENT_RUN",
      entityId: result.taskId,
      action: "EXECUTE",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: { workflow: name, agentId: result.agentId, status: result.status },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    })));
    return NextResponse.json(
      { success: true, results: results.map(serializeResult) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Agent workflow execution failed" },
      { status: 500 }
    );
  }
}, { rateLimit: "api" });