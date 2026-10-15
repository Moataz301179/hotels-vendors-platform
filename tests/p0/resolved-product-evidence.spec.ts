import { describe, expect, it, vi } from 'vitest';
import { hasResolvedProductEvidence, resolvedProductEvidenceIds } from '@/lib/catalog/resolved-product-evidence';

describe('resolved supplier product evidence', () => {
  it('requires an evidence record for the exact product source', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'evidence-1' });
    await expect(hasResolvedProductEvidence({ evidenceRecord: { findFirst } } as never, { id: 'product-1', sourceKey: 'https://supplier.example/products/towel' })).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ entityId: 'product-1', sourceUrl: 'https://supplier.example/products/towel', status: 'RESOLVED' }) }));
  });

  it('keeps products out when no source URL was recorded', async () => {
    const findFirst = vi.fn();
    await expect(hasResolvedProductEvidence({ evidenceRecord: { findFirst } } as never, { id: 'product-1', sourceKey: null })).resolves.toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('filters catalogue results to evidence records whose URL matches each product source', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { entityId: 'product-1', sourceUrl: 'https://supplier.example/products/towel' },
      { entityId: 'product-2', sourceUrl: 'https://other.example/products/soap' },
    ]);
    const ids = await resolvedProductEvidenceIds({ evidenceRecord: { findMany } } as never, [
      { id: 'product-1', sourceKey: 'https://supplier.example/products/towel' },
      { id: 'product-2', sourceKey: 'https://supplier.example/products/soap' },
      { id: 'product-3', sourceKey: null },
    ]);
    expect([...ids]).toEqual(['product-1']);
    expect(findMany).toHaveBeenCalledTimes(1);
  });
});
