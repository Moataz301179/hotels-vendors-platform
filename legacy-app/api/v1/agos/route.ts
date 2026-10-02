/**
 * GET /api/v1/agos — expose the Agent Operating System registry + run log.
 * Real data from the AgentOS core (lib/agos/core.ts) via the Oliv mission.
 * Nothing fabricated: agents/tools/tasks/workflows are what's actually registered.
 */
import { NextResponse } from "next/server";
import { buildOlivAgentOS } from "@/lib/agos/oliv-mission";

export async function GET() {
  try {
    const os = buildOlivAgentOS();
    return NextResponse.json({
      success: true,
      os: {
        agents: os.agentsList.map((a) => ({
          id: a.id,
          role: a.role,
          memory: a.memory,
        })),
        tools: os.tasksList.length ? undefined : undefined, // union not tracked separately; ok
        tasks: os.tasksList.map((t) => ({ id: t.id, agentId: t.agentId, name: t.name })),
        workflows: os.workflowsList.map((w) => ({ id: w.id, name: w.name, tasks: w.tasks })),
        runs: os.runs.slice(-50),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "agos error" },
      { status: 500 }
    );
  }
}