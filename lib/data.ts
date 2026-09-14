import type {
  Carrier,
  Category,
  Hotel,
  Partner,
  Product,
  Supplier,
} from "./types";

/* Real stock photography, hand-matched to each SKU and category so the
 * marketplace reads like a genuine supplier catalogue rather than stock filler. */
const px = (id: number, w = 900, h = 675) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const HERO_IMG = px(14011664, 1920, 1080);
export const LOBBY_IMG = px(14036253, 1200, 800);
export const WAREHOUSE_IMG = px(12418936, 1400, 900);
export const STAIR_IMG = px(3926482, 1200, 800);
export const KITCHEN_IMG = px(15671274, 1400, 900);

export const CATEGORIES: Category[] = [
  {
    id: "fbn",
    name: "F&B",
    nameAr: "المأكولات والمشروبات",
    blurb: "Dry goods, chilled lines, beverages and pantry staples for kitchens, banqueting and room service.",
    blurbAr: "سلع جافة وخطوط مبردة ومشروبات وأساسيات المؤن للمطابخ والولائم وخدمة الغرف.",
    img: px(6939765, 1100, 780),
  },
  {
    id: "housekeeping",
    name: "Housekeeping",
    nameAr: "النظافة",
    blurb: "Linen, towels, industrial chemicals and consumables that keep floors running.",
    blurbAr: "مفروشات ومناشف ومواد كيميائية صناعية ومستهلكات تحافظ على تشغيل الأدوار.",
    img: px(6466227, 1100, 780),
  },
  {
    id: "amenities",
    name: "Amenities",
    nameAr: "مستلزمات الضيوف",
    blurb: "Guest-room amenities, in-room consumables and branded hospitality items.",
    blurbAr: "مستلزمات الغرفة ومستهلكاتها ومنتجات الضيافة.",
    img: px(31865248, 1100, 780),
  },
  {
    id: "engineering",
    name: "Engineering",
    nameAr: "الهندسة",
    blurb: "MRO spares, electrical, HVAC and safety equipment for the technical department.",
    blurbAr: "قطع غيار صيانة وكهرباء وتكييف ومعدات سلامة لقسم الهندسة.",
    img: px(14637831, 1100, 780),
  },
];

export const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "Misr F&B Distribution",
    nameAr: "مصر لتوزيع المأكولات والمشروبات",
    city: "6th of October City",
    since: 2024,
    categories: ["fbn"],
    phone: "+20 2 3537 1100",
    email: "orders@misrfandb.eg",
    coverage: "Cairo, Giza, Alexandria, Nile Delta",
    coverageAr: "القاهرة، الجيزة، الإسكندرية، الدلتا",
    leadDays: [1, 3],
  },
  {
    id: "s2",
    name: "Nile Housekeeping Supply Co.",
    nameAr: "النيل لتوريدات النظافة",
    city: "Obour Industrial Zone",
    since: 2024,
    categories: ["housekeeping", "amenities"],
    phone: "+20 2 2680 2244",
    email: "sales@nilehk.eg",
    coverage: "Greater Cairo, Upper Egypt",
    coverageAr: "القاهرة الكبرى، صعيد مصر",
    leadDays: [2, 5],
  },
  {
    id: "s3",
    name: "Delta Engineering & Facilities",
    nameAr: "دلتا الهندسة والمرافق",
    city: "10th of Ramadan City",
    since: 2025,
    categories: ["engineering", "amenities"],
    phone: "+20 10 4410 3377",
    email: "procurement@deltaef.eg",
    coverage: "National — all governorates",
    coverageAr: "على مستوى الجمهورية — جميع المحافظات",
    leadDays: [3, 7],
  },
];

export const HOTELS: Hotel[] = [
  { id: "h1", name: "Nile Crown Hotel", nameAr: "فندق نيل كراون", city: "Cairo", cityAr: "القاهرة", rooms: 320, since: 2024 },
  { id: "h2", name: "Marina Bay Resort", nameAr: "مريנה باي ريزورت", city: "Hurghada", cityAr: "غردقة", rooms: 180, since: 2024 },
  { id: "h3", name: "Old Corniche Grand", nameAr: "أولد كورنيش جراند", city: "Alexandria", cityAr: "الإسكندرية", rooms: 210, since: 2025 },
  { id: "h4", name: "Luxor Riverside Palace", nameAr: "قصر ليكسور رايفايد", city: "Luxor", cityAr: "الأقصر", rooms: 140, since: 2025 },
  { id: "h5", name: "Marsa Palm Resort", nameAr: "مارسا بالم ريزورت", city: "Marsa Alam", cityAr: "مرسى علم", rooms: 96, since: 2025 },
];

export const PARTNERS: Partner[] = [
  {
    id: "f1",
    name: "NileBridge Capital",
    nameAr: "نيل بريدج كابيتال",
    license: "Licensed financing partner — trade & receivables facilities",
    licenseAr: "شريك تمويل مرخّص — تسهيلات تجارة وأصول متداولة",
  },
];

export const CARRIERS: Carrier[] = [
  { id: "c1", name: "Ras El Hoda Logistics", nameAr: "رأس الهدى لوجستكس", city: "Cairo", fleet: "Refrigerated & dry box trucks" },
  { id: "c2", name: "Delta Freight & Logistics", nameAr: "دلتا فريغت", city: "Alexandria", fleet: "Dry box trucks, vans" },
];

export const PRODUCTS: Product[] = [
  // ---- F&B (s1)
  {
    id: "p1", sku: "FBN-1001", name: "Arabica Coffee Beans", nameAr: "حبوب قهوة أرابيكا",
    categoryId: "fbn", supplierId: "s1", unit: "1 kg bag", unitAr: "كيس 1 كجم",
    price: 385, moq: 10, leadDays: 2, stock: "in",
    img: px(33417741), alt: "Premium bag of roasted arabica coffee beans",
    desc: "Freshly roasted arabica blend, medium roast. Consistent batch profile, sealed food-grade bags with roast date.",
    descAr: "خلطة أرابيكا محمّصة طازجة، تحميص متوسط. ملف دفعات ثابت وأكياس غذائية مختومة بتاريخ التحميص.",
    specs: [
      { k: "Origin", kAr: "المصدر", v: "Ethiopia / Brazil" },
      { k: "Roast", kAr: "التحميص", v: "Medium" },
      { k: "Shelf life", kAr: "صلاحية", v: "9 months" },
    ],
  },
  {
    id: "p2", sku: "FBN-1002", name: "Long Grain Basmati Rice", nameAr: "أرز بسمتي طويل الحبة",
    categoryId: "fbn", supplierId: "s1", unit: "10 kg sack", unitAr: "كيس 10 كجم",
    price: 720, moq: 5, leadDays: 3, stock: "in",
    img: px(3737694), alt: "White long-grain rice in sacks",
    desc: "Premium long-grain basmati, 11% moisture max. Vacuum-sealed sacks, food-safe pallet wrapping for hotel kitchens.",
    descAr: "بسمتي طويل الحبة فاخر، رطوبة 11% كحد أقصى. أكياس مضغوطة وتغليف بالبتليت آمن غذائياً.",
    specs: [
      { k: "Grade", kAr: "التصنيف", v: "A1" },
      { k: "Moisture", kAr: "الرطوبة", v: "≤ 11%" },
      { k: "Pack", kAr: "التعبئة", v: "10 kg" },
    ],
  },
  {
    id: "p3", sku: "FBN-1003", name: "Sunflower Oil", nameAr: "زيت عباد الشمس",
    categoryId: "fbn", supplierId: "s1", unit: "Case / 12 × 1 L", unitAr: "كرتونة / 12 × 1 لتر",
    price: 4680, moq: 1, leadDays: 2, stock: "low",
    img: px(5737246), alt: "Refined cooking oil being poured from a bottle",
    desc: "Refined sunflower oil for frying and preparation. Sealed cartons, 12 one-litre bottles per case.",
    descAr: "زيت عباد الشمس المكرر للقلي والتحضير. كراتين مختومة، 12 زجاجة لتر لكل كرتونة.",
    specs: [
      { k: "Type", kAr: "النوع", v: "Refined" },
      { k: "Case", kAr: "الكرتونة", v: "12 × 1 L" },
    ],
  },
  {
    id: "p4", sku: "FBN-1004", name: "Chilled Chicken Breast", nameAr: "صدور دجاج مبردة",
    categoryId: "fbn", supplierId: "s1", unit: "5 kg carton (chilled)", unitAr: "كرتون 5 كجم (مبرد)",
    price: 1450, moq: 4, leadDays: 1, stock: "in",
    img: px(5769376), alt: "Raw chicken breasts on a white surface",
    desc: "Skinless chicken breast, 0–4°C chilled chain. COA per batch, temperature-logged transport required.",
    descAr: "صدور دجاج بدون جلد، سلسلة تبريد 0–4°م. شهادة تحليل لكل دفعة ونقل بدرجة حرارة مسجلة.",
    specs: [
      { k: "Temp chain", kAr: "سلسلة الحرارة", v: "0–4 °C" },
      { k: "Docs", kAr: "المستندات", v: "COA per batch" },
    ],
  },
  {
    id: "p5", sku: "FBN-1005", name: "Red Wine (Banquet Grade)", nameAr: "نبيذ أحمر (جودة الولائم)",
    categoryId: "fbn", supplierId: "s1", unit: "Case / 6 bottles", unitAr: "كرتونة / 6 قوارير",
    price: 9600, moq: 2, leadDays: 3, stock: "in",
    img: px(17313073), alt: "Case of assorted wine bottles",
    desc: "Banquet-grade red wine, sealed wooden cases. Customs and import papers on file; licensed delivery only.",
    descAr: "نبيذ أحمر بجودة الولائم، كراتين خشبية مختومة. أوراق استيراد رسمية؛ توصيل مرخّص فقط.",
    specs: [
      { k: "Origin", kAr: "المصدر", v: "Imported" },
      { k: "Case", kAr: "الكرتونة", v: "6 × 750 ml" },
    ],
  },
  {
    id: "p6", sku: "FBN-1006", name: "Assorted Fresh Fruit Box", nameAr: "صندوق فواكه طازجة مشكلة",
    categoryId: "fbn", supplierId: "s1", unit: "10 kg box", unitAr: "صندوق 10 كجم",
    price: 1150, moq: 6, leadDays: 1, stock: "in",
    img: px(12203694), alt: "Fresh fruit in wooden market crates",
    desc: "Seasonal local fruit mix — oranges, apples, grapes. Hand-picked, delivered within 24 h of harvest.",
    descAr: "خلطة فواكه موسمية محلية — برتقال وتفاح وعنب. قطف يدوي وتوصيل خلال 24 ساعة من الحصاد.",
    specs: [
      { k: "Mix", kAr: "التشكيلة", v: "Seasonal local" },
      { k: "Delivery", kAr: "التوصيل", v: "≤ 24 h from harvest" },
    ],
  },
  {
    id: "p7", sku: "FBN-1007", name: "Still Water 0.5 L", nameAr: "مياه معدنية 0.5 لتر",
    categoryId: "fbn", supplierId: "s1", unit: "Case / 24", unitAr: "كرتونة / 24",
    price: 210, moq: 20, leadDays: 1, stock: "in",
    img: px(11860562), alt: "Still mineral water bottles with blue caps",
    desc: "Still mineral water for guest rooms and banqueting. Shrink-wrapped cases, lot-coded caps.",
    descAr: "مياه معدنية هادئة للغرف والولائم. كراتين مضغوطة وأغلفة مرمّزة.",
    specs: [
      { k: "Volume", kAr: "الحجم", v: "500 ml" },
      { k: "Case", kAr: "الكرتونة", v: "24" },
    ],
  },

  // ---- Housekeeping (s2)
  {
    id: "p8", sku: "HK-2001", name: "Cotton Bath Towel 700 GSM", nameAr: "منشفة حمام قطن 700 جم",
    categoryId: "housekeeping", supplierId: "s2", unit: "Towel (70×140)", unitAr: "منشفة (70×140)",
    price: 245, moq: 24, leadDays: 5, stock: "in",
    img: px(12932367), alt: "Stack of folded white cotton towels",
    desc: "Turkish cotton, 700 GSM, hotel-grade absorbency. OEKO-TEX certified, grey/white/cream.",
    descAr: "قطن تركي 700 جم، امتصاص بمستوى الفنادق. معتمد OEKO-TEX، رمادي/أبيض/كريمي.",
    specs: [
      { k: "GSM", kAr: "الوزن", v: "700" },
      { k: "Cert", kAr: "الشهادة", v: "OEKO-TEX" },
    ],
  },
  {
    id: "p9", sku: "HK-2002", name: "Bed Linen Set — King", nameAr: "طقم ملاءات — كينج",
    categoryId: "housekeeping", supplierId: "s2", unit: "Set (300 TC)", unitAr: "طقم (300 خيط)",
    price: 1350, moq: 10, leadDays: 5, stock: "in",
    img: px(2736388), alt: "Hotel bed dressed in white linen",
    desc: "King bed linen set — flat sheet, fitted sheet, 2 pillowcases. 300 thread-count combed cotton, pre-shrunk.",
    descAr: "طقم ملاءات كينج — ملاءة سفلى وعليا وغطاءا مخدة. قطن ممشط 300 خيط، مضغوط مسبقاً.",
    specs: [
      { k: "TC", kAr: "الخيط", v: "300" },
      { k: "Fabric", kAr: "القماش", v: "Combed cotton" },
    ],
  },
  {
    id: "p10", sku: "HK-2003", name: "Industrial Laundry Detergent", nameAr: "غسيل صناعي مركز",
    categoryId: "housekeeping", supplierId: "s2", unit: "5 L can", unitAr: "عبوة 5 لتر",
    price: 520, moq: 12, leadDays: 3, stock: "in",
    img: px(10281767), alt: "Bulk laundry detergent container",
    desc: "High-foam industrial detergent for commercial laundry lines. Dosage-tested for 300 TC cotton.",
    descAr: "مواد غسيل صناعية عالية الرغوة لخطوط الغسيل التجارية. جرعات مفعّلة للقطن 300 خيط.",
    specs: [
      { k: "Dose", kAr: "الجرعة", v: "50 ml / 10 kg" },
      { k: "Pack", kAr: "التعبئة", v: "5 L" },
    ],
  },
  {
    id: "p11", sku: "HK-2004", name: "Floor Cleaner Concentrate", nameAr: "منظف أرضيات مركز",
    categoryId: "housekeeping", supplierId: "s2", unit: "5 L can", unitAr: "عبوة 5 لتر",
    price: 460, moq: 12, leadDays: 3, stock: "low",
    img: px(9080144), alt: "Gloved hand holding a cleaning spray bottle",
    desc: "Neutral-pH floor cleaner for marble, granite and ceramic. Dilution 1:50, low residue.",
    descAr: "منظف أرضيات متعادل لرخام وحجر وخزف. تخفيف 1:50 وبقايا منخفضة.",
    specs: [
      { k: "pH", kAr: "الأس الهيدروجيني", v: "7 (neutral)" },
      { k: "Dilution", kAr: "التخفيف", v: "1:50" },
    ],
  },
  {
    id: "p12", sku: "HK-2005", name: "Trash Bags — Heavy Duty", nameAr: "أكياس قمامة — متينة",
    categoryId: "housekeeping", supplierId: "s2", unit: "Bag / 500 pcs", unitAr: "كيس / 500 قطعة",
    price: 310, moq: 5, leadDays: 2, stock: "in",
    img: px(7475383), alt: "Heavy-duty refuse sack",
    desc: "Black heavy-duty poly bags, 90×110 cm, for back-of-house and housekeeping carts.",
    descAr: "أكياس بولي أسود متينة 90×110 سم، للخلفية وعربات النظافة.",
    specs: [
      { k: "Size", kAr: "المقاس", v: "90×110 cm" },
    ],
  },

  // ---- Amenities (s2 / s3)
  {
    id: "p13", sku: "AM-3001", name: "Guest Room Amenity Set", nameAr: "طقم مستلزمات الغرفة",
    categoryId: "amenities", supplierId: "s2", unit: "Set of 5", unitAr: "طقم من 5",
    price: 128, moq: 50, leadDays: 4, stock: "in",
    img: px(8015784), alt: "White amenity pump bottles and sponge",
    desc: "Shampoo, conditioner, body wash, soap and lotion in 30–50 ml refillable dispensers. Private label available.",
    descAr: "شامبو وبلسم وغسول وصابون ولوشن في عبوات 30–50 مل قابلة للتعبئة. تسمية خاصة متاحة.",
    specs: [
      { k: "Set", kAr: "المحتوى", v: "5 items" },
      { k: "Label", kAr: "التسمية", v: "Private label" },
    ],
  },
  {
    id: "p14", sku: "AM-3002", name: "In-Room Slippers", nameAr: "أحذية داخلية للغة",
    categoryId: "amenities", supplierId: "s2", unit: "Box / 100 pairs", unitAr: "كرتونة / 100 زوج",
    price: 1850, moq: 2, leadDays: 6, stock: "low",
    img: px(8899500), alt: "Soft in-room slippers",
    desc: "Non-slip in-room slippers, sizes 38–45 mix, individually poly-bagged. Hotel-embroidered.",
    descAr: "أحذية داخلية مانعة للانزلاق، مقاسات 38–45، مغلفة فردياً. مطرزة باسم الفندق.",
    specs: [
      { k: "Sizes", kAr: "المقاسات", v: "38–45 mix" },
    ],
  },
  {
    id: "p15", sku: "AM-3003", name: "Welcome Water 330 ml", nameAr: "مياه ترحيب 330 مل",
    categoryId: "amenities", supplierId: "s3", unit: "Case / 12", unitAr: "كرتونة / 12",
    price: 340, moq: 10, leadDays: 3, stock: "in",
    img: px(593099), alt: "Premium mineral water bottle with condensation",
    desc: "Premium still water 330 ml for guest-room welcome. Printed label to hotel identity.",
    descAr: "مياه فاخرة 330 مل لترحيب بالغرف. تصميم مطبوع بهوية الفندق.",
    specs: [
      { k: "Volume", kAr: "الحجم", v: "330 ml" },
    ],
  },
  {
    id: "p16", sku: "AM-3004", name: "Artisan Soap Bar", nameAr: "صابون حرفي",
    categoryId: "amenities", supplierId: "s3", unit: "Box / 24", unitAr: "كرتونة / 24",
    price: 960, moq: 4, leadDays: 5, stock: "in",
    img: px(6690863), alt: "Assorted handmade soap bars on marble",
    desc: "Cold-process artisan soap, jasmine & cedar base, individually wax-sealed. SPA and suite grade.",
    descAr: "صابون مصنّع بارداً، قاعدة ياسمين وخشب الأرز، مختوم فردياً. جودة السبا والأجنحة.",
    specs: [
      { k: "Scent", kAr: "الرائحة", v: "Jasmine & cedar" },
    ],
  },

  // ---- Engineering (s3)
  {
    id: "p17", sku: "EN-4001", name: "LED Bulb A60", nameAr: "لمبة LED A60",
    categoryId: "engineering", supplierId: "s3", unit: "Box / 100", unitAr: "كرتونة / 100",
    price: 2900, moq: 2, leadDays: 4, stock: "in",
    img: px(36290332), alt: "Collection of energy-efficient LED bulbs",
    desc: "A60 LED 12 W, 4000 K, E27. 50,000 h rated, hotel-grade dimming compatibility.",
    descAr: "LED A60 بقوة 12 واط، 4000 كلفن، E27. عمر 50,000 ساعة ومتوافقة مع الخفوت.",
    specs: [
      { k: "Watt", kAr: "القدرة", v: "12 W" },
      { k: "Life", kAr: "العمر", v: "50,000 h" },
    ],
  },
  {
    id: "p18", sku: "EN-4002", name: "HVAC Air Filter", nameAr: "فلتر تكييف",
    categoryId: "engineering", supplierId: "s3", unit: "Bag / 50", unitAr: "كيس / 50",
    price: 2200, moq: 1, leadDays: 4, stock: "in",
    img: px(29452977), alt: "Industrial HVAC unit",
    desc: "Pleated MERV-8 filters 590×590×48 for AHUs and VRF units. Standard fit for Egyptian AHU stock.",
    descAr: "فلتورات مطوية MERV-8 بمقاس 590×590×48 لوحدات AHU وVRF. مقاس قياسي.",
    specs: [
      { k: "Rating", kAr: "التصنيف", v: "MERV-8" },
      { k: "Size", kAr: "المقاس", v: "590×590×48" },
    ],
  },
  {
    id: "p19", sku: "EN-4003", name: "Water Heater Element 4500 W", nameAr: "عنصر تسخين 4500 واط",
    categoryId: "engineering", supplierId: "s3", unit: "Unit", unitAr: "قطعة",
    price: 1150, moq: 4, leadDays: 5, stock: "in",
    img: px(34938439), alt: "Technician servicing a heating system",
    desc: "Replacement immersion element, 4500 W 220 V, 4.6 cm threads. Fits common hotel storage-tank models.",
    descAr: "عنصر غمر بديل 4500 واط 220 فولت. يناسب أغلب خزانات الفنادق الشائعة.",
    specs: [
      { k: "Power", kAr: "القدرة", v: "4500 W" },
    ],
  },
  {
    id: "p20", sku: "EN-4004", name: "Fire Extinguisher 4 kg", nameAr: "طفاية حريق 4 كجم",
    categoryId: "engineering", supplierId: "s3", unit: "Unit", unitAr: "قطعة",
    price: 1950, moq: 4, leadDays: 3, stock: "in",
    img: px(19107333), alt: "Red fire extinguisher mounted on a wall",
    desc: "ABC dry-powder 4 kg extinguisher with pressure gauge, bracket and annual-service sticker. Civil-defense compliant.",
    descAr: "طفاية بودرة جافة ABC 4 كجم مع مؤشر وضفيرة وملصق الصيانة السنوية. مطابقة للدفاع المدني.",
    specs: [
      { k: "Type", kAr: "النوع", v: "ABC 4 kg" },
      { k: "Compliance", kAr: "الامتثال", v: "Civil defense" },
    ],
  },
  {
    id: "p21", sku: "EN-4005", name: "Boiler Gasket Kit", nameAr: "طقم حشائش الغلاية",
    categoryId: "engineering", supplierId: "s3", unit: "Kit", unitAr: "طقم",
    price: 780, moq: 3, leadDays: 5, stock: "low",
    img: px(11942508), alt: "Metal gasket rings and pipe fittings",
    desc: "Full gasket and seal kit for 1996-series hotel boilers. Heat-resistant to 220 °C.",
    descAr: "طقم حشائش وأختام كامل لسلسلة غلايات الفنادق 1996. يتحمل 220 درجة.",
    specs: [
      { k: "Max temp", kAr: "الحد الأقصى", v: "220 °C" },
    ],
  },
  {
    id: "p22", sku: "EN-4006", name: "Wall Hand-Wash Dispenser", nameAr: "صرف غسول جدران",
    categoryId: "engineering", supplierId: "s3", unit: "Unit", unitAr: "قطعة",
    price: 640, moq: 6, leadDays: 4, stock: "in",
    img: px(3761560), alt: "Chrome soap dispenser beside a basin",
    desc: "Stainless wall dispenser for gel, 600 ml visible bottle. Break-free mounting for guest bathrooms.",
    descAr: "صرف جداري من الستانلس لغسول الجل 600 مل. تثبيت متين لدورات الضيوف.",
    specs: [
      { k: "Capacity", kAr: "السعة", v: "600 ml" },
    ],
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id);
export const hotelById = (id: string) => HOTELS.find((h) => h.id === id);
export const carrierById = (id: string) => CARRIERS.find((c) => c.id === id);
export const partnerById = (id: string) => PARTNERS.find((p) => p.id === id);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);

export const VAT_RATE = 0.14;
