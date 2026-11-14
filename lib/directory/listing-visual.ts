import { OPERATING_GROUPS } from "@/lib/directory/operating-category";

/**
 * Marketplace album / carousel covers only.
 * Row and detail product thumbs must not invent family stock photos
 * (tea/pasta/pantry/cleaning, etc.) — those read as fake product evidence.
 */
export const APPROVED_COVERS: Record<string, { image: string; detail: string }> = {
  "Restaurants & bars": { image: "/catalog/cover-food-beverage.png", detail: "Food, beverage, kitchen and table service" },
  "Housekeeping & laundry": { image: "/catalog/cover-housekeeping-laundry.jpg", detail: "Linen, cleaning and room turnover" },
  "Guest rooms & amenities": { image: "/catalog/guest-amenities.jpg", detail: "In-room amenities and replenishment" },
  "Engineering & maintenance": { image: "/catalog/electrical-fixture.jpg", detail: "Property systems, parts and maintenance" },
  "Furniture, fixtures & outdoor": { image: "/catalog/cover-furniture-fixtures.jpg", detail: "Rooms, public areas and outdoor furniture" },
  "Hotel services": { image: "/catalog/facility-service.jpg", detail: "Specialist operating services" },
  "Safety & compliance": { image: "/catalog/cover-safety-compliance.jpg", detail: "Detection, protection and response" },
  "Hotel technology": { image: "/catalog/cover-hotel-technology.jpg", detail: "Rooms, meetings and property systems" },
  "Uniforms & workwear": { image: "/catalog/chef-uniform.jpg", detail: "Kitchen, housekeeping and front office clothing" },
};

const GROUP_LABELS: Record<string, string> = {
  "Restaurants & bars": "Food & beverage",
};

const FOOD_ARABIC: Record<string, string> = {
  "Long-grain white rice": "أرز أبيض طويل الحبة",
  "Wheat flour, all purpose": "دقيق قمح متعدد الاستخدام",
  "White crystal sugar": "سكر أبيض",
  "Iodized table salt": "ملح طعام مدعم باليود",
  "Sunflower cooking oil": "زيت دوار الشمس للطبخ",
  "Tomato paste": "معجون طماطم",
  "Dry durum pasta": "مكرونة قمح قاسي",
  "UHT whole milk": "حليب كامل الدسم طويل الأجل",
  "Salted butter": "زبدة مملحة",
  "Fresh shell eggs": "بيض طازج",
  "Frozen chicken breast": "صدور دجاج مجمدة",
  "Frozen beef cubes": "مكعبات لحم بقري مجمدة",
  "Frozen white fish fillet": "فيليه سمك أبيض مجمد",
  "Black tea leaves": "أوراق شاي أسود",
  "Roasted coffee beans": "بن محمص",
  "Still mineral water, 330 ml": "مياه معدنية ساكنة، ٣٣٠ مل",
  "Orange juice": "عصير برتقال",
  "White vinegar": "خل أبيض",
  "Ground black pepper": "فلفل أسود مطحون",
  "Sliced white bread": "خبز أبيض شرائح",
};

const EDIBLE_SUBCATEGORIES = new Set([
  "Dry grocery",
  "Cooking fats",
  "Dairy",
  "Protein",
  "Beverage",
  "Bakery",
  "Food, beverage & kitchen operations",
]);

export function groupLabel(group: string) {
  return GROUP_LABELS[group] ?? group;
}

export function canonicalOperatingGroup(value: string) {
  const trimmed = value.trim();
  if (/^food\s*&\s*beverage$/i.test(trimmed)) return "Restaurants & bars";
  return trimmed;
}

export function orderedOperatingGroups(groups: Iterable<string>) {
  const present = new Set(groups);
  return [
    ...OPERATING_GROUPS.filter((group) => present.has(group)),
    ...[...present].filter((group) => !OPERATING_GROUPS.includes(group as (typeof OPERATING_GROUPS)[number])).sort(),
  ];
}

export function edibleRank(subcategory: string | null | undefined) {
  return subcategory && EDIBLE_SUBCATEGORIES.has(subcategory) ? 0 : 1;
}

/** Never invent family stock photos for a specification row or detail. */
export function listingImage(_name: string, _category: string | null | undefined): string | null {
  return null;
}

export function listingArabicName(name: string, nameAr?: string | null) {
  return nameAr?.trim() || FOOD_ARABIC[name] || null;
}
