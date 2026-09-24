import { z } from "zod";
import {
  HotelTier,
  HotelStatus,
  UserRole,
  UserStatus,
  SupplierStatus,
  SupplierTier,
  ProductCategory,
  ProductStatus,
  OrderStatus,
  ApprovalAction,
  EtaStatus,
  InvoiceStatus,
  PaymentStatus,
  FactoringStatus,
  AuthorityAction,
  AuditStatus,
  FactoringCompanyStatus,
  CreditFacilityStatus,
  OutletType,
  TripStatus,
} from "@prisma/client";

export const HotelCreateSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  taxId: z.string().min(3),
  commercialReg: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  governorate: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  starRating: z.number().int().min(1).max(7).optional(),
  roomCount: z.number().int().optional(),
  tier: z.nativeEnum(HotelTier).default("CORE" as any),
  creditLimit: z.number().optional(),
});

export const HotelUpdateSchema = HotelCreateSchema.partial();

export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default("DEPARTMENT_HEAD" as any),
  roleId: z.string().cuid(),
  hotelId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional(),
  canOverride: z.boolean().default(false),
});

export const UserUpdateSchema = UserCreateSchema.partial();

export const SupplierCreateSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  taxId: z.string().min(3),
  commercialReg: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  governorate: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  certifications: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial();

export const ProductCreateSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  subcategory: z.string().optional(),
  unitPrice: z.number().positive(),
  currency: z.string().default("EGP"),
  stockQuantity: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
  leadTimeDays: z.number().int().min(1).default(1),
  unitOfMeasure: z.string().default("piece"),
  supplierId: z.string().cuid(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const OrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  notes: z.string().optional(),
});

export const OrderCreateSchema = z.object({
  orderNumber: z.string().min(1),
  hotelId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  outletId: z.string().cuid().optional(),
  supplierId: z.string().cuid(),
  requesterId: z.string().cuid().optional(),
  items: z.array(OrderItemSchema).min(1),
  deliveryDate: z.string().datetime().optional(),
  deliveryInstructions: z.string().optional(),
});

export const GrnLineItemSchema = z.object({
  orderItemId: z.string().cuid(),
  productId: z.string().cuid(),
  orderedQuantity: z.number().int().min(0),
  receivedQuantity: z.number().int().min(0),
  acceptedQuantity: z.number().int().min(0),
  rejectedQuantity: z.number().int().min(0).default(0),
  rejectionReason: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  conditionNotes: z.string().optional(),
});

export const GrnCreateSchema = z.object({
  orderId: z.string().cuid(),
  hotelId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional(),
  warehouseLocation: z.string().optional(),
  deliveryNoteRef: z.string().optional(),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(GrnLineItemSchema).min(1),
});

export const InvoiceCreateSchema = z.object({
  invoiceNumber: z.string().min(1),
  orderId: z.string().cuid(),
  hotelId: z.string().cuid(),
  supplierId: z.string().cuid(),
  subtotal: z.number().positive(),
  vatRate: z.number().default(14),
  vatAmount: z.number().positive(),
  total: z.number().positive(),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
});

export const AuthorityRuleSchema = z.object({
  role: z.nativeEnum(UserRole),
  minValue: z.number().min(0),
  maxValue: z.number().min(0),
  category: z.string(),
  supplierTier: z.string(),
  action: z.nativeEnum(AuthorityAction),
  routeToRole: z.nativeEnum(UserRole).optional(),
  hotelId: z.string().cuid().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().int().default(0),
});

export const CartItemCreateSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const CartCheckoutSchema = z.object({
  supplierId: z.string().cuid(),
  deliveryDate: z.string().datetime().optional(),
  deliveryInstructions: z.string().optional(),
  outletId: z.string().cuid().optional(),
});

export const EtaSubmissionSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const FactoringCompanySchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  taxId: z.string().min(3),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  maxFacility: z.number().optional(),
  interestRate: z.number().optional(),
  rate: z.number().optional(),
  status: z.nativeEnum(FactoringCompanyStatus).default("ACTIVE" as any),
});

export const CreditFacilityCreateSchema = z.object({
  hotelId: z.string().cuid(),
  factoringCompanyId: z.string().cuid(),
  limit: z.number().positive(),
  interestRate: z.number().min(0),
});

export const CreditFacilityUpdateSchema = z.object({
  status: z.nativeEnum(CreditFacilityStatus).optional(),
  limit: z.number().positive().optional(),
  utilized: z.number().min(0).optional(),
});

export const OutletCreateSchema = z.object({
  propertyId: z.string().cuid(),
  name: z.string().min(2),
  type: z.nativeEnum(OutletType).default("KITCHEN" as any),
  managerName: z.string().optional(),
  managerPhone: z.string().optional(),
  operatingHours: z.string().optional(),
});

export const OutletUpdateSchema = OutletCreateSchema.partial().omit({ propertyId: true });

export const TripCreateSchema = z.object({
  hubId: z.string().cuid(),
  driverName: z.string().min(1),
  driverPhone: z.string().min(1),
  vehiclePlate: z.string().min(1),
  scheduledDate: z.string().datetime(),
});

export const TripUpdateSchema = z.object({
  status: z.nativeEnum(TripStatus).optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
});

export const TripStopCreateSchema = z.object({
  orderId: z.string().cuid().optional(),
  stopNumber: z.number().int().min(1),
  eta: z.string().datetime().optional(),
});

export const SupplierAuditCreateSchema = z.object({
  auditorName: z.string().min(1),
  auditDate: z.string().datetime(),
  score: z.number().int().min(0).max(100).optional(),
  status: z.nativeEnum(AuditStatus).default("PENDING" as any),
  coldChainCompliant: z.boolean().optional(),
  haccpCertified: z.boolean().optional(),
  onSiteVisited: z.boolean().optional(),
  labTested: z.boolean().optional(),
  notes: z.string().optional(),
});

export const SupplierAuditUpdateSchema = SupplierAuditCreateSchema.partial();

const passwordStrength = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/);

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordStrength,
  hotelId: z.string().cuid().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const BusinessRegisterSchema = z.object({
  type: z.enum(["hotel", "supplier", "factoring", "shipping"]),
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordStrength,
  phone: z.string().optional(),
  city: z.string().optional(),
  governorate: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  commercialReg: z.string().optional(),
  crDocumentUrl: z.string().optional(),
  taxDocumentUrl: z.string().optional(),
  accountType: z.enum(["individual", "business"]).default("business"),
  marketingConsent: z.boolean().default(false),
  termsAccepted: z.literal(true),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SendOtpSchema = z.object({
  phone: z.string().min(1),
  purpose: z.enum(["LOGIN", "REGISTER", "PASSWORD_RESET", "MFA"]).default("LOGIN"),
});

export const OtpLoginSchema = SendOtpSchema.extend({
  code: z.string().min(4),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(1),
  code: z.string().min(4),
  purpose: z.enum(["LOGIN", "REGISTER", "PASSWORD_RESET", "MFA"]).default("LOGIN"),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const SavingsType = z.enum(["NEGOTIATED", "REALIZED", "VERIFIED"]);

export const SavingsStatus = z.enum([
  "POTENTIAL",
  "EXPECTED",
  "NEGOTIATED",
  "REALIZED",
  "VERIFIED",
  "DISPUTED",
  "REVERSED",
]);

export const SavingsCreateSchema = z.object({
  opportunityId: z.string().cuid().optional(),
  type: SavingsType,
  baseline: z.number().optional(),
  potentialSaving: z.number().optional(),
  expectedSaving: z.number().optional(),
  supplierId: z.string().cuid().optional(),
  category: z.string().optional(),
  productId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export const SavingsListSchema = PaginationSchema.extend({
  status: SavingsStatus.optional(),
  type: SavingsType.optional(),
  supplierId: z.string().cuid().optional(),
  category: z.string().optional(),
  productId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
});

export const SavingsUpdateSchema = z.object({
  status: SavingsStatus.optional(),
  type: SavingsType.optional(),
  baseline: z.number().optional(),
  potentialSaving: z.number().optional(),
  expectedSaving: z.number().optional(),
  negotiatedAmount: z.number().optional(),
  realizedAmount: z.number().optional(),
  verifiedAmount: z.number().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  transactionId: z.string().optional(),
  supplierId: z.string().cuid().optional(),
  category: z.string().optional(),
  productId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  verifiedById: z.string().cuid().optional(),
  disputeReason: z.string().optional(),
});

export const SavingsVerifySchema = z.object({
  action: z.enum(["flag", "check", "verify"]).default("verify"),
  reason: z.string().optional(),
});

export const SavingsDisputeSchema = z.object({
  reason: z.string().min(1),
});

export const OpportunityCreateSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  baseline: z.number().optional(),
  currentValue: z.number().optional(),
  potentialImpact: z.number().optional(),
  confidence: z.number().optional(),
  recommendedAction: z.string().optional(),
  affectedSupplierId: z.string().cuid().optional(),
  affectedProductId: z.string().cuid().optional(),
  affectedCategory: z.string().optional(),
  ownerId: z.string().cuid().optional(),
});

export const OpportunityUpdateSchema = OpportunityCreateSchema.partial();

export const OpportunityConvertSchema = z.object({
  convertTo: z.enum(["RFQ", "ORDER", "NEGOTIATION"]),
  supplierId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  quantity: z.number().int().positive().optional(),
  targetPrice: z.number().positive().optional(),
  notes: z.string().optional(),
  type: z.enum(["NEGOTIATED", "REALIZED", "VERIFIED"]).optional(),
  baseline: z.number().optional(),
  potentialSaving: z.number().optional(),
  expectedSaving: z.number().optional(),
  category: z.string().optional(),
  ownerId: z.string().cuid().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  targetStatus: z.string().optional(),
});

