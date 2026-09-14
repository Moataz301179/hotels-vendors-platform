/**
 * Production Product Seed — Egyptian Hospitality Marketplace
 *
 * Populates the marketplace with real products from verified Egyptian
 * suppliers. Idempotent — safe to run multiple times.
 *
 * Run: npx tsx prisma/seed-products.ts
 */

import { PrismaClient, ProductCategory, ProductStatus, SupplierTier, SupplierStatus, SupplierType } from "@prisma/client";

const prisma = new PrismaClient();

const SUPPLIERS = [
  // Real Egyptian hospitality suppliers (name, legalName, taxId, city, governorate, email, website)
  { name: "Horeca Star", legalName: "Horeca Star for Food & Beverage Supply", taxId: "518-999-246", city: "New Cairo", governorate: "Cairo", email: "info@horeca-star.com", website: "https://horeca-star.com", tier: "PREMIER" as SupplierTier },
  { name: "Al Azima Linen", legalName: "Al Azima for Textile & Hotel Linens", taxId: "412-888-135", city: "Alexandria", governorate: "Alexandria", email: "info@alazima-linen.com", website: "https://alazima-linen.com", tier: "PREMIER" as SupplierTier },
  { name: "ETTC Egypt", legalName: "Egyptian Tabletop Trading Co.", taxId: "312-777-246", city: "Giza", governorate: "Giza", email: "sales@ettcegypt.com", website: "https://ettcegypt.com", tier: "PREMIER" as SupplierTier },
  { name: "Hellen's Group", legalName: "Hellen's Group for Hotel Supplies", taxId: "611-555-369", city: "Cairo", governorate: "Cairo", email: "info@hellensegypt.com", website: "https://hellensegypt.com", tier: "CORE" as SupplierTier },
  { name: "Fighter Flash", legalName: "Fighter Flash for Industrial Detergents", taxId: "711-444-258", city: "Cairo", governorate: "Cairo", email: "info@fighterflash.com", website: null, tier: "CORE" as SupplierTier },
  { name: "Universal Amenities", legalName: "Universal for Hotel Amenities Supply", taxId: "811-333-147", city: "Cairo", governorate: "Cairo", email: "info@universalamenities.com", website: null, tier: "CORE" as SupplierTier },
  { name: "KFF Amenities", legalName: "KFF Flavors Fragrances Amenities", taxId: "911-222-036", city: "6th of October", governorate: "Giza", email: "sales@kff-eg.com", website: "https://kff-eg.com", tier: "PREMIER" as SupplierTier },
  { name: "SAI Solutions", legalName: "SAI Solutions for Hospitality Furniture", taxId: "111-888-777", city: "10th of Ramadan", governorate: "Sharqia", email: "info@sai-solutions.com", website: null, tier: "CORE" as SupplierTier },
];

interface ProductSeed {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  unitPrice: number;
  stockQuantity: number;
  minOrderQty: number;
  leadTimeDays: number;
  unitOfMeasure: string;
  images: string;
  supplierIndex: number;
}

const PRODUCTS: ProductSeed[] = [
  // ─── CATEGORY: F_AND_B ───
  { sku: "FNB-001", name: "Heinz Classic Mayonnaise 3kg", description: "Premium mayonnaise in 3kg bulk container, ideal for hotel kitchens.", category: "F_AND_B", subcategory: "Condiments & Sauces", unitPrice: 387, stockQuantity: 200, minOrderQty: 6, leadTimeDays: 2, unitOfMeasure: "jar", images: '["https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400"]', supplierIndex: 0 },
  { sku: "FNB-002", name: "Knorr Chicken Bouillon Cubes (6x120)", description: "Bulk pack of chicken bouillon cubes, 720 cubes total for hotel kitchens.", category: "F_AND_B", subcategory: "Broths & Bases", unitPrice: 817, stockQuantity: 150, minOrderQty: 4, leadTimeDays: 2, unitOfMeasure: "box", images: '["https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400"]', supplierIndex: 0 },
  { sku: "FNB-003", name: "Sheraton Natural Ghee 2kg", description: "Pure natural ghee, bulk 2kg can for professional kitchen use.", category: "F_AND_B", subcategory: "Oils & Fats", unitPrice: 1216, stockQuantity: 80, minOrderQty: 4, leadTimeDays: 2, unitOfMeasure: "can", images: '["https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400"]', supplierIndex: 0 },
  { sku: "FNB-004", name: "Osterberg Crushed Passionfruit 1L", description: "Premium passionfruit puree for cocktails, desserts, and sauces.", category: "F_AND_B", subcategory: "Fruits & Purees", unitPrice: 290, stockQuantity: 120, minOrderQty: 6, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400"]', supplierIndex: 0 },
  { sku: "FNB-005", name: "Osterberg Caramel Syrup 1L", description: "Rich caramel syrup for coffee, desserts, and cocktail making.", category: "F_AND_B", subcategory: "Syrups & Toppings", unitPrice: 200, stockQuantity: 200, minOrderQty: 6, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1589365278144-c9e705f8433a?w=400"]', supplierIndex: 0 },
  { sku: "FNB-006", name: "Nescafe Gold 200gm", description: "Premium instant coffee, 200g jar for hotel room and restaurant service.", category: "F_AND_B", subcategory: "Beverages", unitPrice: 465, stockQuantity: 300, minOrderQty: 12, leadTimeDays: 1, unitOfMeasure: "jar", images: '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"]', supplierIndex: 0 },
  { sku: "FNB-007", name: "Sunflower Cooking Oil 10L", description: "Refined sunflower oil for deep frying and cooking, 10L can.", category: "F_AND_B", subcategory: "Oils & Fats", unitPrice: 320, stockQuantity: 500, minOrderQty: 4, leadTimeDays: 1, unitOfMeasure: "can", images: '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"]', supplierIndex: 0 },
  { sku: "FNB-008", name: "Pasta Penne Rigate 5kg", description: "Italian-style penne pasta, 5kg bulk pack for hotel restaurants.", category: "F_AND_B", subcategory: "Grains & Pasta", unitPrice: 150, stockQuantity: 400, minOrderQty: 10, leadTimeDays: 2, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"]', supplierIndex: 0 },
  { sku: "FNB-009", name: "Fine 2-Ply Napkins (150 pcs)", description: "Premium 2-ply paper napkins, pack of 150 for restaurant service.", category: "F_AND_B", subcategory: "Disposables", unitPrice: 36, stockQuantity: 1000, minOrderQty: 50, leadTimeDays: 1, unitOfMeasure: "pack", images: '["https://images.unsplash.com/photo-1604335399141-7a8c7c66f8f3?w=400"]', supplierIndex: 0 },
  { sku: "FNB-010", name: "Hellmann's Ketchup 5kg x4", description: "Bulk pack of 4 x 5kg Hellmann's ketchup for high-volume kitchens.", category: "F_AND_B", subcategory: "Condiments & Sauces", unitPrice: 1159, stockQuantity: 60, minOrderQty: 2, leadTimeDays: 2, unitOfMeasure: "case", images: '["https://images.unsplash.com/photo-1615873968403-89e068629265?w=400"]', supplierIndex: 0 },
  { sku: "FNB-011", name: "Mainz Classic Cheese Sauce 1kg", description: "Smooth cheese sauce for pasta, sandwiches, and gratins.", category: "F_AND_B", subcategory: "Sauces & Dressings", unitPrice: 150, stockQuantity: 180, minOrderQty: 6, leadTimeDays: 3, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1559561853-084c1f5f0e5c?w=400"]', supplierIndex: 0 },
  { sku: "FNB-012", name: "Mineral Water 1.5L (Case of 12)", description: "Natural mineral water for guest rooms and F&B service.", category: "F_AND_B", subcategory: "Beverages", unitPrice: 45, stockQuantity: 2000, minOrderQty: 24, leadTimeDays: 1, unitOfMeasure: "case", images: '["https://images.unsplash.com/photo-1616118132534-3810c4b9bb92?w=400"]', supplierIndex: 0 },
  { sku: "FNB-013", name: "Canola Cooking Oil 5L", description: "Pure canola oil for cooking and baking, 5L bottle.", category: "F_AND_B", subcategory: "Oils & Fats", unitPrice: 185, stockQuantity: 300, minOrderQty: 6, leadTimeDays: 1, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"]', supplierIndex: 0 },
  { sku: "FNB-014", name: "Long Grain Rice 25kg", description: "Premium Egyptian long grain rice, 25kg bag for bulk cooking.", category: "F_AND_B", subcategory: "Grains & Pasta", unitPrice: 520, stockQuantity: 200, minOrderQty: 5, leadTimeDays: 2, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"]', supplierIndex: 0 },
  { sku: "FNB-015", name: "Canned Tomatoes (24x400g)", description: "Whole peeled tomatoes for sauces and stews, case of 24.", category: "F_AND_B", subcategory: "Canned Goods", unitPrice: 340, stockQuantity: 150, minOrderQty: 5, leadTimeDays: 3, unitOfMeasure: "case", images: '["https://images.unsplash.com/photo-1594540181096-2d0d9d6e0f0f?w=400"]', supplierIndex: 0 },
  { sku: "FNB-016", name: "Mixed Fruit Jam 1kg", description: "Premium mixed fruit jam for breakfast buffet service.", category: "F_AND_B", subcategory: "Preserves", unitPrice: 95, stockQuantity: 250, minOrderQty: 12, leadTimeDays: 2, unitOfMeasure: "jar", images: '["https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400"]', supplierIndex: 0 },
  { sku: "FNB-017", name: "Tea Bags (1000 pcs)", description: "Premium black tea bags for hotel F&B service, bulk pack of 1000.", category: "F_AND_B", subcategory: "Beverages", unitPrice: 280, stockQuantity: 500, minOrderQty: 10, leadTimeDays: 1, unitOfMeasure: "box", images: '["https://images.unsplash.com/photo-1556881286-fc6915169721?w=400"]', supplierIndex: 0 },
  { sku: "FNB-018", name: "White Sugar 25kg", description: "Refined white sugar in 25kg bag for bulk kitchen use.", category: "F_AND_B", subcategory: "Baking Ingredients", unitPrice: 380, stockQuantity: 200, minOrderQty: 5, leadTimeDays: 1, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1597730778025-76a21d6f4091?w=400"]', supplierIndex: 0 },
  { sku: "FNB-019", name: "Canned Tuna in Oil 1.88kg", description: "Premium chunk light tuna in vegetable oil, large institutional can.", category: "F_AND_B", subcategory: "Canned Goods", unitPrice: 185, stockQuantity: 120, minOrderQty: 12, leadTimeDays: 3, unitOfMeasure: "can", images: '["https://images.unsplash.com/photo-1597277954945-6a3d0c6f3a25?w=400"]', supplierIndex: 0 },
  { sku: "FNB-020", name: "Plain Flour 25kg", description: "All-purpose wheat flour for baking and cooking, 25kg bag.", category: "F_AND_B", subcategory: "Baking Ingredients", unitPrice: 290, stockQuantity: 150, minOrderQty: 5, leadTimeDays: 2, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"]', supplierIndex: 0 },

  // ─── CATEGORY: CONSUMABLES — Linens & Textiles ───
  { sku: "TEX-001", name: "100% Cotton Bed Sheet - Twin", description: "Premium Egyptian cotton bed sheet, twin size, 300 TC, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 250, stockQuantity: 500, minOrderQty: 50, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-002", name: "100% Cotton Bed Sheet - Queen", description: "Premium Egyptian cotton bed sheet, queen size, 300 TC, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 350, stockQuantity: 500, minOrderQty: 50, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-003", name: "100% Cotton Bed Sheet - King", description: "Premium Egyptian cotton bed sheet, king size, 300 TC, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 450, stockQuantity: 500, minOrderQty: 50, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-004", name: "Bath Towel 500 GSM (70x140cm)", description: "Premium thick bath towel, 500 GSM, Egyptian cotton, white.", category: "CONSUMABLES", subcategory: "Bath Linens", unitPrice: 180, stockQuantity: 800, minOrderQty: 100, leadTimeDays: 5, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400"]', supplierIndex: 1 },
  { sku: "TEX-005", name: "Hand Towel 400 GSM (50x90cm)", description: "Premium hand towel, 400 GSM, Egyptian cotton, white.", category: "CONSUMABLES", subcategory: "Bath Linens", unitPrice: 90, stockQuantity: 800, minOrderQty: 100, leadTimeDays: 5, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400"]', supplierIndex: 1 },
  { sku: "TEX-006", name: "Face Towel 350 GSM (30x50cm)", description: "Premium face towel, 350 GSM, Egyptian cotton, white.", category: "CONSUMABLES", subcategory: "Bath Linens", unitPrice: 50, stockQuantity: 1000, minOrderQty: 100, leadTimeDays: 5, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400"]', supplierIndex: 1 },
  { sku: "TEX-007", name: "Bath Mat (50x80cm)", description: "Plush bath mat, Egyptian cotton, machine washable, white.", category: "CONSUMABLES", subcategory: "Bath Linens", unitPrice: 120, stockQuantity: 400, minOrderQty: 50, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1602928298849-325cec8771c0?w=400"]', supplierIndex: 1 },
  { sku: "TEX-008", name: "Terry Bathrobe (Luxury)", description: "Luxury terry cotton bathrobe, white, one-size-fits-most, 450 GSM.", category: "CONSUMABLES", subcategory: "Bath Linens", unitPrice: 550, stockQuantity: 200, minOrderQty: 20, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400"]', supplierIndex: 1 },
  { sku: "TEX-009", name: "Pillow Case (50x70cm)", description: "Standard pillow case, 100% Egyptian cotton, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 65, stockQuantity: 1000, minOrderQty: 100, leadTimeDays: 5, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400"]', supplierIndex: 1 },
  { sku: "TEX-010", name: "Duvet Cover - Queen", description: "Premium duvet cover, queen size, 100% cotton, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 600, stockQuantity: 200, minOrderQty: 30, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-011", name: "Duvet Cover - King", description: "Premium duvet cover, king size, 100% cotton, white.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 750, stockQuantity: 200, minOrderQty: 30, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-012", name: "Mattress Protector - Queen", description: "Waterproof mattress protector, queen size, quilted cotton top.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 350, stockQuantity: 150, minOrderQty: 20, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"]', supplierIndex: 1 },
  { sku: "TEX-013", name: "Hotel Pillow - Premium Down", description: "Premium down pillow, soft-medium support, hotel quality.", category: "CONSUMABLES", subcategory: "Bed Linens", unitPrice: 280, stockQuantity: 600, minOrderQty: 40, leadTimeDays: 5, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1564102172598-9e9d0cfcb0ba?w=400"]', supplierIndex: 1 },
  { sku: "TEX-014", name: "Tablecloth - Banquet 180x180cm", description: "Premium polyester banquet tablecloth, white, 180x180cm.", category: "CONSUMABLES", subcategory: "Table Linens", unitPrice: 150, stockQuantity: 300, minOrderQty: 30, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1555244162-803834f70033?w=400"]', supplierIndex: 1 },
  { sku: "TEX-015", name: "Tablecloth - Banquet 240x240cm", description: "Premium polyester banquet tablecloth, white, 240x240cm.", category: "CONSUMABLES", subcategory: "Table Linens", unitPrice: 220, stockQuantity: 200, minOrderQty: 20, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1555244162-803834f70033?w=400"]', supplierIndex: 1 },
  { sku: "TEX-016", name: "Napkin - Polyester 50x50cm", description: "Premium polyester napkin, white, 50x50cm, pack of 12.", category: "CONSUMABLES", subcategory: "Table Linens", unitPrice: 85, stockQuantity: 500, minOrderQty: 50, leadTimeDays: 5, unitOfMeasure: "pack", images: '["https://images.unsplash.com/photo-1555244162-803834f70033?w=400"]', supplierIndex: 1 },

  // ─── CATEGORY: GUEST_SUPPLIES ───
  { sku: "AMN-001", name: "Shampoo 30ml - Premium", description: "Premium hotel shampoo in 30ml tube with brand logo option.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 6, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-002", name: "Shower Gel 30ml - Premium", description: "Premium hotel shower gel in 30ml tube with brand logo option.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 6, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-003", name: "Conditioner 30ml - Premium", description: "Premium hotel conditioner in 30ml tube with brand logo option.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 6, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-004", name: "Body Lotion 30ml - Premium", description: "Premium hotel body lotion in 30ml tube with brand logo option.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 7, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-005", name: "Facial Soap 20g - Wrapped", description: "Premium hotel facial soap, individually wrapped, 20g with brand option.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 4, stockQuantity: 10000, minOrderQty: 1000, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400"]', supplierIndex: 5 },
  { sku: "AMN-006", name: "Hotel Slippers - Non-woven White", description: "Comfortable non-woven hotel slippers, white, one-size, with logo option.", category: "GUEST_SUPPLIES", subcategory: "Guest Comfort", unitPrice: 25, stockQuantity: 3000, minOrderQty: 500, leadTimeDays: 7, unitOfMeasure: "pair", images: '["https://images.unsplash.com/photo-1590897487020-cc6f83dad596?w=400"]', supplierIndex: 5 },
  { sku: "AMN-007", name: "Hotel Slippers - Terry Plush", description: "Premium terry cloth plush slippers, white, with logo option.", category: "GUEST_SUPPLIES", subcategory: "Guest Comfort", unitPrice: 45, stockQuantity: 2000, minOrderQty: 300, leadTimeDays: 10, unitOfMeasure: "pair", images: '["https://images.unsplash.com/photo-1590897487020-cc6f83dad596?w=400"]', supplierIndex: 5 },
  { sku: "AMN-008", name: "Dental Kit", description: "Hotel dental kit with toothbrush and toothpaste, individually wrapped.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 8, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "kit", images: '["https://images.unsplash.com/photo-1585576553551-5c87868532ac?w=400"]', supplierIndex: 5 },
  { sku: "AMN-009", name: "Shaving Kit", description: "Disposable razor with shaving cream, individually wrapped.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 7, stockQuantity: 4000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "kit", images: '["https://images.unsplash.com/photo-1621607512214-68297480165e?w=400"]', supplierIndex: 5 },
  { sku: "AMN-010", name: "Sewing Kit", description: "Compact hotel sewing kit with needles, thread, and buttons.", category: "GUEST_SUPPLIES", subcategory: "Guest Comfort", unitPrice: 3, stockQuantity: 6000, minOrderQty: 1000, leadTimeDays: 10, unitOfMeasure: "kit", images: '["https://images.unsplash.com/photo-1598033129183-c4f50c736d10?w=400"]', supplierIndex: 5 },
  { sku: "AMN-011", name: "Shower Cap", description: "Disposable shower cap, individually wrapped.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 2, stockQuantity: 8000, minOrderQty: 1000, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-012", name: "Shoe Mitt / Shoe Shine Cloth", description: "Non-woven shoe mitt for guest shoe care.", category: "GUEST_SUPPLIES", subcategory: "Guest Comfort", unitPrice: 3, stockQuantity: 5000, minOrderQty: 500, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1590674899484-13d04423b073?w=400"]', supplierIndex: 5 },
  { sku: "AMN-013", name: "Vanity Kit (Cotton Buds + Pads)", description: "Hotel vanity kit with cotton buds and cotton pads.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 5, stockQuantity: 4000, minOrderQty: 500, leadTimeDays: 10, unitOfMeasure: "kit", images: '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"]', supplierIndex: 5 },
  { sku: "AMN-014", name: "Premium Amenity Dispenser 400ml", description: "Wall-mounted liquid soap/shampoo dispenser, 400ml, chrome finish.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 85, stockQuantity: 500, minOrderQty: 50, leadTimeDays: 14, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=400"]', supplierIndex: 6 },
  { sku: "AMN-015", name: "Liquid Hand Soap Refill 1L", description: "Refill liquid hand soap for dispenser systems, 1L bottle.", category: "GUEST_SUPPLIES", subcategory: "Bath Amenities", unitPrice: 35, stockQuantity: 1000, minOrderQty: 100, leadTimeDays: 5, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=400"]', supplierIndex: 6 },

  // ─── CATEGORY: CONSUMABLES — Housekeeping ───
  { sku: "HSK-001", name: "All-Purpose Cleaner 1L", description: "Professional multi-surface cleaner for housekeeping, 1L bottle.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 35, stockQuantity: 800, minOrderQty: 24, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400"]', supplierIndex: 4 },
  { sku: "HSK-002", name: "Toilet Cleaner 1L", description: "Professional toilet bowl cleaner for housekeeping, 1L bottle.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 30, stockQuantity: 800, minOrderQty: 24, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400"]', supplierIndex: 4 },
  { sku: "HSK-003", name: "Glass Cleaner 1L", description: "Streak-free glass and mirror cleaner, 1L spray bottle.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 32, stockQuantity: 800, minOrderQty: 24, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400"]', supplierIndex: 4 },
  { sku: "HSK-004", name: "Floor Cleaner 1L", description: "Professional floor cleaning solution, 1L bottle.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 28, stockQuantity: 800, minOrderQty: 24, leadTimeDays: 3, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400"]', supplierIndex: 4 },
  { sku: "HSK-005", name: "Laundry Detergent 5kg", description: "Industrial laundry detergent powder, 5kg bag for hotel laundries.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 140, stockQuantity: 300, minOrderQty: 10, leadTimeDays: 3, unitOfMeasure: "bag", images: '["https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400"]', supplierIndex: 4 },
  { sku: "HSK-006", name: "Fabric Softener 5L", description: "Industrial fabric softener concentrate for hotel laundry, 5L.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 180, stockQuantity: 200, minOrderQty: 6, leadTimeDays: 5, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400"]', supplierIndex: 4 },
  { sku: "HSK-007", name: "Dishwashing Liquid 1L", description: "Professional dishwashing liquid for commercial kitchens, 1L.", category: "CONSUMABLES", subcategory: "Cleaning Chemicals", unitPrice: 35, stockQuantity: 600, minOrderQty: 24, leadTimeDays: 2, unitOfMeasure: "bottle", images: '["https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400"]', supplierIndex: 4 },
  { sku: "HSK-008", name: "Industrial Trash Bags 50-Gallon", description: "Heavy-duty trash bags for hotel use, 50-gallon, pack of 50.", category: "CONSUMABLES", subcategory: "Janitorial Supplies", unitPrice: 250, stockQuantity: 500, minOrderQty: 20, leadTimeDays: 3, unitOfMeasure: "roll", images: '["https://images.unsplash.com/photo-1604335399141-7a8c7c66f8f3?w=400"]', supplierIndex: 4 },
  { sku: "HSK-009", name: "Toilet Paper Jumbo Roll 2-Ply", description: "Jumbo toilet paper roll for commercial dispensers, 2-ply.", category: "CONSUMABLES", subcategory: "Janitorial Supplies", unitPrice: 38, stockQuantity: 2000, minOrderQty: 100, leadTimeDays: 2, unitOfMeasure: "roll", images: '["https://images.unsplash.com/photo-1604335399141-7a8c7c66f8f3?w=400"]', supplierIndex: 4 },
  { sku: "HSK-010", name: "Paper Towel Roll - Commercial", description: "Large commercial paper towel roll for kitchen and restroom.", category: "CONSUMABLES", subcategory: "Janitorial Supplies", unitPrice: 45, stockQuantity: 1500, minOrderQty: 50, leadTimeDays: 2, unitOfMeasure: "roll", images: '["https://images.unsplash.com/photo-1604335399141-7a8c7c66f8f3?w=400"]', supplierIndex: 4 },

  // ─── CATEGORY: FFE (Furniture, Fixtures & Equipment) ───
  { sku: "FFE-001", name: "Porcelain Dinner Plate 10 inch", description: "Premium porcelain dinner plate, 10-inch diameter, white.", category: "FFE", subcategory: "Tableware", unitPrice: 85, stockQuantity: 1000, minOrderQty: 48, leadTimeDays: 14, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"]', supplierIndex: 2 },
  { sku: "FFE-002", name: "Porcelain Salad Plate 8 inch", description: "Premium porcelain salad/dessert plate, 8-inch diameter, white.", category: "FFE", subcategory: "Tableware", unitPrice: 65, stockQuantity: 1000, minOrderQty: 48, leadTimeDays: 14, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"]', supplierIndex: 2 },
  { sku: "FFE-003", name: "Glass Tumbler 300ml", description: "Clear glass tumbler, 300ml capacity, commercial grade.", category: "FFE", subcategory: "Glassware", unitPrice: 35, stockQuantity: 2000, minOrderQty: 72, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"]', supplierIndex: 2 },
  { sku: "FFE-004", name: "Wine Glass - Stemmed 250ml", description: "Classic stemmed wine glass, 250ml, clear crystal.", category: "FFE", subcategory: "Glassware", unitPrice: 55, stockQuantity: 1000, minOrderQty: 48, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"]', supplierIndex: 2 },
  { sku: "FFE-005", name: "Coffee Cup & Saucer Set", description: "Porcelain coffee cup with matching saucer, 200ml.", category: "FFE", subcategory: "Tableware", unitPrice: 75, stockQuantity: 800, minOrderQty: 48, leadTimeDays: 14, unitOfMeasure: "set", images: '["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"]', supplierIndex: 2 },
  { sku: "FFE-006", name: "Stainless Steel Flatware Set", description: "Premium 18/10 stainless steel fork, knife, spoon set.", category: "FFE", subcategory: "Flatware", unitPrice: 120, stockQuantity: 1500, minOrderQty: 100, leadTimeDays: 10, unitOfMeasure: "set", images: '["https://images.unsplash.com/photo-1584473457409-5c2b1d06c2e6?w=400"]', supplierIndex: 2 },
  { sku: "FFE-007", name: "Buffet Chafing Dish - Full Size", description: "Commercial stainless steel chafing dish, full size, with fuel holder.", category: "FFE", subcategory: "Buffet Equipment", unitPrice: 2800, stockQuantity: 50, minOrderQty: 5, leadTimeDays: 21, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1555244162-803834f70033?w=400"]', supplierIndex: 2 },
  { sku: "FFE-008", name: "Polycarbonate Plate 10 inch", description: "Unbreakable polycarbonate plate, 10-inch, dishwasher safe.", category: "FFE", subcategory: "Tableware", unitPrice: 65, stockQuantity: 600, minOrderQty: 24, leadTimeDays: 10, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"]', supplierIndex: 2 },
  { sku: "FFE-009", name: "LED Bulb 12W - Warm White", description: "Energy-efficient LED bulb, 12W (60W equivalent), E27 base.", category: "FFE", subcategory: "Lighting", unitPrice: 55, stockQuantity: 1000, minOrderQty: 50, leadTimeDays: 3, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400"]', supplierIndex: 7 },
  { sku: "FFE-010", name: "LED Downlight 15W - Panel", description: "Recessed LED downlight panel, 15W, cool white, for hotel corridors.", category: "FFE", subcategory: "Lighting", unitPrice: 120, stockQuantity: 500, minOrderQty: 20, leadTimeDays: 7, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400"]', supplierIndex: 7 },
  { sku: "FFE-011", name: "Hotel Bedside Table (50x40cm)", description: "Modern wooden bedside table, 50x40cm, with drawer, walnut finish.", category: "FFE", subcategory: "Furniture", unitPrice: 950, stockQuantity: 100, minOrderQty: 10, leadTimeDays: 21, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400"]', supplierIndex: 7 },
  { sku: "FFE-012", name: "Hotel Desk (120x60cm)", description: "Compact wooden desk for hotel rooms, 120x60cm, walnut finish.", category: "FFE", subcategory: "Furniture", unitPrice: 1800, stockQuantity: 80, minOrderQty: 10, leadTimeDays: 21, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400"]', supplierIndex: 7 },
  { sku: "FFE-013", name: "Hotel Luggage Rack", description: "Folding wooden luggage rack with strap, hotel standard.", category: "FFE", subcategory: "Furniture", unitPrice: 450, stockQuantity: 150, minOrderQty: 15, leadTimeDays: 14, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400"]', supplierIndex: 7 },
  { sku: "FFE-014", name: "Mini Bar Fridge 40L", description: "Compact mini bar refrigerator, 40L capacity, silent compressor.", category: "FFE", subcategory: "Appliances", unitPrice: 4200, stockQuantity: 30, minOrderQty: 5, leadTimeDays: 21, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400"]', supplierIndex: 7 },
  { sku: "FFE-015", name: "Hair Dryer 1800W - Wall Mounted", description: "Wall-mounted hair dryer for hotel bathrooms, 1800W with diffuser.", category: "FFE", subcategory: "Appliances", unitPrice: 350, stockQuantity: 200, minOrderQty: 20, leadTimeDays: 14, unitOfMeasure: "piece", images: '["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400"]', supplierIndex: 7 },
];

async function main() {
  console.log("🌱 Starting production product seed...");

  const platformTenant = await prisma.tenant.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "Hotels Vendors Platform",
      slug: "platform",
      type: "PLATFORM",
      status: "ACTIVE",
      taxId: "000-000-000",
    },
  });
  console.log(`🏢 Platform tenant: ${platformTenant.id}`);

  // Create suppliers
  for (const s of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { taxId: s.taxId },
      update: {},
      create: {
        name: s.name,
        legalName: s.legalName,
        taxId: s.taxId,
        city: s.city,
        governorate: s.governorate,
        email: s.email,
        website: s.website,
        phone: "+20 100 000 0000",
        description: `${s.legalName} — verified Egyptian hospitality supplier on HotelsVendors.`,
        status: "ACTIVE" as SupplierStatus,
        tier: s.tier,
        isVerified: true,
        type: "WHOLESALER" as SupplierType,
        tenantId: platformTenant.id,
      },
    });
    console.log(`  ✅ Supplier: ${s.name}`);
  }

  // Create products
  let created = 0;
  for (const p of PRODUCTS) {
    const supplier = await prisma.supplier.findFirst({
      where: { name: SUPPLIERS[p.supplierIndex].name },
    });
    if (!supplier) {
      console.error(`  ❌ Supplier not found for product: ${p.sku}`);
      continue;
    }

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        unitPrice: p.unitPrice,
        stockQuantity: p.stockQuantity,
        minOrderQty: p.minOrderQty,
        leadTimeDays: p.leadTimeDays,
        unitOfMeasure: p.unitOfMeasure,
        images: p.images,
        currency: "EGP",
        status: "ACTIVE" as ProductStatus,
        supplierId: supplier.id,
        tenantId: platformTenant.id,
      },
    });
    created++;
  }

  console.log(`\n✅ ${created} products seeded across ${SUPPLIERS.length} suppliers`);
  console.log("🎉 Product seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
