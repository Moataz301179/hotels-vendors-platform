import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';

type LedgerEventInput = {
  tenantId: string;
  rootRfqId?: string | null;
  orderId?: string | null;
  invoiceId?: string | null;
  sourceEntityName: string;
  sourceEntityId: string;
  eventType: string;
  actorId?: string | null;
  actorRole?: string | null;
  verificationMethod?: string | null;
  documentHash?: string | null;
  payload?: Record<string, unknown> | null;
  auditLogId: string;
  occurredAt?: Date;
  status?: 'OPEN' | 'COMPLETED' | 'ARCHIVED' | 'VOIDED';
  finalizedAt?: Date | null;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Records an immutable, transaction-scoped evidence event alongside the
 * existing audit entry. Mutable RFQ/order/invoice rows remain operational
 * projections; corrections must create a later ledger event instead of
 * overwriting the original record.
 */
export async function appendNetworkTransactionEvent(tx: Prisma.TransactionClient, input: LedgerEventInput) {
  const lockKey = input.rootRfqId ?? input.orderId ?? input.invoiceId;
  if (!lockKey) throw new Error('NETWORK_TRANSACTION_ROOT_REQUIRED');
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

  const transaction = await tx.networkTransaction.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [
        ...(input.rootRfqId ? [{ rootRfqId: input.rootRfqId }] : []),
        ...(input.orderId ? [{ orderId: input.orderId }] : []),
        ...(input.invoiceId ? [{ invoiceId: input.invoiceId }] : []),
      ],
    },
    select: { id: true, latestEventHash: true },
  });

  const networkTransaction = transaction ?? await tx.networkTransaction.create({
    data: {
      tenantId: input.tenantId,
      rootRfqId: input.rootRfqId ?? undefined,
      orderId: input.orderId ?? undefined,
      invoiceId: input.invoiceId ?? undefined,
      status: input.status ?? 'OPEN',
      finalizedAt: input.finalizedAt ?? undefined,
    },
    select: { id: true, latestEventHash: true },
  });

  const lastEvent = await tx.networkTransactionEvent.findFirst({
    where: { networkTransactionId: networkTransaction.id },
    orderBy: { recordedAt: 'desc' },
    select: { recordedAt: true, hash: true },
  });
  const recordedAt = new Date(Math.max(Date.now(), (lastEvent?.recordedAt.getTime() ?? 0) + 1));
  const previousHash = lastEvent?.hash ?? networkTransaction.latestEventHash ?? 'genesis';
  const payload = input.payload ?? null;
  const payloadHash = sha256(stableStringify(payload));
  const id = randomUUID();
  const hash = sha256(stableStringify({
    id, networkTransactionId: networkTransaction.id, tenantId: input.tenantId,
    sourceEntityName: input.sourceEntityName, sourceEntityId: input.sourceEntityId,
    eventType: input.eventType, occurredAt: (input.occurredAt ?? recordedAt).toISOString(),
    recordedAt: recordedAt.toISOString(), actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null, verificationMethod: input.verificationMethod ?? null,
    documentHash: input.documentHash ?? null, payloadHash, auditLogId: input.auditLogId, previousHash,
  }));

  const event = await tx.networkTransactionEvent.create({
    data: {
      id, networkTransactionId: networkTransaction.id, tenantId: input.tenantId,
      sourceEntityName: input.sourceEntityName as never, sourceEntityId: input.sourceEntityId,
      eventType: input.eventType as never, occurredAt: input.occurredAt ?? recordedAt, recordedAt,
      actorId: input.actorId ?? null, actorRole: input.actorRole ?? null,
      verificationMethod: input.verificationMethod ?? null, documentHash: input.documentHash ?? null,
      payload: payload as Prisma.InputJsonValue, payloadHash, previousHash, hash, auditLogId: input.auditLogId,
    },
    select: { id: true, hash: true },
  });

  await tx.networkTransaction.update({
    where: { id: networkTransaction.id },
    data: {
      rootRfqId: input.rootRfqId ?? undefined,
      orderId: input.orderId ?? undefined,
      invoiceId: input.invoiceId ?? undefined,
      status: input.status ?? undefined,
      finalizedAt: input.finalizedAt ?? undefined,
      latestEventHash: event.hash,
      eventCount: { increment: 1 },
    },
  });
  return { transactionId: networkTransaction.id, eventId: event.id, hash: event.hash };
}
