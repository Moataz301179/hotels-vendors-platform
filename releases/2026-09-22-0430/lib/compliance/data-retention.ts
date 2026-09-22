/**
 * Data Retention & Cleanup Service
 * Hotels Vendors Compliance Layer
 *
 * Enforces data retention policies per Egyptian PDPL (Law No. 151 of 2020)
 * and Egyptian Tax Law requirements.
 *
 * Retention periods:
 *   - AuditLog:         7 years (Egyptian commercial law)
 *   - Invoice/Order:    10 years (Egyptian tax law)
 *   - Session/Token:    30 days
 *   - Analytics:        90 days
 *   - OutreachLog:      1 year (marketing consent records)
 *   - ChatMessage:      90 days (AI conversations)
 *   - Lead/WaitingList: 1 year (lead lifecycle)
 *   - SwarmMemory:      6 months
 *   - AgentRun:         90 days
 *
 * Usage:
 *   import { runRetentionCleanup } from "@/lib/compliance/data-retention";
 *   const result = await runRetentionCleanup();
 *
 * For scheduled execution, call from a cron job or BullMQ repeatable job.
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// 1. RETENTION POLICY DEFINITIONS
// ─────────────────────────────────────────

export interface RetentionPolicy {
  model: string;
  label: string;
  retentionDays: number;
  description: string;
  /**
   * If true, records are hard-deleted.
   * If false, records are soft-deleted (requires a `deletedAt` field on the model).
   */
  hardDelete: boolean;
}

/**
 * Retention periods aligned with Egyptian law and platform policy.
 */
export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    model: "auditLog",
    label: "Audit Logs",
    retentionDays: 7 * 365, // 7 years — Egyptian commercial law
    description: "Immutable audit trail. Hard-deleted after retention period.",
    hardDelete: true,
  },
  {
    model: "invoice",
    label: "Invoices",
    retentionDays: 10 * 365, // 10 years — Egyptian tax law
    description: "ETA-submitted invoices. Hard-deleted after retention period.",
    hardDelete: true,
  },
  {
    model: "order",
    label: "Orders",
    retentionDays: 10 * 365, // 10 years — Egyptian tax law
    description: "Purchase orders linked to invoices. Hard-deleted after retention period.",
    hardDelete: true,
  },
  {
    model: "emailVerificationToken",
    label: "Email Verification Tokens",
    retentionDays: 30,
    description: "Expired email verification tokens.",
    hardDelete: true,
  },
  {
    model: "passwordResetToken",
    label: "Password Reset Tokens",
    retentionDays: 7,
    description: "Expired password reset tokens.",
    hardDelete: true,
  },
  {
    model: "outreachLog",
    label: "Outreach Logs",
    retentionDays: 365, // 1 year — marketing consent records
    description: "Marketing outreach records for consent audit trail.",
    hardDelete: true,
  },
  {
    model: "chatMessage",
    label: "AI Chat Messages",
    retentionDays: 90,
    description: "AI conversation messages. May contain sensitive business info.",
    hardDelete: true,
  },
  {
    model: "conversation",
    label: "AI Conversations",
    retentionDays: 90,
    description: "AI conversation sessions. Cleaned up with chat messages.",
    hardDelete: true,
  },
  {
    model: "lead",
    label: "Leads",
    retentionDays: 365, // 1 year
    description: "Sales leads. Hard-deleted after lifecycle.",
    hardDelete: true,
  },
  {
    model: "waitingListEntry",
    label: "Waiting List Entries",
    retentionDays: 365, // 1 year
    description: "Waiting list signups. Hard-deleted after processing.",
    hardDelete: true,
  },
  {
    model: "swarmMemory",
    label: "Swarm Agent Memory",
    retentionDays: 180, // 6 months
    description: "Agent memory entries. Cleaned up periodically.",
    hardDelete: true,
  },
  {
    model: "agentRun",
    label: "Agent Runs",
    retentionDays: 90,
    description: "Agent execution logs. Hard-deleted after retention.",
    hardDelete: true,
  },
  {
    model: "spendRecord",
    label: "Spend Records",
    retentionDays: 3 * 365, // 3 years
    description: "Aggregated spend analytics. Hard-deleted after retention.",
    hardDelete: true,
  },
  {
    model: "inventorySnapshot",
    label: "Inventory Snapshots",
    retentionDays: 365, // 1 year
    description: "Historical inventory snapshots. Hard-deleted after retention.",
    hardDelete: true,
  },
];

// ─────────────────────────────────────────
// 2. CLEANUP EXECUTION
// ─────────────────────────────────────────

export interface RetentionCleanupResult {
  model: string;
  label: string;
  recordsDeleted: number;
  cutoffDate: Date;
  error?: string;
}

/**
 * Run the full data retention cleanup.
 * Processes each policy in order, deleting records older than the retention period.
 *
 * @param options.dryRun - If true, only counts records without deleting
 * @param options.models - If provided, only processes these model names
 */
export async function runRetentionCleanup(options?: {
  dryRun?: boolean;
  models?: string[];
}): Promise<RetentionCleanupResult[]> {
  const { dryRun = false, models: targetModels } = options ?? {};
  const results: RetentionCleanupResult[] = [];

  const policies = targetModels
    ? RETENTION_POLICIES.filter((p) => targetModels.includes(p.model))
    : RETENTION_POLICIES;

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    try {
      const whereClause = {
        createdAt: { lt: cutoffDate },
      };

      // Count records to be deleted
      const count = await getCount(policy.model, whereClause);

      if (count === 0) {
        results.push({
          model: policy.model,
          label: policy.label,
          recordsDeleted: 0,
          cutoffDate,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          model: policy.model,
          label: policy.label,
          recordsDeleted: count,
          cutoffDate,
        });
        continue;
      }

      // Execute deletion
      const deleted = await deleteRecords(policy.model, whereClause);

      results.push({
        model: policy.model,
        label: policy.label,
        recordsDeleted: deleted,
        cutoffDate,
      });

      console.log(
        `[DataRetention] Cleaned ${deleted} ${policy.label} records (before ${cutoffDate.toISOString()})`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[DataRetention] Failed to clean ${policy.label}: ${errorMessage}`
      );
      results.push({
        model: policy.model,
        label: policy.label,
        recordsDeleted: 0,
        cutoffDate,
        error: errorMessage,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────
// 3. MODEL-SPECIFIC DELETION LOGIC
// ─────────────────────────────────────────

async function getCount(
  model: string,
  where: { createdAt: { lt: Date } }
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as Record<string, any>)[model];
  if (!prismaModel?.count) {
    throw new Error(`Model "${model}" not found in Prisma client`);
  }
  return prismaModel.count({ where });
}

async function deleteRecords(
  model: string,
  where: { createdAt: { lt: Date } }
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as Record<string, any>)[model];
  if (!prismaModel?.deleteMany) {
    throw new Error(`Model "${model}" not found in Prisma client`);
  }

  // For models with foreign key dependencies, we need cascading deletes.
  // Prisma handles onDelete: Cascade in schema, so deleteMany works.
  const result = await prismaModel.deleteMany({ where });
  return result.count;
}

// ─────────────────────────────────────────
// 4. SUMMARY
// ─────────────────────────────────────────

/**
 * Get a summary of all retention policies and their current record counts.
 * Useful for compliance dashboards.
 */
export async function getRetentionSummary(): Promise<
  Array<{
    model: string;
    label: string;
    retentionDays: number;
    description: string;
    totalRecords: number;
    recordsPastRetention: number;
  }>
> {
  const summary = [];

  for (const policy of RETENTION_POLICIES) {
    try {
      const totalRecords = await getCount(policy.model, {
        createdAt: { lt: new Date("2099-01-01") }, // all records
      });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
      const recordsPastRetention = await getCount(policy.model, {
        createdAt: { lt: cutoffDate },
      });

      summary.push({
        model: policy.model,
        label: policy.label,
        retentionDays: policy.retentionDays,
        description: policy.description,
        totalRecords,
        recordsPastRetention,
      });
    } catch {
      // Model might not exist yet
      summary.push({
        model: policy.model,
        label: policy.label,
        retentionDays: policy.retentionDays,
        description: policy.description,
        totalRecords: 0,
        recordsPastRetention: 0,
      });
    }
  }

  return summary;
}
