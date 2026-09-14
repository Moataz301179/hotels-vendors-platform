/**
 * AI Credits Service — Subscription-gated AI features
 *
 * Users pay EGP 2,500/month → get AI credits
 * Each AI action costs credits (token-based)
 * Backend deducts credits transparently
 * Users never see which LLM provider is used
 */

import { prisma } from "@/lib/prisma";

export interface AICreditsBalance {
  userId: string;
  tenantId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  subscriptionTier: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  subscriptionExpiresAt: string | null;
  lastRenewalAt: string | null;
}

export interface AITokenUsage {
  id: string;
  userId: string;
  tenantId: string;
  feature: string; // "ai_assistant", "smart_suggestions", "auto_categorize", etc.
  creditsCost: number;
  tokensInput: number;
  tokensOutput: number;
  taskComplexity: "simple" | "medium" | "complex";
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS
// ═══════════════════════════════════════════════════════════

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    monthlyCredits: 50,
    monthlyPrice: 0,
    features: ["basic_suggestions"],
  },
  BASIC: {
    name: "Basic",
    monthlyCredits: 500,
    monthlyPrice: 2500, // EGP 2,500
    features: ["ai_assistant", "smart_suggestions", "auto_categorize"],
  },
  PRO: {
    name: "Pro",
    monthlyCredits: 2000,
    monthlyPrice: 7500, // EGP 7,500
    features: ["ai_assistant", "smart_suggestions", "auto_categorize", "predictive_analytics", "auto_report"],
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyCredits: 10000,
    monthlyPrice: 25000, // EGP 25,000
    features: ["all"],
  },
} as const;

// ═══════════════════════════════════════════════════════════
// CREDIT COSTS PER FEATURE
// ═══════════════════════════════════════════════════════════

export const FEATURE_CREDIT_COSTS: Record<string, number> = {
  // Simple tasks (1 credit each)
  basic_suggestions: 1,
  quick_question: 1,
  auto_categorize: 1,

  // Medium tasks (3 credits each)
  ai_assistant: 3,
  smart_suggestions: 3,
  spend_analysis: 3,
  supplier_recommendation: 3,

  // Complex tasks (5 credits each)
  predictive_analytics: 5,
  auto_report: 5,
  strategy_recommendation: 5,
  code_generation: 5,
};

// ═══════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Get user's AI credits balance
 */
export async function getAICreditsBalance(
  userId: string,
  tenantId: string
): Promise<AICreditsBalance> {
  // Check if user has an active subscription
  const subscription = await prisma.aISubscription.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get usage this billing period
  const periodStart = subscription?.startedAt || new Date(new Date().setDate(1));
  const usage = await prisma.aITokenUsage.aggregate({
    where: {
      userId,
      tenantId,
      createdAt: { gte: periodStart },
    },
    _sum: { creditsCost: true },
  });

  const tier = subscription?.tier || "FREE";
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  const totalCredits = tierConfig.monthlyCredits;
  const usedCredits = usage._sum.creditsCost || 0;

  return {
    userId,
    tenantId,
    totalCredits,
    usedCredits,
    availableCredits: Math.max(0, totalCredits - usedCredits),
    subscriptionTier: tier as keyof typeof SUBSCRIPTION_TIERS,
    subscriptionExpiresAt: subscription?.expiresAt?.toISOString() || null,
    lastRenewalAt: subscription?.startedAt?.toISOString() || null,
  };
}

/**
 * Check if user has enough credits for a feature
 */
export async function hasEnoughCredits(
  userId: string,
  tenantId: string,
  feature: string
): Promise<{ allowed: boolean; balance: AICreditsBalance; requiredCredits: number }> {
  const balance = await getAICreditsBalance(userId, tenantId);
  const requiredCredits = FEATURE_CREDIT_COSTS[feature] || 1;

  return {
    allowed: balance.availableCredits >= requiredCredits,
    balance,
    requiredCredits,
  };
}

/**
 * Deduct credits for an AI action
 */
export async function deductAICredits(params: {
  userId: string;
  tenantId: string;
  feature: string;
  tokensInput: number;
  tokensOutput: number;
  taskComplexity: "simple" | "medium" | "complex";
}): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  const { userId, tenantId, feature, tokensInput, tokensOutput, taskComplexity } = params;

  // Check balance
  const { allowed, balance, requiredCredits } = await hasEnoughCredits(userId, tenantId, feature);

  if (!allowed) {
    return {
      success: false,
      remainingCredits: balance.availableCredits,
      error: `Insufficient AI credits. Required: ${requiredCredits}, Available: ${balance.availableCredits}. Please upgrade your subscription.`,
    };
  }

  // Deduct credits
  await prisma.$transaction([
    prisma.aITokenUsage.create({
      data: {
        userId,
        tenantId,
        feature,
        creditsCost: requiredCredits,
        tokensInput,
        tokensOutput,
        taskComplexity,
      },
    }),
  ]);

  return {
    success: true,
    remainingCredits: balance.availableCredits - requiredCredits,
  };
}

/**
 * Create or renew subscription
 */
export async function createSubscription(params: {
  userId: string;
  tenantId: string;
  tier: keyof typeof SUBSCRIPTION_TIERS;
  paymentReference?: string;
}): Promise<{ success: boolean; subscriptionId: string; expiresAt: Date }> {
  const { userId, tenantId, tier, paymentReference } = params;
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  if (tier === "FREE") {
    throw new Error("Cannot subscribe to FREE tier");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subscription = await prisma.aISubscription.create({
    data: {
      userId,
      tenantId,
      tier,
      status: "ACTIVE",
      monthlyCredits: tierConfig.monthlyCredits,
      monthlyPrice: tierConfig.monthlyPrice,
      startedAt: now,
      expiresAt,
      paymentReference,
    },
  });

  // Log the subscription creation
  await prisma.auditLog.create({
    data: {
      tenantId,
      entityId: subscription.id,
      actorId: userId,
      actionType: "CREATE",
      changes: {
        tier,
        monthlyCredits: tierConfig.monthlyCredits,
        monthlyPrice: tierConfig.monthlyPrice,
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  return {
    success: true,
    subscriptionId: subscription.id,
    expiresAt,
  };
}

/**
 * Get usage history
 */
export async function getUsageHistory(
  userId: string,
  tenantId: string,
  days: number = 30
): Promise<AITokenUsage[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const usage = await prisma.aITokenUsage.findMany({
    where: {
      userId,
      tenantId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
  });

  return usage.map((u) => ({
    id: u.id,
    userId: u.userId,
    tenantId: u.tenantId,
    feature: u.feature,
    creditsCost: u.creditsCost,
    tokensInput: u.tokensInput,
    tokensOutput: u.tokensOutput,
    taskComplexity: u.taskComplexity as "simple" | "medium" | "complex",
    createdAt: u.createdAt.toISOString(),
  }));
}
