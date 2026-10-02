// Stub data for inventory page — imported locally so the page no longer depends
// on lib/stubs-export. In production, replace with data from the real inventory API.

export const INVENTORY = [
  { id: "INV-001", productId: "PROD-001", currentStock: 120, minThreshold: 50, maxThreshold: 200, reorderPoint: 75, autoReorder: true, status: "ok" },
  { id: "INV-002", productId: "PROD-002", currentStock: 18, minThreshold: 30, maxThreshold: 100, reorderPoint: 40, autoReorder: true, status: "low" },
  { id: "INV-003", productId: "PROD-003", currentStock: 5, minThreshold: 10, maxThreshold: 50, reorderPoint: 15, autoReorder: true, status: "critical" },
  { id: "INV-004", productId: "PROD-004", currentStock: 85, minThreshold: 40, maxThreshold: 150, reorderPoint: 60, autoReorder: false, status: "ok" },
  { id: "INV-005", productId: "PROD-005", currentStock: 0, minThreshold: 20, maxThreshold: 80, reorderPoint: 25, autoReorder: true, status: "critical" },
];

export function productById(id: string) {
  // In production, fetch from real product API
  const products: Record<string, { id: string; sku: string; name: string }> = {
    "PROD-001": { id: "PROD-001", sku: "MINI-001", name: "Mini Bar Item A" },
    "PROD-002": { id: "PROD-002", sku: "CLEAN-002", name: "Cleaning Supply B" },
    "PROD-003": { id: "PROD-003", sku: "LINEN-003", name: "Linen C" },
    "PROD-004": { id: "PROD-004", sku: "FOOD-004", name: "Food Item D" },
    "PROD-005": { id: "PROD-005", sku: "AMEN-005", name: "Amenity E" },
  };
  return products[id];
}
