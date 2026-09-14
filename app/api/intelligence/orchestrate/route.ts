import { NextRequest } from "next/server";
import { AgentOrchestrator } from "@/lib/agents/orchestrator";
import { WORKFLOWS } from "@/lib/agents/agents";
import { AgentId } from "@/lib/agents/types";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

const orchestrator = new AgentOrchestrator();

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  try {
    const body = await request.json();
    const { workflow, customPrompt, task } = body;

    // Run a pre-defined workflow
    if (workflow && workflow in WORKFLOWS) {
      const results = await orchestrator.runWorkflow(
        workflow as keyof typeof WORKFLOWS,
        customPrompt,
        auth.tenantId
      );
      return success({ workflow, results });
    }

    // Run a single custom task
    if (task) {
      const result = await orchestrator.runTask({
        id: `custom-${Date.now()}`,
        type: task.type,
        title: task.title,
        prompt: task.prompt,
        agentId: task.agentId as AgentId,
        tenantId: auth.tenantId,
        context: task.context,
      });
      return success({ task: result });
    }

    return error("Missing workflow or task", 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return error(message, 500);
  }
});
