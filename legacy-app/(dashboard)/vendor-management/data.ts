// Stub data for vendor-management page — imported locally so the page no longer depends
// on lib/stubs-export. In production, replace with data from the real supplier API.

export const VENDOR_SCORECARDS = [
  { supplierId: "SUP-001", overallScore: 87, onTimeRate: 94, qualityRate: 91, responseTime: 2.5, fulfillmentRate: 96, taxStatus: "verified", contractStatus: "active" },
  { supplierId: "SUP-002", overallScore: 72, onTimeRate: 81, qualityRate: 78, responseTime: 5.2, fulfillmentRate: 85, taxStatus: "pending", contractStatus: "active" },
  { supplierId: "SUP-003", overallScore: 91, onTimeRate: 97, qualityRate: 95, responseTime: 1.8, fulfillmentRate: 98, taxStatus: "verified", contractStatus: "active" },
  { supplierId: "SUP-004", overallScore: 65, onTimeRate: 70, qualityRate: 68, responseTime: 8.0, fulfillmentRate: 72, taxStatus: "expired", contractStatus: "expired" },
  { supplierId: "SUP-005", overallScore: 78, onTimeRate: 86, qualityRate: 84, responseTime: 3.1, fulfillmentRate: 89, taxStatus: "verified", contractStatus: "active" },
];

export function supplierById(id: string) {
  const suppliers: Record<string, { id: string; name: string; city: string }> = {
    "SUP-001": { id: "SUP-001", name: "October Food Industries", city: "6th of October City" },
    "SUP-002": { id: "SUP-002", name: "Ramadan Chemicals Co.", city: "10th of Ramadan City" },
    "SUP-003": { id: "SUP-003", name: "Sadat Textiles Ltd.", city: "City of Sadat" },
    "SUP-004": { id: "SUP-004", name: "Old City Supplies", city: "Cairo" },
    "SUP-005": { id: "SUP-005", name: "Brands City Packaging", city: "6th of October City" },
  };
  return suppliers[id];
}
