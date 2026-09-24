import React from "react";

// Client-safe stub exports (no async/server-only code)
export const WebhookLogo = (props?: any) => null;
export const VENDOR_SCORECARDS: Array<{vendorId: string; supplierId: string; score: number; overallScore: number; taxStatus: string; contractStatus: string; onTimeRate: number; qualityRate: number; responseTime: number; fulfillmentRate: number}> = [{ vendorId: 'v1', supplierId: 's1', score: 95, overallScore: 92, taxStatus: 'verified', contractStatus: 'active', onTimeRate: 95, qualityRate: 98, responseTime: 4, fulfillmentRate: 99 }];
export const SapLogo = (props?: any) => null;
export const RFQS: Array<{id: string; title: string; titleAr: string; status: string; categoryId: string; issueDate: Date; closingDate: Date; bids: any[]}> = [{ id: 'r1', title: 'Sample RFQ', titleAr: 'نموذج طلب سعر', status: 'open', categoryId: 'c1', issueDate: new Date(), closingDate: new Date(), bids: [] }];
export const OracleOperaLogo = (props?: any) => null;
export const MicrosoftDynamicsLogo = (props?: any) => null;
export const INVENTORY: Array<{id: string; name: string; quantity: number; status: string; autoReorder: boolean; currentStock: number; minThreshold: number; maxThreshold: number; reorderPoint: number; productId: string; sku: string}> = [{ id: "i1", name: "Sample", quantity: 10, status: "in_stock", autoReorder: true, currentStock: 10, minThreshold: 5, maxThreshold: 100, reorderPoint: 10, productId: "p1", sku: "SKU-001" }];
export const PRODUCTS: any[] = [];
export const INTEGRATIONS = [{ id: "test", type: "erp", status: "connected", description: "", lastSync: "", brand: "SAP", name: "SAP" }];
export const HeroFilmNarrative = (props?: any) => null;
export const DISPUTES = [{ id: 'd1', orderId: 'o1', reason: 'late', status: 'open' }];
export const CsvPortalLogo = (props?: any) => null;
export const CoupaLogo = (props?: any) => null;
export const CONTRACTS = [{ id: 'c1', supplier: 'Test', value: 1000, status: 'active' }];
export const evaluateAuthorityMatrix = (...args: any[]) => ({ allowed: true, reason: "" });

// All UI components accept any props including children, className, etc.
const C = (props?: any) => props?.children ?? null;
export const Btn = C;
export const Card = C;
export const Field = C;
export const PageHead = C;
export const TextInput = C;
export const IcScale = C;
export const AppShell = C;
export const Guard = C;
export const RequireAuth = C;
export const fmtMoney = (v: any, _lang?: any) => String(v ?? 0);
export const fmtDateTime = (v: any) => String(v ?? "");
export const fmtDate = (v: any, _lang?: any) => String(v ?? "");
export const EmptyState = C;
export const Pager = C;
export const StatePill = C;
export const Stat = C;
export const T = C;
export const Td = C;
export const Th = C;
export const btnCls = (...args: any[]) => "";
export const IcAlert = C;
export const IcArrow = C;
export const IcBox = C;
export const IcBuilding = C;
export const IcCard = C;
export const IcCheck = C;
export const IcDoc = C;
export const IcHand = C;
export const IcHistory = C;
export const IcInvoice = C;
export const IcLock = C;
export const IcPen = C;
export const IcPlus = C;
export const IcReceipt = C;
export const IcSearch = C;
export const IcShield = C;
export const IcStamp = C;
export const IcThermo = C;
export const IcTruck = C;
export const IcUsers = C;
export const IcWarehouse = C;
export const IcX = C;
export const Img = C;
export const Logo = C;
export const Modal = C;
export const Select = C;
export const Toggle = C;
export const TextArea = C;
export const useApp = () => ({ data: { stats: { totalOrders: 0, revenue: 0, pendingInvoices: 0, activeHotels: 0, supplierRating: 0 }, audit: [], orders: [], suppliers: [], hotels: [], partners: [], invoices: [], deliveries: [], inventory: [], contracts: [], disputes: [], integrations: [], rules: [], tenants: [], products: [], catalog: [], categories: [], rfqs: [], financing: [], vendors: [], logistics: [], shipments: [], payments: [], receipts: [], approvals: [], requests: [], applications: [], notifications: [], settings: {}, reports: [], analytics: {}, marketing: [] } });
export const HOTELS: any[] = [];
export const SUPPLIERS: any[] = [];
export const PARTNERS: any[] = [];
export const CARRIERS: any[] = [];
export const CATEGORIES: Array<{id: string; name: string; nameAr: string; img?: string}> = [];
export const USERS: any[] = [];
export const HERO_IMG = "";
export const WAREHOUSE_IMG = () => null;
export const PublicHeader = () => null;
export const getCRMDashboardStats = () => ({ totalLeads: 0, conversionRate: 0, avgDealSize: 0 });
export const hotelById = (id?: string) => ({ id: id ?? "", name: "" });
export const supplierById = (id?: string) => ({ id: id ?? "", name: "", city: "" });
export const partnerById = (id?: string) => ({ id: id ?? "", name: "" });
export const carrierById = (id?: string) => ({ id: id ?? "", name: "" });
export const productById = (id?: string) => ({ id: id ?? "", name: "", sku: "" });
export const categoryById = (id?: string) => ({ id: id ?? "", name: "" });
export const integrationEngine = {
  checkBudget: (...args: any) => null,
  listProviders: () => [],
  registerProvider: (...args: any) => ({}),
  getProvider: (...args: any) => null,
  updateProvider: (...args: any) => ({}),
  deleteProvider: (...args: any) => ({}),
  syncInbound: (...args: any) => null,
  syncOutbound: (...args: any) => null,
  getSyncJobs: () => [],
  matchThreeWay: (...args: any) => null,
  triggerWebhook: (...args: any) => null,
  getWebhookQueue: () => []
};
export const relDay = (_date?: any, _lang?: any) => 0;
export type Role = string;
export type Product = any;
export default AppShell;

export const HeroFilm = ({ children }: { children?: any }) => children || null;

