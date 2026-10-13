import type { OperationsResult } from "./operations-contract";
export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function operationsCsv(report: OperationsResult) {
  return [report.columns.map(column => csvCell(column.label)).join(","), ...report.rows.map(row => report.columns.map(column => csvCell(row[column.key])).join(","))].join("\r\n");
}
