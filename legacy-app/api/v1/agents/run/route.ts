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

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";
import { WORKFLOWS } from "@/lib/agents/agents";
import { AgentTaskResult, AgentId } from "@/lib/agents/types";

const WORKFLOW_NAMES = Object.keys(WORKFLOWS) as (keyof typeof WORKFLOWS)[];

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

export const POST = async (request: NextRequest) => {
  let body: { workflow?: string; agentId?: string; customPrompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const orch = new AgentOrchestrator();
  const { workflow, agentId, customPrompt } = body ?? {};

  // Single-agent mode → one FEATURE_IDEA task for the chosen agent.
  if (agentId) {
    const task = {
      id: `single-${Date.now()}`,
      type: "FEATURE_IDEA" as const,
      title: `${agentId} features`,
      prompt: customPrompt || "Generate features exploiting our market gaps",
      agentId: agentId as AgentId,
      tenantId: "system",
    };

    try {
      const result = await orch.runTask(task);
      return NextResponse.json(
        { success: true, results: [serializeResult(result)] },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error ? err.message : "Agent task execution failed",
        },
        { status: 500 }
      );
    }
  }

  // Workflow mode.
  const name = workflow ?? "platform_audit";
  if (!WORKFLOW_NAMES.includes(name as keyof typeof WORKFLOWS)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unknown workflow: "${workflow}". Expected one of: ${WORKFLOW_NAMES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const results = await orch.runWorkflow(
      name as keyof typeof WORKFLOWS,
      customPrompt
    );
    return NextResponse.json(
      { success: true, results: results.map(serializeResult) },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Workflow execution failed",
      },
      { status: 500 }
    );
  }
};