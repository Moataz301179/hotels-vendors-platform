export const REQUIRED_V2_TABLES = [
  'Tenant',
  'User',
  'Product',
  'Supplier',
  'Order',
  'Opportunity',
  'SavingsLedger',
  'EvidenceRecord',
  'AuditLog',
] as const;

export type TablePresence = { table_name: string; present: boolean };

export function getMissingRequiredTables(checks: TablePresence[]): string[] {
  const present = new Set(checks.filter((check) => check.present).map((check) => check.table_name));
  return REQUIRED_V2_TABLES.filter((tableName) => !present.has(tableName));
}
