import { HOTEL_CATEGORIES } from "./categories";

/**
 * Category album covers for the marketplace storefront.
 *
 * Each category gets ONE cover photograph that shows items FROM that category
 * (e.g. Linens → bedding/curtains/fabric; Technology → digital locks/software;
 * Commercial Kitchen → steel equipment), with the category name overlaid.
 * Covers are marketing photography, distinct from per-product images (which are
 * only ever real supplier images). Codes match HOTEL_CATEGORIES so a cover click
 * filters the marketplace product grid correctly.
 */

export interface CategoryCover {
  code: string;      // matches HOTEL_CATEGORIES code (FB, HK, FFE, OSE, GRA, LIN, ENG, SPA, IT, SEC)
  label: string;     // category name shown on the cover
  hub: string;       // prisma marketplace hub (fb, hk, ffe, ose, gra, lin, eng, spa, it, sec)
  img: string;       // real photograph from the category
  blurb: string;     // short line under the name
}

export const CATEGORY_COVERS: CategoryCover[] = [
  {
    code: "FB", label: "Food & Beverage", hub: "fb",
    blurb: "Kitchen, produce, cookware & chinaware",
    img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "LIN", label: "Linens & Textiles", hub: "lin",
    blurb: "Bedding, towels, curtains & fabric",
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "GRA", label: "Guest Amenities", hub: "gra",
    blurb: "Toiletries, slippers & minibar",
    img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "HK", label: "Housekeeping", hub: "hk",
    blurb: "Cleaning chemicals, carts & tools",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "FFE", label: "Furniture & Equipment", hub: "ffe",
    blurb: "Beds, guestroom fixtures & casegoods",
    img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "ENG", label: "Engineering & MRO", hub: "eng",
    blurb: "HVAC, tools & maintenance",
    img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "SPA", label: "Spa & Recreation", hub: "spa",
    blurb: "Pool, spa & wellness supplies",
    img: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "IT", label: "IT & Technology", hub: "it",
    blurb: "PMS, digital locks & smart systems",
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "SEC", label: "Safety & Security", hub: "sec",
    blurb: "CCTV, access control & fire safety",
    img: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=900&auto=format&fit=crop",
  },
  {
    code: "OSE", label: "Operating Supplies", hub: "ose",
    blurb: "OS&E — daily operations essentials",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=900&auto=format&fit=crop",
  },
];

/** Resolve a cover for a HOTEL_CATEGORIES code, falling back to the category catalog entry. */
export function coverForCode(code: string): CategoryCover | undefined {
  return CATEGORY_COVERS.find((c) => c.code.toLowerCase() === String(code).toLowerCase());
}

/** Build the canonical category list with cover metadata baked in. */
export function categoriesWithCovers() {
  return HOTEL_CATEGORIES.map((cat) => {
    const cover = coverForCode(cat.code) ?? CATEGORY_COVERS.find((c) => c.hub === cat.id);
    return { ...cat, cover: cover?.img ?? null, coverLabel: cover?.label ?? cat.label };
  });
}
