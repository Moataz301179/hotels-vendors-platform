/**
 * Canonical hotel-supplies taxonomy for the public catalog.
 * Groups stay aligned with OPERATING_GROUPS; subcategories are browse filters
 * for hotel buyers (not vendor taxonomy). Keep labels supplier-neutral.
 */

export const HOSPITALITY_TAXONOMY = {
  "Restaurants & bars": {
    label: "Food & beverage",
    subcategories: [
      "Dry grocery",
      "Fresh produce",
      "Dairy & eggs",
      "Meat",
      "Poultry",
      "Fish & seafood",
      "Frozen foods",
      "Bakery",
      "Cooking fats & oils",
      "Soft drinks",
      "Juices",
      "Hot beverages",
      "Spirit drinks",
      "Kitchen equipment",
      "Table service",
      "Food packaging",
    ],
  },
  "Housekeeping & laundry": {
    label: "Housekeeping & laundry",
    subcategories: [
      "Room cleaning",
      "Cleaning tools",
      "Laundry chemicals",
      "Guest bathroom linen",
      "Guest room bedding",
      "Restaurant linen",
      "Pool and leisure linen",
      "Waste handling",
    ],
  },
  "Guest rooms & amenities": {
    label: "Guest rooms & amenities",
    subcategories: [
      "In-room amenities",
      "Bathroom amenities",
      "Stationery",
      "Room fittings",
    ],
  },
  "Engineering & maintenance": {
    label: "Engineering & maintenance",
    subcategories: [
      "Electrical parts",
      "Plumbing parts",
      "HVAC parts",
      "Indoor finishes",
      "Outdoor & grounds maintenance",
      "Door hardware",
      "Lighting fixtures",
      "Tools & hardware",
    ],
  },
  "Furniture, fixtures & outdoor": {
    label: "Furniture, fixtures & outdoor",
    subcategories: [
      "Beds & mattresses",
      "Guest room seating & desks",
      "Storage & wardrobes",
      "Bathroom fixtures",
      "Lobby & lounge",
      "Banquet & events",
      "Outdoor & pool",
      "Window treatments",
    ],
  },
  "Hotel technology": {
    label: "Hotel technology",
    subcategories: [
      "Property software",
      "Guest apps & lockers",
      "Speakers & sound systems",
      "Guest room systems",
      "Network & connectivity",
      "Access control hardware",
      "Meeting AV",
      "Office systems",
      "POS & restaurant systems",
      "Security systems",
    ],
  },
  "Hotel services": {
    label: "Hotel services",
    subcategories: [
      "Building services",
      "Cleaning services",
      "Kitchen services",
      "Linen programs",
      "Grounds services",
      "Guest services",
      "Leisure services",
      "Compliance services",
      "Technology services",
      "Waste handling",
    ],
  },
  "Safety & compliance": {
    label: "Safety & compliance",
    subcategories: [
      "Detection",
      "Suppression",
      "Signage",
      "Personal protection",
      "Response",
      "Compartmentation",
      "Emergency lighting",
    ],
  },
  "Uniforms & workwear": {
    label: "Uniforms & workwear",
    subcategories: [
      "Kitchen",
      "Food service",
      "Housekeeping",
      "Front office",
      "Engineering",
      "Security",
      "Leisure",
      "Footwear",
      "Accessories",
    ],
  },
} as const;

export type HospitalityGroup = keyof typeof HOSPITALITY_TAXONOMY;

/** Map legacy / coarse catalog subcategory labels onto the canonical set. */
export const SUBCATEGORY_ALIASES: Record<string, string> = {
  Protein: "Frozen foods",
  Beverage: "Hot beverages",
  Dairy: "Dairy & eggs",
  "Cooking fats": "Cooking fats & oils",
  "Food, beverage & kitchen operations": "Dry grocery",
  "Kitchen equipment & food preparation": "Kitchen equipment",
  "Kitchen food preparation": "Kitchen equipment",
  "Table service, buffetware & bar supplies": "Table service",
  "Table service": "Table service",
  "Food packaging & disposables": "Food packaging",
  "Food packaging": "Food packaging",
  "Guest room furniture": "Guest room seating & desks",
  "Public area furniture": "Lobby & lounge",
  "Outdoor furniture": "Outdoor & pool",
  "Pool and outdoor furniture": "Outdoor & pool",
  Network: "Network & connectivity",
  "Meeting systems": "Meeting AV",
  "Access systems": "Access control hardware",
  "Restaurant systems": "POS & restaurant systems",
  "Systems & audiovisual": "Meeting AV",
  "Guest connectivity": "Network & connectivity",
  "Meetings and events": "Meeting AV",
  Electrical: "Electrical parts",
  Plumbing: "Plumbing parts",
  Finishes: "Indoor finishes",
  Hardware: "Tools & hardware",
  Lighting: "Lighting fixtures",
  "Building systems & replacement parts": "Electrical parts",
  "Rooms, lobby & outdoor furniture": "Lobby & lounge",
  "In-room amenities & replenishment": "In-room amenities",
  "In-room replenishment": "In-room amenities",
  "Cleaning tools & consumables": "Cleaning tools",
  "Linen, towels & textile care": "Guest bathroom linen",
  "Room and public-area cleaning": "Room cleaning",
  "Inspection & protection": "Detection",
  "Fire protection equipment": "Suppression",
  "Workplace protection": "Personal protection",
  "Staff clothing": "Front office",
  "Housekeeping clothing": "Housekeeping",
  "Kitchen clothing": "Kitchen",
};

export function canonicalizeSubcategory(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return SUBCATEGORY_ALIASES[trimmed] ?? trimmed;
}

export function subcategoriesForGroup(group: string): readonly string[] {
  const entry = HOSPITALITY_TAXONOMY[group as HospitalityGroup];
  return entry?.subcategories ?? [];
}
