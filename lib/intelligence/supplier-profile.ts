
/**
 * Supplier Profile Intelligence
 */
export interface SupplierProfile {
  id: string;
  name: string;
  score: number;
  invoiceCount: number;
  totalSpend: number;
  tripCount: number;
}

export async function buildSupplierProfile(supplierId: string, tenantId: string): Promise<SupplierProfile> {
  return {
    id: supplierId,
    name: 'Unknown',
    score: 0,
    invoiceCount: 0,
    totalSpend: 0,
    tripCount: 0,
  };
}

export async function getSupplierProfile(supplierId: string, tenantId: string): Promise<SupplierProfile | null> {
  return buildSupplierProfile(supplierId, tenantId);
}
