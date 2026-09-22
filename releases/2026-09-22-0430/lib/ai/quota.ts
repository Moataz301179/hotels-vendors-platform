/**
 * AI Usage Quota Service
 * Enforces daily message/token limits per user plan.
 */

import { prisma } from "@/lib/prisma";

export interface QuotaResult {
  allowed: boolean;
  message?: string;
}

export interface QuotaStatus {
  plan: string;
  messagesToday: number;
  messagesLimit: number;
  tokensToday: number;
  tokensLimit: number;
  remainingMessages: number;
  remainingTokens: number;
  resetAt: Date;
}

const PLAN_LIMITS: Record<string, { messages: number; tokens: number }> = {
  FREE: { messages: 2, tokens: 2000 },
  BASIC: { messages: 50, tokens: 50000 },
  PRO: { messages: 200, tokens: 200000 },
  ENTERPRISE: { messages: Infinity, tokens: Infinity },
};

function startOfDay(d: Date = new Date()): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

/**
 * Ensure AiUsage record exists for user. Create if missing.
 */
export async function ensureAiUsage(userId: string): Promise<void> {
  const existing = await prisma.aiUsage.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.aiUsage.create({
      data: { userId, messagesToday: 0, tokensToday: 0, messagesTotal: 0, tokensTotal: 0 },
    });
  }
}

/**
 * Reset daily counters if quotaResetAt is before start of today.
 */
export async function resetDailyQuotaIfNeeded(userId: string): Promise<void> {
  const usage = await prisma.aiUsage.findUnique({ where: { userId } });
  if (!usage) return;

  const today = startOfDay();
  if (usage.quotaResetAt < today) {
    await prisma.aiUsage.update({
      where: { userId },
      data: {
        messagesToday: 0,
        tokensToday: 0,
        quotaResetAt: new Date(),
      },
    });
  }
}

/**
 * Check if user is allowed to send a message.
 */
export async function enforceQuota(userId: string): Promise<QuotaResult> {
  await ensureAiUsage(userId);
  await resetDailyQuotaIfNeeded(userId);

  const usage = await prisma.aiUsage.findUnique({ where: { userId } });
  if (!usage) {
    return { allowed: false, message: "Unable to check usage quota. Please try again." };
  }

  const plan = usage.plan;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  if (limits.messages !== Infinity && usage.messagesToday >= limits.messages) {
    return {
      allowed: false,
      message:
        plan === "FREE"
          ? "You've reached your daily limit of 2 free questions. Upgrade to HotelsVendors Pro for unlimited AI access."
          : `You've reached your daily limit of ${limits.messages} messages. Your quota resets at midnight.`,
    };
  }

  if (limits.tokens !== Infinity && usage.tokensToday >= limits.tokens) {
    return {
      allowed: false,
      message: `You've reached your daily token limit. Your quota resets at midnight.`,
    };
  }

  return { allowed: true };
}

/**
 * Increment usage after a successful AI response.
 */
export async function incrementUsage(userId: string, tokens: number): Promise<void> {
  await prisma.aiUsage.update({
    where: { userId },
    data: {
      messagesToday: { increment: 1 },
      tokensToday: { increment: tokens },
      messagesTotal: { increment: 1 },
      tokensTotal: { increment: tokens },
    },
  });
}

/**
 * Get current quota status for a user.
 */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  await ensureAiUsage(userId);
  await resetDailyQuotaIfNeeded(userId);

  const usage = await prisma.aiUsage.findUnique({ where: { userId } });
  if (!usage) {
    return {
      plan: "FREE",
      messagesToday: 0,
      messagesLimit: PLAN_LIMITS.FREE.messages,
      tokensToday: 0,
      tokensLimit: PLAN_LIMITS.FREE.tokens,
      remainingMessages: PLAN_LIMITS.FREE.messages,
      remainingTokens: PLAN_LIMITS.FREE.tokens,
      resetAt: startOfDay(new Date(Date.now() + 86400000)),
    };
  }

  const plan = usage.plan;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

  const remainingMessages =
    limits.messages === Infinity ? Infinity : Math.max(0, limits.messages - usage.messagesToday);
  const remainingTokens =
    limits.tokens === Infinity ? Infinity : Math.max(0, limits.tokens - usage.tokensToday);

  // Reset at start of next day
  const tomorrow = startOfDay(new Date(Date.now() + 86400000));

  return {
    plan,
    messagesToday: usage.messagesToday,
    messagesLimit: limits.messages,
    tokensToday: usage.tokensToday,
    tokensLimit: limits.tokens,
    remainingMessages,
    remainingTokens,
    resetAt: tomorrow,
  };
}
