/* Shared domain types for the HotelsVendors frontend.
 * These mirror the shape of the HotelsVendors platform contract. Where the
 * authoritative backend is not reachable in this environment, the local data
 * service (src/lib/store.tsx) serves the verified pilot dataset with these
 * exact shapes so integration boundaries stay stable.
 */

export type Role =
  | "hotel_admin"
  | "gm"
  | "finance_director"
  | "supplier_manager"
  | "partner_officer"
  | "carrier"
  | "platform_admin";

export type CategoryId = "fbn" | "housekeeping" | "amenities" | "engineering";

export interface Category {
  id: CategoryId;
  name: string;
  nameAr: string;
  blurb: string;
  blurbAr: string;
  img: string;
}

export interface Supplier {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  since: number;
  categories: CategoryId[];
  phone: string;
  email: string;
  coverage: string;
  coverageAr: string;
  leadDays: [number, number];
}

export interface Hotel {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  rooms: number;
  since: number;
}

export interface Partner {
  id: string;
  name: string;
  nameAr: string;
  license: string;
  licenseAr: string;
}

export interface Carrier {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  fleet: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameAr: string;
  categoryId: CategoryId;
  supplierId: string;
  unit: string;
  unitAr: string;
  price: number; // EGP per unit
  moq: number;
  leadDays: number;
  stock: "in" | "low" | "out";
  img: string;
  alt: string;
  desc: string;
  descAr: string;
  specs: { k: string; kAr: string; v: string }[];
}

export interface User {
  id: string;
  name: string;
  nameAr: string;
  orgId: string;
  orgType: "hotel" | "supplier" | "partner" | "carrier" | "platform";
  role: Role;
  title: string;
  titleAr: string;
  lastActive: string;
}

export interface Tenant {
  id: string;
  name: string;
  nameAr: string;
  kind: "hotel" | "supplier" | "partner" | "carrier";
  city: string;
  status: "active" | "suspended";
  since: number;
  users: number;
}

export interface AuthorityRule {
  id: string;
  name: string;
  nameAr: string;
  min: number;
  max: number | null; // null = no upper bound
  approvers: Role[];
  slaHours: number;
}

export interface OrderLine {
  productId: string;
  qty: number;
  price: number;
  received?: number;
  condition?: string;
  note?: string;
}

export type ApprovalState = "pending" | "approved" | "auto" | "rejected";
export type FulfillmentState =
  | "none"
  | "acknowledged"
  | "preparing"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";
export type ReceiptState = "none" | "partial" | "complete";

export interface Order {
  id: string;
  po: string;
  hotelId: string;
  supplierId: string;
  lines: OrderLine[];
  createdAt: string;
  note?: string;
  subtotal: number;
  vat: number;
  total: number;
  ruleId?: string;
  approval: {
    state: ApprovalState;
    required: Role[];
    decidedBy?: string;
    decidedAt?: string;
    note?: string;
  };
  fulfillment: FulfillmentState;
  eta?: string;
  receipt: ReceiptState;
}

export type DeliveryStatus =
  | "scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export interface Delivery {
  id: string;
  orderId: string;
  carrierId: string;
  vehicle: string;
  driver: string;
  driverAr: string;
  origin: string;
  originAr: string;
  destination: string;
  destinationAr: string;
  eta: string;
  window: string;
  status: DeliveryStatus;
  delayed: boolean;
  temp: boolean;
  docs: boolean;
  exceptions: { at: string; note: string }[];
}

export type InvoiceStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

export interface Invoice {
  id: string;
  number: string;
  orderId: string;
  supplierId: string;
  hotelId: string;
  lines: { desc: string; descAr: string; qty: number; price: number }[];
  subtotal: number;
  vat: number;
  total: number;
  dueDate: string;
  submittedAt?: string;
  status: InvoiceStatus;
  note?: string;
}

export type FinStatus = "submitted" | "under_review" | "funded" | "declined";

export interface ScheduleRow {
  month: number;
  due: string;
  amount: number;
  status: "paid" | "due" | "upcoming";
}

export interface FinancingApp {
  id: string;
  number: string;
  hotelId: string;
  orderId: string;
  amount: number;
  tenor: number; // months
  purpose: string;
  status: FinStatus;
  createdAt: string;
  decidedAt?: string;
  schedule?: ScheduleRow[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  actionAr: string;
  entity: string;
  detail: string;
  detailAr: string;
}
