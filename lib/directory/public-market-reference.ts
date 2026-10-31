export type PublicMarketReference = {
  price: number;
  currency: string;
  observedAt: string;
  label: string;
  moq: number | null;
};

/** Public discovery never exposes price or MOQ data before controlled RFQ. */
export function publicMarketReference(attributes: unknown): PublicMarketReference | null {
  void attributes;
  return null;
}
