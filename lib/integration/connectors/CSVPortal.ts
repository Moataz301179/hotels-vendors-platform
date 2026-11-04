import { connectionUnavailable } from '../connection-contract';

export class CsvPortalConnector {
  private config: { ftpHost: string; ftpUser: string; ftpPass: string; inboundDir: string; outboundDir: string };

  constructor(config: { ftpHost: string; ftpUser: string; ftpPass: string; inboundDir: string; outboundDir: string }) {
    this.config = config;
  }

  async downloadInbound(): Promise<{ filename: string; content: string }[]> {
    return connectionUnavailable('CSV_PORTAL', 'inbound file transfer');
  }

  async uploadOutbound(filename: string, content: string) {
    void filename;
    void content;
    return connectionUnavailable('CSV_PORTAL', 'outbound file transfer');
  }

  parseInventoryCsv(content: string): { sku: string; name: string; stock: number; minThreshold: number }[] {
    return parseRows(content, ['sku', 'name', 'stock', 'min_threshold']).map((row) => ({
      sku: row.sku,
      name: row.name,
      stock: parseInteger(row.stock, 'stock'),
      minThreshold: parseInteger(row.min_threshold, 'min_threshold'),
    }));
  }

  parseOrdersCsv(content: string): { poId: string; supplier: string; status: string; total: number }[] {
    return parseRows(content, ['po_id', 'supplier', 'status', 'total']).map((row) => ({
      poId: row.po_id,
      supplier: row.supplier,
      status: row.status,
      total: parseInteger(row.total, 'total'),
    }));
  }

  generateReceivingCsv(receivingData: { poId: string; items: { sku: string; expected: number; received: number; condition: string }[] }[]): string {
    const rows = ['po_id,sku,expected,received,condition'];
    for (const r of receivingData) {
      for (const item of r.items) {
        rows.push([r.poId, item.sku, item.expected, item.received, item.condition].map(csvCell).join(','));
      }
    }
    return `${rows.join('\n')}\n`;
  }

  generateInvoiceCsv(invoiceData: { number: string; poId: string; total: number; vat: number }[]): string {
    const rows = ['invoice_number,po_id,total,vat'];
    for (const inv of invoiceData) rows.push([inv.number, inv.poId, inv.total, inv.vat].map(csvCell).join(','));
    return `${rows.join('\n')}\n`;
  }
}

function parseRows(content: string, requiredHeaders: string[]): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV_UNTERMINATED_QUOTE');
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift()?.map((header) => header.replace(/^\uFEFF/, '').trim().toLowerCase()) ?? [];
  if (headers.length === 0 || headers.some((header) => header === '')) throw new Error('CSV_HEADER_INVALID');
  if (new Set(headers).size !== headers.length) throw new Error('CSV_DUPLICATE_HEADER');
  if (requiredHeaders.some((header) => !headers.includes(header))) throw new Error('CSV_REQUIRED_HEADER_MISSING');
  return rows.filter((values) => values.some((value) => value.trim() !== '')).map((values) => {
    if (values.length !== headers.length) throw new Error('CSV_ROW_WIDTH_MISMATCH');
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()]));
  });
}

function parseInteger(value: string, field: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`CSV_INVALID_INTEGER:${field}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`CSV_INVALID_INTEGER:${field}`);
  return parsed;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
