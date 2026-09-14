/**
 * AGENT OPERATING SYSTEM — core runtime (framework, not a pipeline).
 *
 * This is the GENERIC substrate every mission runs on. A mission (e.g. Oliv
 * CHV000 onboarding) is just one AGENT REGISTRATION into it. Future tasks plug
 * in without touching the core.
 *
 * Core primitives:
 *   - Agent     : an autonomous unit with a role + tools + its own memory
 *   - Task      : a unit of work assigned to an agent (input -> output)
 *   - Tool      : a capability an agent can call (SMTP, IMAP, HTTP, LLM, DB)
 *   - Workflow  : an ordered/piped graph of tasks across agents
 *   - Runtime   : executes tasks, routes tools, persists state, logs
 *
 * The design is DECLARATIVE + PERSISTENT: agents/tasks/workflows are registered
 * once and executed by the runtime. Nothing here fabricates results — every
 * agent execution produces real output or an explicit failure.
 */

export interface AgentTool {
  id: string;
  /** Async call: receives a parsed argument object, returns structured output. */
  run: (args: Record<string, unknown>, ctx: RuntimeCtx) => Promise<unknown>;
  description: string;
}

export interface AgentDef {
  id: string;
  role: string;
  systemPrompt: string;
  tools: string[];           // tool ids this agent may call
  /** Personal/working memory persisted across runs (scoped, small). */
  memory?: Record<string, string>;
}

export interface TaskDef {
  id: string;
  agentId: string;
  name: string;
  /** Task-specific instruction (the "prompt" you assign it). */
  prompt: string;
  /** Optional schema hint; validated lightly if provided. */
  expectedOutput?: "json" | "text";
}

export interface WorkflowDef {
  id: string;
  name: string;
  /** Piped: output of task[i] becomes part of input of task[i+1]. */
  tasks: string[];
  /** Optional preconditions referenced by task ids. */
  dependsOn?: Record<string, string>;
}

export interface AgentRun {
  runId: string;
  taskId?: string;
  agentId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  input?: unknown;
  output?: unknown;
  error?: string;
  toolsUsed: string[];
  startedAt: string;
  finishedAt?: string;
}

/** Context handed to tools/agents during a run (state, logging, abort). */
export interface RuntimeCtx {
  runId: string;
  memory: Record<string, string>;
  log: (...args: unknown[]) => void;
  signal: AbortSignal;
}

/* ── The runtime ───────────────────────────────────────────────────── */
export class AgentOS {
  private agents = new Map<string, AgentDef>();
  private tools = new Map<string, AgentTool>();
  private tasks = new Map<string, TaskDef>();
  private workflows = new Map<string, WorkflowDef>();
  /** Durable run log (in-memory default; swap for DB/persist adapter). */
  private logStore: AgentRun[] = [];

  registerAgent(a: AgentDef): this { this.agents.set(a.id, a); return this; }
  registerTool(t: AgentTool): this { this.tools.set(t.id, t); return this; }
  registerTask(t: TaskDef): this { this.tasks.set(t.id, t); return this; }
  registerWorkflow(w: WorkflowDef): this { this.workflows.set(w.id, w); return this; }

  get agentsList(): AgentDef[] { return [...this.agents.values()]; }
  get tasksList(): TaskDef[] { return [...this.tasks.values()]; }
  get workflowsList(): WorkflowDef[] { return [...this.workflows.values()]; }
  get runs(): AgentRun[] { return this.logStore; }

  /**
   * Execute a single task for an agent. Tools are called by id; LLM reasoning is
   * the agent's function body — this runtime only orchestrates + persists.
   */
  async runTask(taskId: string, input: unknown, opts: { persist?: boolean } = {}): Promise<AgentRun> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`unknown task: ${taskId}`);
    const agent = this.agents.get(task.agentId);
    if (!agent) throw new Error(`unknown agent ${task.agentId} for task ${taskId}`);

    const run: AgentRun = {
      runId: `${taskId}-${Date.now().toString(36)}`,
      taskId, agentId: agent.id, status: "running",
      input, toolsUsed: [], startedAt: new Date().toISOString(),
    };
    const log = opts.persist === false ? () => {} : () => {};
    const ctx: RuntimeCtx = {
      runId: run.runId, memory: { ...(agent.memory || {}) },
      log: (...a) => console.log("[run", run.runId + "]", ...a),
      signal: (null as unknown) as AbortSignal,
    };

    try {
      // The agent's task body is supplied by the caller (a registered handler or
      // the LLM router). We support a convention: a tool named `~task:<id>` is a
      // handler supplied at registration for deterministic tasks.
      const handler = this.tools.get(`~task:${taskId}`);
      if (handler) {
        const out = await handler.run({ prompt: task.prompt, input }, ctx);
        run.output = out;
      } else {
        // Default: hand to the agent's own registered "~reason" tool if present,
        // else throw a clear NOT_IMPLEMENTED (we never fake an output).
        const reasoner = this.tools.get("~reason");
        run.output = reasoner
          ? await reasoner.run({ agentId: agent.id, systemPrompt: agent.systemPrompt, prompt: task.prompt, input }, ctx)
          : (() => { throw new Error(`task ${taskId} has no handler and no ~reason tool`); })();
      }
      run.status = "succeeded";
    } catch (e) {
      run.status = "failed";
      run.error = e instanceof Error ? e.message : String(e);
    } finally {
      run.finishedAt = new Date().toISOString();
      if (opts.persist !== false) this.logStore.push(run);
    }
    return run;
  }

  /** Execute a workflow: pipe each task's output into the next task's input. */
  async runWorkflow(workflowId: string, seed: unknown, opts: { persist?: boolean } = {}): Promise<AgentRun[]> {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`unknown workflow: ${workflowId}`);
    const runs: AgentRun[] = [];
    let carry = seed;
    for (const taskId of wf.tasks) {
      const r = await this.runTask(taskId, carry, opts);
      runs.push(r);
      carry = r.output; // pipe
      if (r.status === "failed") break; // stop on first failure (deterministic)
    }
    return runs;
  }
}

/** Convenience: build a stateless reasoner tool bound to a provided LLM fn. */
export function makeReasonTool(llm: (system: string, user: string) => Promise<string>): AgentTool {
  return {
    id: "~reason",
    description: "LLM reasoning for any agent",
    run: async (args) => {
      const system = String(args.systemPrompt || args.agentId || "agent");
      const user = `${args.prompt ?? ""}\n\n${args.input ?? ""}`.trim();
      return llm(system, user);
    },
  };
}