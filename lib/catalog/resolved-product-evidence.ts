import type { Prisma, PrismaClient } from '@prisma/client';

type EvidenceReader = Pick<PrismaClient, 'evidenceRecord'> | Pick<Prisma.TransactionClient, 'evidenceRecord'>;

/** A supplier listing is eligible for buyer workflows only after its exact source has a resolved evidence record. */
export async function hasResolvedProductEvidence(reader: EvidenceReader, product: { id: string; sourceKey: string | null }) {
  if (!product.sourceKey) return false;
  return Boolean(await reader.evidenceRecord.findFirst({
    where: { entityId: product.id, entityName: 'PRODUCT', sourceUrl: product.sourceKey, status: 'RESOLVED', deletedAt: null },
    select: { id: true },
  }));
}

/** Resolve a catalogue page in one evidence query instead of trusting active-status alone. */
export async function resolvedProductEvidenceIds(reader: EvidenceReader, products: { id: string; sourceKey: string | null }[]) {
  const candidates = products.filter((product) => product.sourceKey);
  if (!candidates.length) return new Set<string>();
  const evidence = await reader.evidenceRecord.findMany({
    where: { entityId: { in: candidates.map((product) => product.id) }, entityName: 'PRODUCT', status: 'RESOLVED', deletedAt: null },
    select: { entityId: true, sourceUrl: true },
  });
  const sourceById = new Map(candidates.map((product) => [product.id, product.sourceKey]));
  return new Set(evidence.filter((item) => item.entityId && item.sourceUrl === sourceById.get(item.entityId)).map((item) => item.entityId!));
}
