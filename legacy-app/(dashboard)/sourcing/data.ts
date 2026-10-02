// Stub data for sourcing page — imported locally so the page no longer depends
// on lib/stubs-export. In production, replace with data from the real RFQ API.

export const RFQS = [
  { id: "RFQ-001", productId: "PROD-001", hotelId: "HOTEL-001", supplierId: "SUP-001", qty: 500, status: "open", at: "2026-09-20T10:00:00", title: "Mini Bar Restock", titleAr: "تجديد بار miniature", categoryId: "CAT-001", issueDate: "2026-09-15", closingDate: "2026-09-30", bids: 3, note: "Urgent restock needed" },
  { id: "RFQ-002", productId: "PROD-002", hotelId: "HOTEL-002", supplierId: "SUP-002", qty: 200, status: "draft", at: "2026-09-18T14:00:00", title: "Cleaning Supplies", titleAr: "لوازم تنظيف", categoryId: "CAT-002", issueDate: "2026-09-18", closingDate: "2026-09-25", bids: 0, note: "" },
  { id: "RFQ-003", productId: "PROD-003", hotelId: "HOTEL-001", supplierId: "", qty: 1000, status: "open", at: "2026-09-19T09:00:00", title: "Linens Q4", titleAr: "ملاءات الربع الرابع", categoryId: "CAT-003", issueDate: "2026-09-19", closingDate: "2026-10-15", bids: 5, note: "Bulk order for Q4" },
  { id: "RFQ-004", productId: "PROD-004", hotelId: "HOTEL-003", supplierId: "SUP-003", qty: 300, status: "closed", at: "2026-09-10T11:00:00", title: "Food Items Monthly", titleAr: "بضائع غذائية شهرية", categoryId: "CAT-004", issueDate: "2026-09-10", closingDate: "2026-09-20", bids: 8, note: "Awarded to SUP-003" },
  { id: "RFQ-005", productId: "PROD-005", hotelId: "HOTEL-002", supplierId: "", qty: 150, status: "awarded", at: "2026-09-17T16:00:00", title: "Amenity Kits", titleAr: "علب الامتنيات", categoryId: "CAT-005", issueDate: "2026-09-17", closingDate: "2026-09-28", bids: 4, note: "Awarded to SUP-001, pending delivery" },
];

export const CATEGORIES = [
  { id: "CAT-001", name: "Mini Bar", nameAr: "البار الصغير" },
  { id: "CAT-002", name: "Cleaning", nameAr: "تنظيف" },
  { id: "CAT-003", name: "Linens", nameAr: "ملاءات" },
  { id: "CAT-004", name: "Food & Beverage", nameAr: "غذاء وشراب" },
  { id: "CAT-005", name: "Amenities", nameAr: "الامتنيات" },
];

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function fmtDate(date: string | undefined, lang: string): string {
  if (!date) return "";
  const d = new Date(date);
  return lang === "ar"
    ? d.toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" })
    : d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
