export type RequestListProduct = {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
};

export type RequestListItem = RequestListProduct & { quantity: number; idempotencyKey?: string };

export function addProductToRequestList(items: RequestListItem[], product: RequestListProduct, quantity: number): RequestListItem[] {
  const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const existing = items.find((item) => item.id === product.id);
  return existing
    ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + safeQuantity, idempotencyKey: undefined } : item)
    : [...items, { ...product, quantity: safeQuantity }];
}

export function setRequestListQuantity(items: RequestListItem[], productId: string, quantity: number): RequestListItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) return items.filter((item) => item.id !== productId);
  return items.map((item) => item.id === productId ? { ...item, quantity, idempotencyKey: undefined } : item);
}

export function removeRecordedRequestListItems(items: RequestListItem[], productIds: string[]): RequestListItem[] {
  const recordedProductIds = new Set(productIds);
  return items.filter((item) => !recordedProductIds.has(item.id));
}
