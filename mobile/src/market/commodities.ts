/** Indicative market references for hotel staples. Not supplier offers and not binding. */
export type CommodityQuote = {
  id: string;
  nameAr: string;
  nameEn: string;
  unitAr: string;
  unitEn: string;
  price: number;
  currency: string;
  changePct: number;
};

export const hotelCommodityBoard: CommodityQuote[] = [
  { id: "rice", nameAr: "أرز ياسمين", nameEn: "Jasmine rice", unitAr: "كجم", unitEn: "kg", price: 42, currency: "ج.م", changePct: 1.2 },
  { id: "oil", nameAr: "زيت طبخ", nameEn: "Cooking oil", unitAr: "لتر", unitEn: "L", price: 78, currency: "ج.م", changePct: -0.4 },
  { id: "chicken", nameAr: "دجاج طازج", nameEn: "Fresh chicken", unitAr: "كجم", unitEn: "kg", price: 115, currency: "ج.م", changePct: 2.1 },
  { id: "milk", nameAr: "حليب كامل", nameEn: "Whole milk", unitAr: "لتر", unitEn: "L", price: 36, currency: "ج.م", changePct: 0.3 },
  { id: "eggs", nameAr: "بيض طازج", nameEn: "Fresh eggs", unitAr: "كرتونة", unitEn: "tray", price: 155, currency: "ج.م", changePct: -1.1 },
  { id: "tomato", nameAr: "طماطم", nameEn: "Tomato", unitAr: "كجم", unitEn: "kg", price: 18, currency: "ج.م", changePct: 3.4 },
  { id: "onion", nameAr: "بصل", nameEn: "Onion", unitAr: "كجم", unitEn: "kg", price: 14, currency: "ج.م", changePct: 0.8 },
  { id: "sugar", nameAr: "سكر أبيض", nameEn: "White sugar", unitAr: "كجم", unitEn: "kg", price: 28, currency: "ج.م", changePct: -0.2 },
  { id: "flour", nameAr: "دقيق فاخر", nameEn: "Baker’s flour", unitAr: "كجم", unitEn: "kg", price: 22, currency: "ج.م", changePct: 0.5 },
  { id: "linen", nameAr: "ملاءات بيضاء", nameEn: "White linen", unitAr: "قطعة", unitEn: "pc", price: 210, currency: "ج.م", changePct: 0.0 },
  { id: "detergent", nameAr: "منظف غسيل", nameEn: "Laundry detergent", unitAr: "لتر", unitEn: "L", price: 64, currency: "ج.م", changePct: 1.0 },
  { id: "coffee", nameAr: "بن مطحون", nameEn: "Ground coffee", unitAr: "كجم", unitEn: "kg", price: 420, currency: "ج.م", changePct: 1.7 },
];

export type BundlePromotion = {
  id: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
  badgeAr: string;
  badgeEn: string;
  itemsAr: string;
  itemsEn: string;
  unitHintAr: string;
  unitHintEn: string;
};

/** Anonymous bundle cards for the catalogue. No supplier identity. */
export const reviewBundlePromotions: BundlePromotion[] = [
  {
    id: "bundle-dry",
    titleAr: "حزمة المخزن الجاف",
    titleEn: "Dry-store bundle",
    detailAr: "أرز · زيت · سكر · دقيق",
    detailEn: "Rice · oil · sugar · flour",
    badgeAr: "عرض اليوم",
    badgeEn: "Today’s offer",
    itemsAr: "٤ أصناف شائعة للمطبخ",
    itemsEn: "4 kitchen staples",
    unitHintAr: "مرجع سوقي · بلا مورّد",
    unitHintEn: "Market reference · no supplier",
  },
  {
    id: "bundle-house",
    titleAr: "حزمة التدبير المنزلي",
    titleEn: "Housekeeping bundle",
    detailAr: "ملاءات · منظف · مناشف",
    detailEn: "Linen · detergent · towels",
    badgeAr: "باقة موسمية",
    badgeEn: "Seasonal pack",
    itemsAr: "٣ أصناف للطوابق",
    itemsEn: "3 floor staples",
    unitHintAr: "مرجع سوقي · بلا مورّد",
    unitHintEn: "Market reference · no supplier",
  },
  {
    id: "bundle-breakfast",
    titleAr: "حزمة الإفطار",
    titleEn: "Breakfast bundle",
    detailAr: "بيض · حليب · بن",
    detailEn: "Eggs · milk · coffee",
    badgeAr: "ترويج مجمع",
    badgeEn: "Bundled promo",
    itemsAr: "٣ أصناف صباحية",
    itemsEn: "3 morning staples",
    unitHintAr: "مرجع سوقي · بلا مورّد",
    unitHintEn: "Market reference · no supplier",
  },
];
