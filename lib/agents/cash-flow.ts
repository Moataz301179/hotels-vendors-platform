/**
 * CashFlowAgent — working-capital signal only.
 * HotelsVendors does not score credit, set a limit, or disburse.
 */
import { rejectNativeFunding } from "@/lib/fintech/external-only";
import { AgentContext } from "./swarm-orchestrator";

export const CashFlowAgent = {
  async execute(_ctx: AgentContext): Promise<never> {
    return rejectNativeFunding();
  },
};
