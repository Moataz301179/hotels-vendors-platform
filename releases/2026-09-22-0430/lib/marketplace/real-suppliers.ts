import marketData from "@/data/egyptian-market-v2.json";

export interface RealSupplier {
  id: string;
  name: string;
  city: string;
  governorate: string;
  category: string;
  industrialZone: string;
  taxId: string;
  monthlyCapacityEgp: number;
}

export interface RealProduct {
  sku: string;
  name: string;
  category: string;
  unit: string;
  basePriceEgp: number;
  supplierId: string;
}

export interface RealHotel {
  id: string;
  name: string;
  city: string;
  governorate: string;
  tier: string;
  rooms: number;
  chain: string;
  monthlyGmvEgp: number;
}

const suppliers: RealSupplier[] = (marketData as any).suppliers.map((s: any) => ({
  id: s.id,
  name: s.name,
  city: s.city,
  governorate: s.governorate,
  category: s.category,
  industrialZone: s.industrial_zone,
  taxId: s.tax_id,
  monthlyCapacityEgp: s.monthly_capacity_egp,
}));

const products: RealProduct[] = (marketData as any).product_catalog.map((p: any) => ({
  sku: p.sku,
  name: p.name,
  category: p.category,
  unit: p.unit,
  basePriceEgp: p.base_price_egp,
  supplierId: p.supplier_id,
}));

const hotels: RealHotel[] = (marketData as any).hotels.map((h: any) => ({
  id: h.id,
  name: h.name,
  city: h.city,
  governorate: h.governorate,
  tier: h.tier,
  rooms: h.rooms,
  chain: h.chain,
  monthlyGmvEgp: h.monthly_gmv_egp,
}));

const supplierById = new Map(suppliers.map((s) => [s.id, s]));
const supplierByCategory = new Map<string, RealSupplier[]>();
for (const s of suppliers) {
  const list = supplierByCategory.get(s.category) || [];
  list.push(s);
  supplierByCategory.set(s.category, list);
}

export function getAllSuppliers(): RealSupplier[] {
  return suppliers;
}

export function getAllHotels(): RealHotel[] {
  return hotels;
}

export function getSupplierById(id: string): RealSupplier | undefined {
  return supplierById.get(id);
}

export function getSuppliersByCategory(category: string): RealSupplier[] {
  return supplierByCategory.get(category) || [];
}

export function getAllProducts(): RealProduct[] {
  return products;
}

export function getProductsBySupplier(supplierId: string): RealProduct[] {
  return products.filter((p) => p.supplierId === supplierId);
}

export function getFeaturedSuppliers(limit = 12): RealSupplier[] {
  const premier = [
    "s17", // Juhayna
    "s18", // Beyti
    "s19", // Edita
    "s14", // Oriental Weavers
    "s13", // Cleopatra Ceramics
    "s04", // Cairo Poultry
    "s05", // Obour Land
    "s11", // Arab Dairy
    "s07", // National Fisheries
    "s08", // Egyptian Linen
    "s23", // Alexandria Vegetable Oil
    "s57", // Cairo Hospitality Equipment
  ];
  return premier
    .map((id) => supplierById.get(id))
    .filter((s): s is RealSupplier => !!s)
    .slice(0, limit);
}

export function getTopHotelsByGmv(limit = 12): RealHotel[] {
  return [...hotels]
    .sort((a, b) => b.monthlyGmvEgp - a.monthlyGmvEgp)
    .slice(0, limit);
}

const CATEGORY_LABELS: Record<string, string> = {
  poultry: "Poultry",
  dairy: "Dairy & Cheese",
  beverages: "Beverages",
  seafood: "Seafood",
  meat: "Meat",
  fresh_produce: "Fresh Produce",
  oils: "Oils & Fats",
  spices: "Spices & Herbs",
  linens: "Linens & Textiles",
  paper_products: "Paper Products",
  hospitality_equipment: "Hospitality Equipment",
  ceramics: "Ceramics & Tableware",
  glassware: "Glassware",
  furniture: "Furniture",
  carpets: "Carpets & Rugs",
  amenities: "Guest Amenities",
  handicrafts: "Handicrafts",
  dates: "Dates & Nuts",
  bakery: "Bakery",
  canned_goods: "Canned Goods",
  cleaning: "Cleaning Products",
  uniforms: "Uniforms",
  packaging: "Packaging",
  pharmaceuticals: "Pharmaceuticals",
  confectionery: "Confectionery",
  cold_storage: "Cold Storage",
  logistics: "Logistics",
  building_materials: "Building Materials",
  electronics: "Electronics",
  chemicals: "Chemicals",
  energy: "Energy",
  sugar: "Sugar",
  grains: "Grains",
  textiles: "Textiles",
  plastics: "Plastics",
  metals: "Metals",
  processed_food: "Processed Food",
  organic_produce: "Organic Produce",
  water: "Water",
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getSupplierCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    poultry: "#e57373",
    dairy: "#64b5f6",
    beverages: "#ffb74d",
    seafood: "#4dd0e1",
    meat: "#ba68c8",
    fresh_produce: "#81c784",
    oils: "#fff176",
    spices: "#ff8a65",
    linens: "#90a4ae",
    hospitality_equipment: "#a1887f",
    ceramics: "#ce93d8",
    glassware: "#80cbc4",
    furniture: "#bcaaa4",
    carpets: "#f48fb1",
    amenities: "#b39ddb",
    cleaning: "#e6ee9c",
    uniforms: "#c5e1a5",
    logistics: "#ffcc80",
    electronics: "#90caf9",
  };
  return colors[category] || "#8B0000";
}
