/**
 * Shared in-memory shipment store for the carrier API demo.
 * Replace with the Prisma Shipment model in production.
 */

import { ShipmentTracker } from "./tracking";

export interface ShipmentMeta {
  id: string; orderNumber: string; providerId: string; providerName: string;
  destinationCity: string; service: "EXPRESS" | "REGULAR";
  discountedTotal: number; standardTotal: number; savingsPercent: number;
  buyerId: string; supplierId: string; waybillQr: string;
  parcels: number; weightKg: number;
}

export const shipmentStore = new Map<string, ShipmentTracker>();
export const metaStore = new Map<string, ShipmentMeta>();
