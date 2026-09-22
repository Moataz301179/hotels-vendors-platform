export class CsvPortalConnector {
  private config: { ftpHost: string; ftpUser: string; ftpPass: string; inboundDir: string; outboundDir: string };

  constructor(config: { ftpHost: string; ftpUser: string; ftpPass: string; inboundDir: string; outboundDir: string }) {
    this.config = config;
  }

  async downloadInbound(): Promise<{ filename: string; content: string }[]> {
    // Simulate FTP download
    return [
      { filename: 'inventory_sync_20260919.csv', content: 'sku,name,stock,min_threshold\nFBN-1001,Coffee Beans,120,50\nHK-2001,Bath Towels,45,25' },
      { filename: 'orders_export_20260919.csv', content: 'po_id,supplier,status,total\nPO-2026-001,s1,approved,24000' },
    ];
  }

  async uploadOutbound(filename: string, content: string) {
    // Simulate FTP upload
    return { filename, status: 'uploaded', bytes: content.length };
  }

  parseInventoryCsv(content: string): { sku: string; name: string; stock: number; minThreshold: number }[] {
    const lines = content.split('\n').slice(1); // skip header
    return lines.filter((l) => l.trim()).map((line) => {
      const [sku, name, stock, minThreshold] = line.split(',');
      return { sku, name, stock: parseInt(stock), minThreshold: parseInt(minThreshold) };
    });
  }

  parseOrdersCsv(content: string): { poId: string; supplier: string; status: string; total: number }[] {
    const lines = content.split('\n').slice(1);
    return lines.filter((l) => l.trim()).map((line) => {
      const [poId, supplier, status, total] = line.split(',');
      return { poId, supplier, status, total: parseInt(total) };
    });
  }

  generateReceivingCsv(receivingData: { poId: string; items: { sku: string; expected: number; received: number; condition: string }[] }[]): string {
    let csv = 'po_id,sku,expected,received,condition\n';
    for (const r of receivingData) {
      for (const item of r.items) {
        csv += `${r.poId},${item.sku},${item.expected},${item.received},${item.condition}\n`;
      }
    }
    return csv;
  }

  generateInvoiceCsv(invoiceData: { number: string; poId: string; total: number; vat: number }[]): string {
    let csv = 'invoice_number,po_id,total,vat\n';
    for (const inv of invoiceData) {
      csv += `${inv.number},${inv.poId},${inv.total},${inv.vat}\n`;
    }
    return csv;
  }
}
