export type CatalogReferenceBasketItem = {
  catalogReferenceId: string;
  quantity: number;
  idempotencyKey?: string;
};

export const CATALOG_REFERENCE_BASKET_STORAGE_KEY = 'hv.catalogue-reference-basket.v1';

function validReferenceId(value: string): boolean {
  return value.trim().length > 0 && value.trim().length <= 160;
}

function safeQuantity(quantity: number): number {
  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
}

/**
 * Browser basket data is deliberately minimal: opaque directory IDs and
 * quantities only. Product details are re-read from the reviewed directory
 * after authentication, so no Vendor or commercial data survives in storage.
 */
export function addCatalogReferenceToBasket(
  items: CatalogReferenceBasketItem[],
  catalogReferenceId: string,
  quantity = 1,
): CatalogReferenceBasketItem[] {
  const id = catalogReferenceId.trim();
  if (!validReferenceId(id)) return items;
  const increment = safeQuantity(quantity);
  const existing = items.find((item) => item.catalogReferenceId === id);
  return existing
    ? items.map((item) => item.catalogReferenceId === id ? { ...item, quantity: item.quantity + increment } : item)
    : [...items, { catalogReferenceId: id, quantity: increment }];
}

export function setCatalogReferenceBasketQuantity(
  items: CatalogReferenceBasketItem[],
  catalogReferenceId: string,
  quantity: number,
): CatalogReferenceBasketItem[] {
  const id = catalogReferenceId.trim();
  if (!validReferenceId(id)) return items;
  if (!Number.isInteger(quantity) || quantity <= 0) return items.filter((item) => item.catalogReferenceId !== id);
  return items.map((item) => item.catalogReferenceId === id ? { ...item, quantity, idempotencyKey: undefined } : item);
}

export function removeCatalogReferenceBasketItems(
  items: CatalogReferenceBasketItem[],
  catalogReferenceIds: string[],
): CatalogReferenceBasketItem[] {
  const recorded = new Set(catalogReferenceIds);
  return items.filter((item) => !recorded.has(item.catalogReferenceId));
}

export function parseCatalogReferenceBasket(raw: string | null): CatalogReferenceBasketItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<CatalogReferenceBasketItem[]>((items, candidate) => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return items;
      const value = candidate as Record<string, unknown>;
      if (typeof value.catalogReferenceId !== 'string' || typeof value.quantity !== 'number') return items;
      if (!Number.isInteger(value.quantity) || value.quantity <= 0) return items;
      const next=addCatalogReferenceToBasket(items, value.catalogReferenceId, value.quantity);
      const idempotencyKey=typeof value.idempotencyKey==='string'&&/^[-A-Za-z0-9._:]{16,192}$/.test(value.idempotencyKey)?value.idempotencyKey:null;
      if(!idempotencyKey)return next;
      return next.map((item)=>item.catalogReferenceId===value.catalogReferenceId?{...item,idempotencyKey}:item);
    }, []);
  } catch {
    return [];
  }
}

export function readCatalogReferenceBasket(): CatalogReferenceBasketItem[] {
  if (typeof window === 'undefined') return [];
  return parseCatalogReferenceBasket(window.localStorage.getItem(CATALOG_REFERENCE_BASKET_STORAGE_KEY));
}

export function persistCatalogReferenceBasket(items: CatalogReferenceBasketItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CATALOG_REFERENCE_BASKET_STORAGE_KEY, JSON.stringify(items));
}
