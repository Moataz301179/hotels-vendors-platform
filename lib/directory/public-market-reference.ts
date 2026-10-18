export type PublicMarketReference = {
  price: number;
  currency: string;
  observedAt: string;
  label: 'Observed market price';
};

/**
 * Reduces reviewed source metadata to the single market signal that can be
 * displayed to a buyer. Source, supplier, stock, and fulfilment details stay
 * in the protected review record and are never returned from this mapper.
 */
export function publicMarketReference(attributes: unknown): PublicMarketReference | null {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return null;

  const marketReference = (attributes as Record<string, unknown>).marketReference;
  if (!marketReference || typeof marketReference !== 'object' || Array.isArray(marketReference)) return null;

  const value = marketReference as Record<string, unknown>;
  const price = value.price;
  const currency = value.currency;
  const observedAt = value.observedAt;

  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return null;
  if (typeof observedAt !== 'string' || Number.isNaN(Date.parse(observedAt))) return null;

  return { price, currency, observedAt, label: 'Observed market price' };
}
