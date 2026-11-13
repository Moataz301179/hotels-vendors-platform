export type RecordedQuote = {
  reference: string;
  unitPrice: number | string;
  currency: string;
};

export type QuoteSpan = {
  count: number;
  low: { reference: string; unitPrice: number; currency: string };
  high: { reference: string; unitPrice: number; currency: string };
};

/** Lowest and highest recorded unit prices. Values come only from the loaded quotes. */
export function recordedQuoteSpan(quotes: readonly RecordedQuote[]): QuoteSpan | null {
  const ranked = quotes.flatMap((quote) => {
    const unitPrice = typeof quote.unitPrice === "number" ? quote.unitPrice : Number(quote.unitPrice);
    if (!Number.isFinite(unitPrice)) return [];
    return [{ reference: quote.reference, unitPrice, currency: quote.currency }];
  }).sort((left, right) => left.unitPrice - right.unitPrice);
  const low = ranked[0];
  const high = ranked[ranked.length - 1];
  if (!low || !high) return null;
  return { count: ranked.length, low, high };
}
