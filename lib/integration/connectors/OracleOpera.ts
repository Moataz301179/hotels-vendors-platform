export class OperaConnector {
  private config: { ohipUrl: string; apiKey: string; propertyId: string };

  constructor(config: { ohipUrl: string; apiKey: string; propertyId: string }) {
    this.config = config;
  }

  async getOccupancy(propertyId: string, date: string) {
    return {
      propertyId,
      date,
      totalRooms: 320,
      occupiedRooms: Math.floor(Math.random() * 100) + 220,
      occupancyRate: Math.round((Math.random() * 30 + 70) * 10) / 10,
    };
  }

  async getMinibarConsumption(propertyId: string, date: string) {
    return {
      propertyId,
      date,
      items: [
        { productId: 'p7', quantity: Math.floor(Math.random() * 50) + 20, revenue: 0 },
        { productId: 'p13', quantity: Math.floor(Math.random() * 30) + 10, revenue: 0 },
      ],
    };
  }

  async getDepartmentDemand(propertyId: string, departmentId: string) {
    return {
      propertyId,
      departmentId,
      period: '2026-09',
      items: [
        { productId: 'p8', estimatedQuantity: Math.floor(Math.random() * 100) + 50 },
        { productId: 'p9', estimatedQuantity: Math.floor(Math.random() * 50) + 25 },
      ],
    };
  }

  async createPurchaseRequisition(pr: unknown) {
    return { prId: `PR-${Date.now()}`, status: 'created' };
  }

  async postReceivingConfirmation(receivingId: string) {
    return { receivingId, status: 'confirmed' };
  }

  async getPropertyInventory(propertyId: string) {
    return {
      propertyId,
      items: [
        { productId: 'p1', currentStock: 120 },
        { productId: 'p8', currentStock: 45 },
      ],
    };
  }
}
