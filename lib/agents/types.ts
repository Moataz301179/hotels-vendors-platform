/**
 * Agent Swarm Orchestration Types
 * Each agent has a role, expertise, and can execute tasks.
 */

export type AgentId =
  | "fintech-architect"
  | "security-expert"
  | "integration-lead"
  | "business-strategist"
  | "seo-strategist"
  | "ux-designer"
  | "data-harvester"
  | "auditor";

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  capabilities: AgentCapability[];
}

export type AgentCapability =
  | "market_research"
  | "competitor_analysis"
  | "gap_analysis"
  | "feature_ideation"
  | "pricing_strategy"
  | "risk_assessment"
  | "compliance_review"
  | "ux_audit"
  | "data_analysis"
  | "seo_audit"
  | "business_modeling"
  | "fintech_design"
  | "integration_architecture";

export interface AgentTask {
  id: string;
  type:
    | "MARKET_RESEARCH"
    | "COMPETITOR_ANALYSIS"
    | "GAP_ANALYSIS"
    | "FEATURE_IDEA"
    | "PRICING_STRATEGY"
    | "RISK_ASSESSMENT"
    | "COMPLIANCE_REVIEW"
    | "UX_AUDIT"
    | "DATA_ANALYSIS"
    | "SEO_AUDIT"
    | "BUSINESS_MODELING"
    | "FINTECH_DESIGN"
    | "INTEGRATION_ARCH";
  title: string;
  prompt: string;
  agentId: AgentId;
  tenantId: string;
  context?: Record<string, unknown>;
  parentTaskId?: string;
}

export interface AgentTaskResult {
  taskId: string;
  agentId: AgentId;
  status: "pending" | "running" | "completed" | "failed";
  output: string;
  findings?: string;
  metadata?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  subTasks?: AgentTaskResult[];
}

export interface OrchestrationPlan {
  objective: string;
  tasks: AgentTask[];
  workflow: "sequential" | "parallel" | "dag";
}

export interface MarketGap {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedActors: ("HOTEL" | "SUPPLIER" | "FACTOR" | "LOGISTICS" | "PLATFORM")[];
  competitorBlindSpot: string; // Which competitor misses this
  revenueOpportunity: string;
  proposedSolution: string;
}

export interface CompetitorProfile {
  name: string;
  type: string;
  vertical: string;
  model: string;
  strengths: string[];
  weaknesses: string[];
  features: string[];
  scale: {
    merchants?: number;
    suppliers?: number;
    cities?: string;
    countries?: string;
  };
  funding?: string;
  status: string;
}
