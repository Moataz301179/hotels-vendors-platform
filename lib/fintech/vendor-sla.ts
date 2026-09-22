export interface VendorSLA {
  supplierId: string;
  supplierName: string;
  onTimeRate: number;
  qualityRate: number;
  fulfillmentRate: number;
  avgResponseHours: number;
  totalDeliveries: number;
  lateDeliveries: number;
  rejectedItems: number;
  reliabilityIndex: number;
  trend: 'improving' | 'stable' | 'declining';
}

const VENDOR_SLA_DATA: Record<string, Omit<VendorSLA, 'reliabilityIndex' | 'trend'>> = {
  s1: { supplierId: 's1', supplierName: 'Misr F&B Distribution', onTimeRate: 95, qualityRate: 98, fulfillmentRate: 96, avgResponseHours: 4, totalDeliveries: 142, lateDeliveries: 7, rejectedItems: 3 },
  s2: { supplierId: 's2', supplierName: 'Nile Housekeeping Supply Co.', onTimeRate: 82, qualityRate: 88, fulfillmentRate: 84, avgResponseHours: 8, totalDeliveries: 98, lateDeliveries: 18, rejectedItems: 12 },
  s3: { supplierId: 's3', supplierName: 'Delta Engineering & Facilities', onTimeRate: 70, qualityRate: 75, fulfillmentRate: 72, avgResponseHours: 14, totalDeliveries: 54, lateDeliveries: 16, rejectedItems: 8 },
};

function calculateReliabilityIndex(sla: Omit<VendorSLA, 'reliabilityIndex' | 'trend'>): number {
  const onTimeWeight = 0.4;
  const qualityWeight = 0.35;
  const fulfillmentWeight = 0.25;
  return Math.round(sla.onTimeRate * onTimeWeight + sla.qualityRate * qualityWeight + sla.fulfillmentRate * fulfillmentWeight);
}

function determineTrend(supplierId: string): 'improving' | 'stable' | 'declining' {
  const sla = VENDOR_SLA_DATA[supplierId];
  if (!sla) return 'stable';
  if (sla.onTimeRate >= 90) return 'improving';
  if (sla.onTimeRate < 75) return 'declining';
  return 'stable';
}

export function getVendorSLA(supplierId: string): VendorSLA | undefined {
  const sla = VENDOR_SLA_DATA[supplierId];
  if (!sla) return undefined;
  return { ...sla, reliabilityIndex: calculateReliabilityIndex(sla), trend: determineTrend(supplierId) };
}

export function getAllVendorSLAs(): VendorSLA[] {
  return Object.keys(VENDOR_SLA_DATA).map((id) => getVendorSLA(id)!);
}

export function getReliabilityBadge(index: number): { label: string; color: string } {
  if (index >= 90) return { label: 'Excellent', color: 'green' };
  if (index >= 75) return { label: 'Good', color: 'yellow' };
  if (index >= 60) return { label: 'Fair', color: 'orange' };
  return { label: 'Poor', color: 'red' };
}
