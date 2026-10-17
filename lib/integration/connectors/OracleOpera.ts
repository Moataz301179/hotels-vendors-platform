import { connectionUnavailable } from "../connection-contract";

/**
 * OPERA Cloud is the first hospitality-system adapter. Until the organization
 * supplies an approved OHIP connection and its health check succeeds, every
 * operation fails closed rather than returning invented hotel activity.
 */
export class OperaConnector {
  private config: { ohipUrl: string; apiKey: string; propertyId: string };

  constructor(config: { ohipUrl: string; apiKey: string; propertyId: string }) {
    this.config = config;
  }

  async getOccupancy(propertyId: string, date: string) {
    void propertyId;
    void date;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "occupancy retrieval");
  }

  async getMinibarConsumption(propertyId: string, date: string) {
    void propertyId;
    void date;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "minibar consumption retrieval");
  }

  async getDepartmentDemand(propertyId: string, departmentId: string) {
    void propertyId;
    void departmentId;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "department demand retrieval");
  }

  async createPurchaseRequisition(pr: unknown) {
    void pr;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "purchase requisition creation");
  }

  async postReceivingConfirmation(receivingId: string) {
    void receivingId;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "receiving confirmation");
  }

  async getPropertyInventory(propertyId: string) {
    void propertyId;
    return connectionUnavailable("ORACLE_OPERA_CLOUD", "property inventory retrieval");
  }
}
