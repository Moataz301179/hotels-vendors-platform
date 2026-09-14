/**
 * Hotel-Standard Procurement Categorization
 * Based on how Egyptian hotels actually categorize their procurement needs.
 * Not Amazon-style — purpose-built for hospitality operations.
 */

export interface HotelCategory {
  id: string;
  code: string;
  label: string;
  labelAr: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind color class for badges
  examples: string[];
  keywords: string[]; // for search matching
}

export const HOTEL_CATEGORIES: HotelCategory[] = [
  {
    id: "fb",
    code: "FB",
    label: "F&B",
    labelAr: "الأغذية والمشروبات",
    description: "Food, beverages, kitchen equipment, chinaware, glassware, and silverware",
    icon: "UtensilsCrossed",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    examples: ["Beef Cuts", "Fresh Produce", "Kitchen Equipment", "Glassware", "Coffee Machines"],
    keywords: ["food", "beverage", "kitchen", "restaurant", "bar", "catering", "chef", "dining"],
  },
  {
    id: "hk",
    code: "HK",
    label: "Housekeeping",
    labelAr: "التدبير المنزلي",
    description: "Cleaning chemicals, equipment, carts, and operational supplies for room and public area maintenance",
    icon: "Sparkles",
    color: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    examples: ["Cleaning Chemicals", "Vacuum Cleaners", "Mops", "Laundry Detergent", "Trash Bins"],
    keywords: ["clean", "housekeeping", "room service", "laundry", "sanitation", "hygiene"],
  },
  {
    id: "ffe",
    code: "FFE",
    label: "FFE",
    labelAr: "الأثاث والتجهيزات",
    description: "Furniture, Fixtures & Equipment — room furniture, lobby fixtures, lighting, bathroom fixtures",
    icon: "Sofa",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    examples: ["Beds & Mattresses", "Lobby Sofas", "Lighting Fixtures", "Bathroom Vanities", "Curtains"],
    keywords: ["furniture", "fixture", "bed", "sofa", "light", "lamp", "mirror", "cabinet"],
  },
  {
    id: "ose",
    code: "OSE",
    label: "OS&E",
    labelAr: "المستلزمات التشغيلية",
    description: "Operating Supplies & Equipment — uniforms, stationery, key cards, daily consumables",
    icon: "Briefcase",
    color: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    examples: ["Staff Uniforms", "Key Cards", "Stationery", "Office Supplies", "Name Badges"],
    keywords: ["uniform", "supply", "stationery", "office", "key card", "consumable", "operation"],
  },
  {
    id: "gra",
    code: "GRA",
    label: "Guest Amenities",
    labelAr: "لوازم غرف الضيوف",
    description: "Toiletries, slippers, robes, minibar items, and welcome amenities for guest rooms",
    icon: "Bath",
    color: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    examples: ["Shampoo & Conditioner", "Slippers", "Bathrobes", "Minibar Snacks", "Dental Kits"],
    keywords: ["amenity", "toiletry", "shampoo", "soap", "slipper", "robe", "minibar", "guest"],
  },
  {
    id: "lin",
    code: "LIN",
    label: "Linens & Textiles",
    labelAr: "المفروشات والمنسوجات",
    description: "Bed linens, towels, bathrobes, curtains, tablecloths, and upholstery fabrics",
    icon: "Shirt",
    color: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    examples: ["Bed Sheets", "Bath Towels", "Tablecloths", "Napkins", "Curtains"],
    keywords: ["linen", "textile", "towel", "sheet", "bedding", "fabric", "curtain", "napkin"],
  },
  {
    id: "eng",
    code: "ENG",
    label: "Engineering",
    labelAr: "الهندسة والصيانة",
    description: "Engineering & Maintenance — HVAC parts, electrical supplies, plumbing, tools, spare parts",
    icon: "Wrench",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    examples: ["HVAC Filters", "Electrical Cables", "Plumbing Fittings", "Power Tools", "Spare Parts"],
    keywords: ["engineering", "maintenance", "hvac", "electrical", "plumbing", "tool", "repair"],
  },
  {
    id: "spa",
    code: "SPA",
    label: "Spa & Recreation",
    labelAr: "السبا والترفيه",
    description: "Spa products, pool chemicals, gym equipment, sauna supplies, and wellness amenities",
    icon: "Droplets",
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    examples: ["Massage Oils", "Pool Chemicals", "Gym Equipment", "Sauna Stones", "Facial Masks"],
    keywords: ["spa", "pool", "gym", "wellness", "massage", "fitness", "recreation", "swim"],
  },
  {
    id: "it",
    code: "IT",
    label: "IT & Technology",
    labelAr: "تكنولوجيا المعلومات",
    description: "TVs, WiFi equipment, POS systems, key card systems, cabling, and hotel tech infrastructure",
    icon: "Monitor",
    color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    examples: ["Smart TVs", "WiFi Access Points", "POS Terminals", "Key Card Encoders", "Network Cables"],
    keywords: ["it", "tech", "computer", "tv", "wifi", "network", "pos", "software", "hardware"],
  },
  {
    id: "sec",
    code: "SEC",
    label: "Safety & Security",
    labelAr: "السلامة والأمن",
    description: "Fire safety equipment, CCTV cameras, smoke detectors, locks, safes, and access control",
    icon: "Shield",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    examples: ["Fire Extinguishers", "CCTV Cameras", "Smoke Detectors", "Electronic Locks", "Room Safes"],
    keywords: ["safety", "security", "fire", "cctv", "lock", "safe", "alarm", "detector", "access"],
  },
];

export const CATEGORY_MAP: Record<string, string> = {
  // Old category → new category ID
  "F&B": "fb",
  "Housekeeping": "hk",
  "Amenities": "gra",
  "Capital Equipment": "ffe",
  "Engineering": "eng",
};

export function getCategoryById(id: string): HotelCategory | undefined {
  return HOTEL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryByCode(code: string): HotelCategory | undefined {
  return HOTEL_CATEGORIES.find((c) => c.code === code);
}

/**
 * Map a supplier's old categories and products to the best matching hotel category IDs.
 */
export function classifySupplier(
  oldCategories: string[],
  products: string[]
): { categoryId: string; confidence: number }[] {
  const scores: Record<string, number> = {};

  for (const cat of HOTEL_CATEGORIES) {
    let score = 0;
    // Product keyword matching
    for (const product of products) {
      const productLower = product.toLowerCase();
      for (const kw of cat.keywords) {
        if (productLower.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
    }
    // Old category mapping
    for (const oldCat of oldCategories) {
      const mapped = CATEGORY_MAP[oldCat];
      if (mapped === cat.id) {
        score += 5;
      }
    }
    scores[cat.id] = (scores[cat.id] || 0) + score;
  }

  const maxScore = Math.max(0, ...Object.values(scores));
  return Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      categoryId: id,
      confidence: maxScore > 0 ? score / maxScore : 0,
    }));
}
