import { describe, expect, it } from 'vitest';
import { CsvPortalConnector } from '@/lib/integration/connectors/CSVPortal';

const connector = new CsvPortalConnector({ ftpHost: '', ftpUser: '', ftpPass: '', inboundDir: '', outboundDir: '' });

describe('CSV portal integration boundary', () => {
  it('parses quoted commas, escaped quotes, and CRLF rows', () => {
    expect(connector.parseInventoryCsv('sku,name,stock,min_threshold\r\nA-1,"Beans, arabica",12,4\r\nB-2,"Bath ""towels""",8,2\r\n')).toEqual([
      { sku: 'A-1', name: 'Beans, arabica', stock: 12, minThreshold: 4 },
      { sku: 'B-2', name: 'Bath "towels"', stock: 8, minThreshold: 2 },
    ]);
  });

  it('rejects malformed numeric fields instead of producing NaN', () => {
    expect(() => connector.parseOrdersCsv('po_id,supplier,status,total\nPO-1,S1,approved,not-a-number\n')).toThrow('CSV_INVALID_INTEGER:total');
  });

  it('fails closed on duplicate headers and row width drift', () => {
    expect(() => connector.parseInventoryCsv('sku,name,stock,stock\nA-1,Beans,12,4\n')).toThrow('CSV_DUPLICATE_HEADER');
    expect(() => connector.parseInventoryCsv('sku,name,stock,min_threshold\nA-1,Beans,12\n')).toThrow('CSV_ROW_WIDTH_MISMATCH');
    expect(() => connector.parseInventoryCsv('sku,name,stock,min_threshold\nA-1,Beans,9007199254740992,4\n')).toThrow('CSV_INVALID_INTEGER:stock');
  });

  it('escapes generated receiving and invoice values', () => {
    expect(connector.generateReceivingCsv([{ poId: 'PO,1', items: [{ sku: 'SKU-1', expected: 2, received: 1, condition: 'Good, sealed' }] }])).toBe('po_id,sku,expected,received,condition\n"PO,1",SKU-1,2,1,"Good, sealed"\n');
    expect(connector.generateInvoiceCsv([{ number: 'INV"1', poId: 'PO-1', total: 10, vat: 1.4 }])).toBe('invoice_number,po_id,total,vat\n"INV""1",PO-1,10,1.4\n');
  });
});
