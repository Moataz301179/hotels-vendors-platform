import { OPERATING_GROUPS, operatingCategory } from "@/lib/directory/operating-category";

export const APPROVED_COVERS: Record<string, { image: string; detail: string }> = {
  "Restaurants & bars": { image: "/category-food-beverage.png", detail: "Food, beverage, kitchen and table service" },
  "Housekeeping & laundry": { image: "/category-housekeeping.png", detail: "Linen, cleaning and room turnover" },
  "Guest rooms & amenities": { image: "/category-guest-supplies.png", detail: "In-room amenities and replenishment" },
  "Engineering & maintenance": { image: "/category-engineering-ffe.png", detail: "Property systems, parts and maintenance" },
  "Furniture, fixtures & outdoor": { image: "/category-furniture-fixtures.jpg", detail: "Rooms, public areas and outdoor furniture" },
  "Hotel services": { image: "/category-supplier-catalogue.png", detail: "Specialist operating services" },
  "Safety & compliance": { image: "/catalog/safety.jpg", detail: "Detection, protection and response" },
  "Hotel technology": { image: "/catalog/technology.jpg", detail: "Rooms, meetings and property systems" },
  "Uniforms & workwear": { image: "/catalog/uniforms.jpg", detail: "Kitchen, housekeeping and front office clothing" },
};

const GROUP_LABELS: Record<string, string> = {
  "Restaurants & bars": "Food & beverage",
};

const FOOD_IMAGES: { test: RegExp; image: string }[] = [
  { test: /\brice\b/i, image: "/catalog/rice.jpg" },
  { test: /\bflour\b/i, image: "/catalog/flour.jpg" },
  { test: /\boil\b/i, image: "/catalog/oil.jpg" },
  { test: /\b(milk|butter)\b/i, image: "/catalog/dairy.jpg" },
  { test: /\beggs?\b/i, image: "/catalog/eggs.jpg" },
  { test: /\bchicken\b/i, image: "/catalog/chicken.jpg" },
  { test: /\bbeef\b/i, image: "/catalog/beef.jpg" },
  { test: /\bfish\b/i, image: "/catalog/fish.jpg" },
  { test: /\btea leaves\b/i, image: "/catalog/tea.jpg" },
  { test: /\broasted coffee\b/i, image: "/catalog/coffee.jpg" },
  { test: /\bmineral water\b/i, image: "/catalog/water.jpg" },
  { test: /\bjuice\b/i, image: "/catalog/juice.jpg" },
  { test: /\bbread\b/i, image: "/catalog/bread.jpg" },
  { test: /\bpasta\b/i, image: "/catalog/pasta.jpg" },
  { test: /\b(sugar|salt|pepper|tomato paste|vinegar)\b/i, image: "/catalog/pantry.jpg" },
];

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

export function listingImage(name: string, category: string | null | undefined) {
  const area = operatingCategory(category, name);
  if (area.group === "Restaurants & bars") {
    const match = FOOD_IMAGES.find((visual) => visual.test.test(name));
    if (match) return match.image;
  }
  return APPROVED_COVERS[area.group]?.image ?? null;
}

export function listingArabicName(name: string, nameAr?: string | null) {
  return nameAr?.trim() || FOOD_ARABIC[name] || null;
}
