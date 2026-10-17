import { connectionUnavailable } from "../connection-contract";

/**
 * SAP is the financial/procurement follow-on adapter. It deliberately has no
 * simulated OAuth token, budget, master data, or invoice-match result.
 */
export class SAPConnector {
  private config: { baseUrl: string; clientId: string; clientSecret: string; companyId: string };
  private token?: string;

  constructor(config: { baseUrl: string; clientId: string; clientSecret: string; companyId: string }) {
    this.config = config;
  }

  async authenticate(): Promise<string> {
    return connectionUnavailable("SAP", "authentication");
  }

  async getBudget(hotelId: string, departmentId: string, period: string) {
    void hotelId;
    void departmentId;
    void period;
    return connectionUnavailable("SAP", "budget retrieval");
  }

  async syncInventory(items: unknown[]) {
    void items;
    return connectionUnavailable("SAP", "inventory synchronization");
  }

  async createPurchaseOrder(po: unknown) {
    void po;
    return connectionUnavailable("SAP", "purchase-order creation");
  }

  async getVendorPriceBook(supplierId: string) {
    void supplierId;
    return connectionUnavailable("SAP", "vendor price-book retrieval");
  }

  async matchInvoice(poId: string, receivingId: string, invoiceId: string) {
    void poId;
    void receivingId;
    void invoiceId;
    return connectionUnavailable("SAP", "invoice matching");
  }

  async getMasterData() {
    return connectionUnavailable("SAP", "master-data retrieval");
  }
}
