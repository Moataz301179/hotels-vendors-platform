import { NextRequest, NextResponse } from "next/server";

// Mock catalog database
interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  supplierId: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

let catalog: CatalogItem[] = [
  { id: "cat_1", sku: "HV-FB-001", name: "Extra Virgin Olive Oil 5L", category: "F&B", price: 12500, quantity: 500, supplierId: "sup_1", unit: "bottle", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" },
  { id: "cat_2", sku: "HV-HK-002", name: "Premium Bath Amenities Set", category: "Housekeeping", price: 8500, quantity: 200, supplierId: "sup_2", unit: "set", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" },
  { id: "cat_3", sku: "HV-ENG-003", name: "LED Panel Light 24W", category: "Engineering", price: 3200, quantity: 100, supplierId: "sup_3", unit: "piece", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" },
  { id: "cat_4", sku: "HV-FB-004", name: "Egyptian Rice 10kg", category: "F&B", price: 4800, quantity: 1000, supplierId: "sup_1", unit: "bag", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" },
  { id: "cat_5", sku: "HV-HK-005", name: "Egyptian Cotton Towels", category: "Housekeeping", price: 15000, quantity: 300, supplierId: "sup_2", unit: "dozen", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" },
];

import { requireServiceKey } from "@/lib/api-utils";

function requireAuth(request: NextRequest): void {
  requireServiceKey(request, "INVO_SERVICE_KEY");
}

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let results = [...catalog];

    if (supplierId) results = results.filter((i) => i.supplierId === supplierId);
    if (category) results = results.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }

    const total = results.length;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { sku, name, category, price, quantity, supplierId, unit } = body;

    if (!sku || !name || !supplierId) {
      return NextResponse.json({ success: false, error: "sku, name, supplierId required" }, { status: 400 });
    }

    const existing = catalog.find((i) => i.sku === sku);
    if (existing) {
      existing.name = name || existing.name;
      existing.category = category || existing.category;
      existing.price = price ?? existing.price;
      existing.quantity = quantity ?? existing.quantity;
      existing.unit = unit || existing.unit;
      existing.updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, data: existing, action: "updated" });
    }

    const item: CatalogItem = {
      id: `cat_${Date.now()}`,
      sku,
      name,
      category: category || "Uncategorized",
      price: price || 0,
      quantity: quantity || 0,
      supplierId,
      unit: unit || "piece",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    catalog.push(item);
    return NextResponse.json({ success: true, data: item, action: "created" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
