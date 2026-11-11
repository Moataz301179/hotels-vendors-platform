export type OperatingArea = {
  code: string;
  group: string;
  subcategory: string;
};

const AREAS = {
  FOOD_BEVERAGE: { group: "Restaurants & bars", subcategory: "Food, beverage & kitchen operations" },
  COMMERCIAL_KITCHEN: { group: "Restaurants & bars", subcategory: "Kitchen equipment & food preparation" },
  TABLETOP_SERVICEWARE: { group: "Restaurants & bars", subcategory: "Table service, buffetware & bar supplies" },
  PACKAGING_DISPOSABLES: { group: "Restaurants & bars", subcategory: "Food packaging & disposables" },
  HOUSEKEEPING: { group: "Housekeeping & laundry", subcategory: "Cleaning tools & consumables" },
  HOUSEKEEPING_CLEANING: { group: "Housekeeping & laundry", subcategory: "Cleaning tools & consumables" },
  HOUSEKEEPING_LAUNDRY: { group: "Housekeeping & laundry", subcategory: "Cleaning tools & consumables" },
  LINEN_TEXTILES: { group: "Housekeeping & laundry", subcategory: "Linen, towels & textile care" },
  GUEST_SUPPLIES: { group: "Guest rooms & amenities", subcategory: "In-room amenities & replenishment" },
  GUEST_AMENITIES: { group: "Guest rooms & amenities", subcategory: "In-room amenities & replenishment" },
  GUEST_ROOMS_AMENITIES: { group: "Guest rooms & amenities", subcategory: "In-room amenities & replenishment" },
  ENGINEERING_MRO: { group: "Engineering & maintenance", subcategory: "Building systems & replacement parts" },
  ENGINEERING_MAINTENANCE: { group: "Engineering & maintenance", subcategory: "Building systems & replacement parts" },
  FFE: { group: "Furniture, fixtures & outdoor", subcategory: "Rooms, lobby & outdoor furniture" },
  FF_E: { group: "Furniture, fixtures & outdoor", subcategory: "Rooms, lobby & outdoor furniture" },
  FURNITURE_FIXTURES_OUTDOOR: { group: "Furniture, fixtures & outdoor", subcategory: "Rooms, lobby & outdoor furniture" },
  SERVICES: { group: "Hotel services", subcategory: "Maintenance, compliance & specialist services" },
  SAFETY_SECURITY: { group: "Safety & compliance", subcategory: "Inspection & protection" },
  ICT_AV: { group: "Hotel technology", subcategory: "Systems & audiovisual" },
  UNIFORMS: { group: "Uniforms & workwear", subcategory: "Staff clothing" },
} as const;

export const OPERATING_GROUPS = [
  "Restaurants & bars",
  "Housekeeping & laundry",
  "Guest rooms & amenities",
  "Engineering & maintenance",
  "Furniture, fixtures & outdoor",
  "Hotel services",
  "Safety & compliance",
  "Hotel technology",
  "Uniforms & workwear",
] as const;

export function operatingCategory(code: string | null | undefined, _name = ""): OperatingArea {
  const normalized = (code ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const known = AREAS[normalized as keyof typeof AREAS];
  if (known) return { code: normalized, ...known };
  return { code: normalized || "UNMATCHED", group: "Other operating needs", subcategory: "Reviewed requirement" };
}

export function operatingCategories(codes: unknown): OperatingArea[] {
  const values = Array.isArray(codes) ? codes : [];
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (typeof value !== "string" || !value.trim()) return [];
    const area = operatingCategory(value);
    const key = `${area.group}:${area.subcategory}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [area];
  });
}
