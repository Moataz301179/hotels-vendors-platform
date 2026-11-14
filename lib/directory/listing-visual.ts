import { OPERATING_GROUPS, operatingCategory } from "@/lib/directory/operating-category";

/**
 * Marketplace listing imagery.
 * Prefer product-family photographs under /public/catalog over repeated scenic
 * operating-area covers. Covers remain only as a last-resort fallback.
 */
export const APPROVED_COVERS: Record<string, { image: string; detail: string }> = {
  "Restaurants & bars": { image: "/catalog/cover-food-beverage.png", detail: "Food, beverage, kitchen and table service" },
  "Housekeeping & laundry": { image: "/catalog/cleaning-supplies.jpg", detail: "Linen, cleaning and room turnover" },
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

type ItemVisual = {
  test: RegExp;
  image: string;
  /** When set, the rule only applies to these operating-catalog category codes. */
  categories?: readonly string[];
};

/** Ordered specific → family matches. First eligible hit wins. */
const ITEM_IMAGES: ItemVisual[] = [
  // Food & beverage edibles
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
  // Housekeeping chemicals before bare "glass" drinkware matches
  { test: /\b(microfiber|mop|cleaner|detergent|softener|cloth)\b/i, image: "/catalog/cleaning-supplies.jpg" },
  { test: /\blaundry detergent|fabric softener\b/i, image: "/catalog/laundry-detergent.jpg" },
  // Kitchenware — never match glass cleaner via bare "glass"
  { test: /\bgastronorm|food pan\b/i, image: "/catalog/gastronorm-pan.jpg" },
  { test: /\bstorage container|food container|compostable food\b/i, image: "/catalog/food-storage.jpg" },
  {
    test: /\b(tumbler|drinking glass|water glass|glassware)\b/i,
    image: "/catalog/water-tumbler.jpg",
    categories: ["FOOD_BEVERAGE"],
  },
  // Linen & textiles
  { test: /\b(bath towel|hand towel|face towel|bath mat)\b/i, image: "/catalog/bath-towel.jpg" },
  { test: /\b(bed sheet|duvet|pillowcase|fitted)\b/i, image: "/catalog/bed-linen.jpg" },
  { test: /\bpillow\b/i, image: "/catalog/bed-linen.jpg" },
  { test: /\bmattress|bed base|headboard\b/i, image: "/catalog/hotel-mattress.jpg" },
  // Guest amenities
  { test: /\b(shampoo|conditioner|body wash|soap|lotion|dental|sewing kit|amenity dispenser)\b/i, image: "/catalog/guest-amenities.jpg" },
  { test: /\bsewing kit\b/i, image: "/catalog/guest-sewing-kit.jpg" },
  // Technology before engineering so "network … switch" is not an electrical fixture
  { test: /\b(television|tv|remote)\b/i, image: "/catalog/guest-tv.jpg" },
  {
    test: /\b(network|patch panel|patch cord|rack|access point|display screen)\b/i,
    image: "/catalog/network-equipment.jpg",
    categories: ["ICT_AV"],
  },
  {
    test: /\bnetwork access switch\b|\baccess switch\b/i,
    image: "/catalog/network-equipment.jpg",
    categories: ["ICT_AV"],
  },
  // Engineering — wall switches before bare "light" lamp matches
  {
    test: /\b(wall light switch|light switch|socket|fuse|paint|door closer)\b/i,
    image: "/catalog/electrical-fixture.jpg",
    categories: ["ENGINEERING_MRO"],
  },
  { test: /\b(led|lamp|lighting)\b|\bled\s+light\b|\blight\s+fixture\b/i, image: "/catalog/led-lamp.jpg" },
  // Furniture
  { test: /\b(armchair|lounge chair)\b/i, image: "/catalog/lobby-armchair.jpg" },
  { test: /\b(outdoor|luggage rack|nightstand)\b/i, image: "/catalog/outdoor-furniture.jpg" },
  // Safety
  { test: /\bfire extinguisher\b/i, image: "/catalog/fire-extinguisher.jpg" },
  { test: /\bsmoke detector|emergency lighting|exit sign|fire hose|fire blanket\b/i, image: "/catalog/smoke-detector.jpg" },
  { test: /\bfirst aid|spill kit\b/i, image: "/catalog/first-aid.jpg" },
  // Uniforms
  { test: /\b(chef|kitchen bib|kitchen chef|apron)\b/i, image: "/catalog/chef-uniform.jpg" },
  { test: /\b(housekeeping|tunic|work trousers)\b/i, image: "/catalog/housekeeping-uniform.jpg" },
  { test: /\b(reception|blazer|shirt|service waist)\b/i, image: "/catalog/uniforms.jpg" },
  // Services
  { test: /\bpest control\b/i, image: "/catalog/pest-control.jpg" },
  { test: /\b(laundry service|linen rental|waste|hvac|hood cleaning|elevator|inspection|maintenance service)\b/i, image: "/catalog/facility-service.jpg" },
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

function visualMatches(visual: ItemVisual, name: string, category: string | null | undefined) {
  if (!visual.test.test(name)) return false;
  if (!visual.categories?.length) return true;
  return Boolean(category && visual.categories.includes(category));
}

export function listingImage(name: string, category: string | null | undefined) {
  const match = ITEM_IMAGES.find((visual) => visualMatches(visual, name, category));
  if (match) return match.image;
  const area = operatingCategory(category, name);
  return APPROVED_COVERS[area.group]?.image ?? null;
}

export function listingArabicName(name: string, nameAr?: string | null) {
  return nameAr?.trim() || FOOD_ARABIC[name] || null;
}
