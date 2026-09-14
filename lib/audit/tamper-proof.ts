/**
 * Tamper-Proof Audit Log
 * Hotels Vendors Compliance Layer
 *
 * Immutable append-only audit log with cryptographic hash chaining.
 * Every entry includes a hash of the previous entry, creating a chain.
 * If any entry is modified, the chain breaks and is detectable.
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// 1. HASH CHAIN
// ─────────────────────────────────────────

/**
 * Compute hash of an audit log entry.
 * Includes all fields + previous hash.
 */
export function computeEntryHash(entry: {
  id: string;
  entityName: string | null;
  entityId: string;
  actionType: string | null;
  actorId: string | null;
  actorRole: string | null;
  changes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  previousHash: string;
}): string {
  const payload = JSON.stringify({
    id: entry.id,
    entityName: entry.entityName,
    entityId: entry.entityId,
    actionType: entry.actionType,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    changes: entry.changes,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    createdAt: entry.createdAt.toISOString(),
    previousHash: entry.previousHash,
  });

  return createHash("sha256").update(payload).digest("hex");
}

// ─────────────────────────────────────────
// 2. APPEND ENTRY
// ─────────────────────────────────────────

/**
 * Append a tamper-proof audit log entry.
 * Automatically chains with previous entry.
 */
export async function appendAuditEntry(params: {
  entityName?: string;
  entityId: string;
  actionType?: string;
  tenantId: string;
  actorId?: string | null;
  actorRole?: string | null;
  changes?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  const {
    entityName,
    entityId,
    actionType,
    tenantId,
    actorId = null,
    actorRole = null,
    changes = null,
    ipAddress = null,
    userAgent = null,
  } = params;

  // Get previous entry's hash
  const previousEntry = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });

  const previousHash = previousEntry?.hash || "genesis";

  // Create entry
  const entry = await prisma.auditLog.create({
    data: {
      entityName: entityName as never,
      entityId,
      actionType: actionType as never,
      tenantId,
      actorId,
      actorRole,
      changes: typeof changes === "string" ? JSON.parse(changes) : changes,
      ipAddress,
      userAgent,
      previousHash,
      hash: "pending", // Will update after computing
    },
  });

  // Compute hash
  const hash = computeEntryHash({
    id: entry.id,
    entityName: entry.entityName as string | null,
    entityId: entry.entityId,
    actionType: entry.actionType as string | null,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    changes: entry.changes ? JSON.stringify(entry.changes) : null,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    createdAt: entry.createdAt,
    previousHash,
  });

  // Update with hash
  await prisma.auditLog.update({
    where: { id: entry.id },
    data: { hash },
  });

  return entry.id;
}

// ─────────────────────────────────────────
// 3. VERIFICATION
// ─────────────────────────────────────────

export interface VerificationResult {
  valid: boolean;
  totalEntries: number;
  brokenAtIndex?: number;
  brokenEntryId?: string;
  expectedHash?: string;
  actualHash?: string | null;
}

/**
 * Verify integrity of the entire audit log chain.
 */
export async function verifyAuditChain(): Promise<VerificationResult> {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 };
  }

  let previousHash = "genesis";

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedHash = computeEntryHash({
      id: entry.id,
      entityName: entry.entityName as string | null,
      entityId: entry.entityId,
      actionType: entry.actionType as string | null,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt,
      previousHash,
    });

    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtIndex: i,
        brokenEntryId: entry.id,
        expectedHash,
        actualHash: entry.hash,
      };
    }

    previousHash = entry.hash;
  }

  return { valid: true, totalEntries: entries.length };
}

// ─────────────────────────────────────────
// 4. EXPORT
// ─────────────────────────────────────────

/**
 * Export audit log as tamper-evident JSON.
 */
export async function exportAuditLog(params: {
  startDate?: Date;
  endDate?: Date;
  entityName?: string;
  entityId?: string;
}): Promise<{ entries: unknown[]; chainHash: string; verified: boolean }> {
  const { startDate, endDate, entityName, entityId } = params;

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }
  if (entityName) where.entityName = entityName;
  if (entityId) where.entityId = entityId;

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // Compute chain hash (Merkle-like root)
  const chainHash = entries.reduce(
    (hash, entry) => createHash("sha256").update(hash + entry.hash).digest("hex"),
    "genesis"
  );

  // Verify full chain
  const verification = await verifyAuditChain();

  return {
    entries: entries.map((e) => ({
      ...e,
      changes: e.changes,
    })),
    chainHash,
    verified: verification.valid,
  };
}
