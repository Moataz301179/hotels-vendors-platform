/**
 * Swarm Orchestrator — Event-Driven AI Agent Manager
 * HotelsVendors Platform
 *
 * Manages 7 autonomous AI agents listening to event channels.
 * Agents run as background services triggered by domain events.
 */

import { MarketPulseAgent } from "./market-pulse";
import { DynamicDealAgent } from "./dynamic-deal";
import { DockInspectorAgent } from "./dock-inspector";
import { CashFlowAgent } from "./cash-flow";
import { QualitySpecAgent } from "./quality-spec";
import { ComplianceGuardAgent } from "./compliance-guard";
import { ResilienceRouteAgent } from "./resilience-route";

export type AgentEvent =
  | "catalog.price_update"
  | "rfq.submitted"
  | "delivery.scanned"
  | "grn.confirmed"
  | "order.created"
  | "payment.due"
  | "compliance.check"
  | "supply.risk_alert"
  | "market.anomaly"
  | "carrier.delayed";

export interface AgentContext {
  tenantId: string;
  eventId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

interface Agent {
  name: string;
  events: AgentEvent[];
  execute: (ctx: AgentContext) => Promise<{ success: boolean; output: unknown }>;
  intervalMs?: number;
}

class SwarmOrchestrator {
  private agents: Agent[] = [];
  private running = false;
  private intervals: ReturnType<typeof setInterval>[] = [];

  register(agent: Agent) {
    this.agents.push(agent);
  }

  async dispatch(event: AgentEvent, ctx: AgentContext): Promise<Array<{ agent: string; success: boolean }>> {
    const results: Array<{ agent: string; success: boolean }> = [];
    const matching = this.agents.filter((a) => a.events.includes(event));

    for (const agent of matching) {
      try {
        const result = await agent.execute(ctx);
        results.push({ agent: agent.name, success: result.success });
        console.log(`[Swarm] ${agent.name}: ${result.success ? "OK" : "FAILED"}`);
      } catch (err) {
        results.push({ agent: agent.name, success: false });
        console.error(`[Swarm] ${agent.name}: ERROR —`, err instanceof Error ? err.message : err);
      }
    }

    return results;
  }

  start() {
    if (this.running) return;
    this.running = true;

    for (const agent of this.agents) {
      if (agent.intervalMs && agent.events.length > 0) {
        const id = setInterval(async () => {
          try {
            const ctx: AgentContext = {
              tenantId: "system",
              eventId: `interval-${Date.now()}`,
              timestamp: new Date().toISOString(),
              payload: { source: "interval", agent: agent.name },
            };
            await agent.execute(ctx);
          } catch {}
        }, agent.intervalMs);
        this.intervals.push(id);
      }
    }

    console.log(`[Swarm] Started with ${this.agents.length} agents`);
  }

  stop() {
    this.running = false;
    for (const id of this.intervals) clearInterval(id);
    this.intervals = [];
    console.log("[Swarm] Stopped");
  }
}

/* ── Singleton ── */
export const swarm = new SwarmOrchestrator();

// Register all agents
swarm.register({
  name: "MarketPulse",
  events: ["catalog.price_update", "market.anomaly"],
  execute: MarketPulseAgent.execute,
  intervalMs: 6 * 60 * 60 * 1000, // every 6h
});

swarm.register({
  name: "DynamicDeal",
  events: ["rfq.submitted"],
  execute: DynamicDealAgent.execute,
});

swarm.register({
  name: "DockInspector",
  events: ["delivery.scanned"],
  execute: DockInspectorAgent.execute,
});

swarm.register({
  name: "CashFlow",
  events: ["grn.confirmed", "payment.due"],
  execute: CashFlowAgent.execute,
  intervalMs: 30 * 60 * 1000, // every 30min — check payment schedules
});

swarm.register({
  name: "QualitySpec",
  events: ["rfq.submitted", "catalog.price_update"],
  execute: QualitySpecAgent.execute,
});

swarm.register({
  name: "ComplianceGuard",
  events: ["order.created", "compliance.check"],
  execute: ComplianceGuardAgent.execute,
});

swarm.register({
  name: "ResilienceRoute",
  events: ["supply.risk_alert", "carrier.delayed"],
  execute: ResilienceRouteAgent.execute,
  intervalMs: 60 * 60 * 1000, // every 60min — check road conditions
});