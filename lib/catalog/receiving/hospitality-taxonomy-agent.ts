import taxonomy from "@/data/staging/hospitality-procurement-subtaxonomy.v1.json";
import type { RawCatalogObservation, TaxonomyDecision } from "./types";

export const HOSPITALITY_TAXONOMY_AGENT_VERSION = "hv-horeca-taxonomy-rules-v1";
type Rule = { root: string; sub: string; pattern: RegExp };

const RULES: Rule[] = [
  {root:"SAFETY_SECURITY",sub:"FIRE_SAFETY",pattern:/\b(fire extinguisher|fire blanket|fire alarm|smoke detector|sprinkler|fire hose)\b/i},
  {root:"SAFETY_SECURITY",sub:"FIRST_AID",pattern:/\b(first aid|medical kit|eye wash|bandage|defibrillator)\b/i},
  {root:"SAFETY_SECURITY",sub:"SECURITY_SYSTEMS",pattern:/\b(cctv|surveillance camera|security camera|nvr|dvr|guard tour)\b/i},
  {root:"SAFETY_SECURITY",sub:"ACCESS_CONTROL",pattern:/\b(access control|door lock|electronic lock|key card encoder|card reader)\b/i},
  {root:"SAFETY_SECURITY",sub:"COMPLIANCE_PPE",pattern:/\b(safety helmet|hard hat|safety goggles|safety glove|reflective vest|safety boot|ppe)\b/i},
  {root:"SAFETY_SECURITY",sub:"EMERGENCY_RESPONSE",pattern:/\b(emergency light|evacuation|exit sign|rescue|emergency shower)\b/i},
  {root:"ICT_AV",sub:"NETWORKING",pattern:/\b(router|wi-?fi|wireless access point|network switch|ethernet|network cable|firewall)\b/i},
  {root:"ICT_AV",sub:"GUEST_ROOM_TECH",pattern:/\b(hotel tv|smart tv|television|in-room tablet|guest room phone|room control panel)\b/i},
  {root:"ICT_AV",sub:"AUDIO_VISUAL",pattern:/\b(projector|speaker|microphone|audio|amplifier|conference display|av system)\b/i},
  {root:"ICT_AV",sub:"POS_PERIPHERALS",pattern:/\b(point of sale|pos terminal|barcode scanner|receipt printer|cash drawer)\b/i},
  {root:"ICT_AV",sub:"BACK_OFFICE_HARDWARE",pattern:/\b(laptop|desktop computer|server|printer|monitor|workstation)\b/i},
  {root:"UNIFORMS",sub:"KITCHEN_UNIFORMS",pattern:/\b(chef jacket|chef coat|chef trouser|kitchen uniform|chef apron)\b/i},
  {root:"UNIFORMS",sub:"HOUSEKEEPING_UNIFORMS",pattern:/\b(housekeeping uniform|room attendant uniform|cleaning uniform)\b/i},
  {root:"UNIFORMS",sub:"FRONT_OFFICE",pattern:/\b(front desk uniform|reception uniform|concierge uniform)\b/i},
  {root:"UNIFORMS",sub:"SERVICE_UNIFORMS",pattern:/\b(waiter uniform|service uniform|restaurant uniform|bar uniform)\b/i},
  {root:"UNIFORMS",sub:"ENGINEERING_UNIFORMS",pattern:/\b(maintenance uniform|engineering uniform|workwear)\b/i},
  {root:"UNIFORMS",sub:"FOOTWEAR_PPE",pattern:/\b(work shoe|safety shoe|kitchen shoe|non.?slip shoe|safety boot)\b/i},
  {root:"ENGINEERING_MRO",sub:"HVAC_PARTS",pattern:/\b(hvac|air conditioner|air conditioning|compressor|thermostat|air filter|fan coil|refrigerant)\b/i},
  {root:"ENGINEERING_MRO",sub:"ELECTRICAL_LIGHTING",pattern:/\b(circuit breaker|electrical cable|wire|switchgear|socket|led lamp|light fixture|bulb|transformer)\b/i},
  {root:"ENGINEERING_MRO",sub:"PLUMBING",pattern:/\b(plumbing|pipe fitting|valve|faucet|tap|shower mixer|drain|toilet cistern)\b/i},
  {root:"ENGINEERING_MRO",sub:"DOOR_HARDWARE",pattern:/\b(hinge|door closer|door handle|lockset|door hardware)\b/i},
  {root:"ENGINEERING_MRO",sub:"TOOLS_FASTENERS",pattern:/\b(power tool|drill|wrench|screwdriver|fastener|bolt|nut|screw|tool kit)\b/i},
  {root:"ENGINEERING_MRO",sub:"PAINTS_FINISHES",pattern:/\b(paint|primer|sealant|adhesive|grout|varnish|wall coating)\b/i},
  {root:"ENGINEERING_MRO",sub:"WATER_SYSTEMS",pattern:/\b(water pump|water filter|filter cartridge|water treatment|water softener|booster pump)\b/i},
  {root:"ENGINEERING_MRO",sub:"POOL_SPA_MAINTENANCE",pattern:/\b(pool pump|pool filter|pool chemical|chlorine|spa maintenance|sauna heater)\b/i},
  {root:"ENGINEERING_MRO",sub:"KITCHEN_MAINTENANCE",pattern:/\b(kitchen spare part|oven element|fryer basket|dishwasher part|commercial kitchen spare)\b/i},
  {root:"ENGINEERING_MRO",sub:"BUILDING_REPAIR",pattern:/\b(building repair|gypsum|ceiling tile|floor tile|wall panel|building material)\b/i},
  {root:"FFE",sub:"GUEST_ROOM_FURNITURE",pattern:/\b(wardrobe|nightstand|bedside table|guest room desk|headboard|room chair)\b/i},
  {root:"FFE",sub:"LOBBY_PUBLIC_AREA",pattern:/\b(lobby sofa|reception desk|lounge chair|lobby furniture|public area seating)\b/i},
  {root:"FFE",sub:"RESTAURANT_FURNITURE",pattern:/\b(restaurant table|dining chair|banquette|bar stool|restaurant furniture)\b/i},
  {root:"FFE",sub:"OUTDOOR_FURNITURE",pattern:/\b(outdoor furniture|garden chair|pool lounger|sunbed|patio table)\b/i},
  {root:"FFE",sub:"WINDOW_TREATMENTS",pattern:/\b(curtain|drape|blackout blind|roller blind|window treatment)\b/i},
  {root:"FFE",sub:"DECORATIVE_LIGHTING",pattern:/\b(chandelier|decorative lamp|floor lamp|pendant light|decorative lighting)\b/i},
  {root:"FFE",sub:"SIGNAGE_WAYFINDING",pattern:/\b(signage|wayfinding|directional sign|room number sign|door sign)\b/i},
  {root:"FFE",sub:"OPERATIONS_FURNITURE",pattern:/\b(storage rack|filing cabinet|office desk|workbench|service station)\b/i},
  {root:"FFE",sub:"MATTRESSES_BEDS",pattern:/\b(mattress|bed frame|hotel bed|box spring|bed base)\b/i},
  {root:"FFE",sub:"FLOOR_WALL_FINISHES",pattern:/\b(carpet|vinyl flooring|wallpaper|floor finish|wall finish)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"CLEANING_CHEMICALS",pattern:/\b(detergent|disinfectant|sanitizer|degreaser|glass cleaner|floor cleaner|bleach|descaler)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"LAUNDRY_CHEMICALS",pattern:/\b(laundry detergent|laundry bleach|fabric softener|laundry sour|laundry chemical)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"LAUNDRY_EQUIPMENT",pattern:/\b(washing machine|washer extractor|tumble dryer|laundry dryer|ironer|flatwork ironer|laundry press)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"HOUSEKEEPING_CARTS",pattern:/\b(housekeeping trolley|housekeeping cart|janitorial cart|maid cart|linen trolley)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"WASTE_MANAGEMENT",pattern:/\b(waste bin|garbage bin|trash bin|waste container|waste bag|recycling bin)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"PEST_CONTROL",pattern:/\b(pest control|insect trap|rodent bait|fly killer|mosquito trap)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"CLEANING_PPE",pattern:/\b(cleaning glove|rubber glove|protective apron|cleaning mask|chemical resistant glove)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"FLOOR_CARE",pattern:/\b(floor scrubber|floor polisher|carpet extractor|vacuum cleaner|floor pad|floor machine)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"WASHROOM_CARE",pattern:/\b(toilet paper|jumbo roll|hand towel dispenser|washroom dispenser|paper hand towel|urinal mat)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"CLEANING_TOOLS",pattern:/\b(mop|broom|squeegee|scrub brush|dustpan|cleaning brush|microfiber cloth)\b/i},
  {root:"HOUSEKEEPING_LAUNDRY",sub:"LINEN_TEXTILES",pattern:/\b(bed sheet|bedsheet|pillowcase|duvet cover|bath towel|hand towel|bathrobe|tablecloth|linen|napkin|mattress protector)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"BATHROOM_AMENITIES",pattern:/\b(shampoo|conditioner|body wash|shower gel|soap bar|toothbrush|dental kit|shower cap|vanity kit|body lotion)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"BEDDING_LINEN",pattern:/\b(pillow|duvet|blanket|bedspread|pillow protector|bed linen|bed runner)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"BATH_LINEN",pattern:/\b(bath towel|bath mat|bathrobe|face towel|pool towel|guest towel)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"IN_ROOM_BEVERAGE",pattern:/\b(kettle|coffee sachet|tea bag|in.?room coffee|mini bar water|beverage tray)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"GUEST_ROOM_ACCESSORIES",pattern:/\b(hanger|luggage rack|shoe horn|laundry bag|minibar tray|room accessory|waste basket)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"GUEST_ROOM_ELECTRICAL",pattern:/\b(hair dryer|hairdryer|room kettle|bedside clock|iron and board|guest room electrical)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"GUEST_ROOM_SAFETY",pattern:/\b(room safe|in.?room safe|door viewer|guest room smoke alarm)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"ROOM_SERVICE_PRESENTATION",pattern:/\b(room service tray|room service trolley|cloche|serving tray|in.?room dining)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"ACCESSIBILITY_SUPPLIES",pattern:/\b(grab bar|shower chair|accessible bathroom|mobility aid|accessible room)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"GUEST_PRINTED_MATERIALS",pattern:/\b(do not disturb|dnd sign|welcome book|guest directory|door hanger|laundry list)\b/i},
  {root:"GUEST_ROOMS_AMENITIES",sub:"REFILL_SYSTEMS",pattern:/\b(refill dispenser|wall mounted dispenser|amenity dispenser|bulk soap dispenser)\b/i},
  {root:"FOOD_BEVERAGE",sub:"KITCHEN_EQUIPMENT",pattern:/\b(dishwasher|fryer|combi oven|convection oven|commercial oven|grill|refrigerator|freezer|ice maker|coffee machine|espresso machine|commercial mixer)\b/i},
  {root:"FOOD_BEVERAGE",sub:"BUFFET_BANQUETING",pattern:/\b(chafing dish|chafer|buffet|banquet|serving station|food warmer|carving station)\b/i},
  {root:"FOOD_BEVERAGE",sub:"BAR_OPERATIONS",pattern:/\b(cocktail shaker|jigger|wine opener|bar tool|bar equipment|ice bucket|bar strainer)\b/i},
  {root:"FOOD_BEVERAGE",sub:"TABLE_SERVICE",pattern:/\b(porcelain|chinaware|crockery|glassware|cutlery|flatware|plate|bowl|cup and saucer|tumbler|wine glass)\b/i},
  {root:"FOOD_BEVERAGE",sub:"FOOD_PACKAGING",pattern:/\b(food container|takeaway|take.?away|packaging|microwave tray|foil container|cling film|paper cup|disposable tray|carton)\b/i},
  {root:"FOOD_BEVERAGE",sub:"HYGIENE_CONSUMABLES",pattern:/\b(food safe glove|food grade sanitizer|kitchen tissue|kitchen towel|food hygiene)\b/i},
  {root:"FOOD_BEVERAGE",sub:"BAKERY_PASTRY",pattern:/\b(bakery|pastry|croissant|bread|cake|bakery oven|dough sheeter|proofer)\b/i},
  {root:"FOOD_BEVERAGE",sub:"KITCHEN_SMALLWARE",pattern:/\b(chef knife|knife set|saucepan|stock pot|frying pan|chopping board|kitchen utensil|ladle|tongs)\b/i},
  {root:"FOOD_BEVERAGE",sub:"CHILLED_FROZEN",pattern:/\b(frozen|chilled|beef|angus|chicken|poultry|fish|salmon|seafood|shrimp|dairy|cheese|butter|frozen vegetable)\b/i},
  {root:"FOOD_BEVERAGE",sub:"BEVERAGES",pattern:/\b(mineral water|juice|soft drink|coffee bean|tea leaf|syrup|beverage|drink)\b/i},
  {root:"FOOD_BEVERAGE",sub:"DRY_GOODS",pattern:/\b(rice|flour|sugar|salt|spice|pasta|grain|canned|olive oil|cooking oil|sauce|condiment|legume|dry goods)\b/i},
];

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
function titleCase(value: string): string {
  return value.toLocaleLowerCase("en").replace(/\b[a-z]/g, (letter) => letter.toUpperCase()).replace(/_/g, " ");
}
function normalizeUnit(value: string | null | undefined): string | null {
  const unit = clean(value).toLocaleLowerCase("en");
  if (!unit) return null;
  if (/^(kg|kilo|kilogram|kilograms)$/.test(unit)) return "kg";
  if (/^(g|gm|gram|grams)$/.test(unit)) return "g";
  if (/^(l|lt|liter|litre|liters|litres)$/.test(unit)) return "L";
  if (/^(ml|milliliter|millilitre|milliliters|millilitres)$/.test(unit)) return "ml";
  if (/^(pc|pcs|piece|pieces|unit|units)$/.test(unit)) return "piece";
  if (/^(pack|packs)$/.test(unit)) return "pack";
  if (/^(case|cases|carton|cartons)$/.test(unit)) return "case";
  if (/^(roll|rolls)$/.test(unit)) return "roll";
  if (/^(set|sets)$/.test(unit)) return "set";
  if (/^(pair|pairs)$/.test(unit)) return "pair";
  if (/^(box|boxes)$/.test(unit)) return "box";
  return clean(value);
}
function observedPackUnit(record: RawCatalogObservation): string | null {
  const explicit = normalizeUnit(record.unitOfMeasure) ?? normalizeUnit(record.purchaseUnit);
  if (explicit) return explicit;
  const pack = clean(record.packSize) + " " + clean(record.name);
  const match = /\b(kg|kilograms?|g|grams?|ml|millilit(?:er|re)s?|lit(?:er|re)s?|pieces?|pcs?|packs?|cases?|cartons?|rolls?|sets?|pairs?|boxes?)\b/i.exec(pack);
  return match ? normalizeUnit(match[1]) : null;
}
function buildDescription(record: RawCatalogObservation, root: string, subcategory: string, normalizedName: string, packSize: string | null, unit: string | null): string {
  // Retain the observed description for administrator review and rewriting;
  // do not replace a real product description with a generic AI sentence.
  const observed = clean(record.description).replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
  if (observed) return observed.slice(0, 1500);
  const bits = [normalizedName + "."];
  if (packSize) bits.push("Observed pack specification: " + packSize + ".");
  if (unit) bits.push("Observed unit: " + unit + ".");
  bits.push("Hospitality category: " + titleCase(root) + " / " + titleCase(subcategory) + ".");
  return bits.join(" ");
}

/** Subagent 2: map a product to the controlled hospitality taxonomy. */
export function runHospitalityTaxonomyAgent(record: RawCatalogObservation): TaxonomyDecision {
  const text = [record.name, record.description, record.category, record.brand, record.packSize].map(clean).join(" ");
  const matched = RULES.find((rule) => rule.pattern.test(text));
  const normalizedName = clean(record.name).replace(/[|•]+/g, " ").replace(/\s+/g, " ").replace(/\s+[-–—]\s*$/g, "").trim();
  const unit = observedPackUnit(record);
  const purchaseUnit = clean(record.purchaseUnit) || clean(record.packSize) || null;
  const specs: Record<string, string | number> = {};
  if (clean(record.brand)) specs.brand = clean(record.brand);
  if (clean(record.packSize)) specs.packSize = clean(record.packSize);
  if (clean(record.sku)) specs.sourceSku = clean(record.sku);
  if (unit) specs.observedUnit = unit;
  for (const [key, value] of Object.entries(record.attributes ?? {})) {
    if ((typeof value === "string" || typeof value === "number") && !/(supplier|vendor|contact|phone|email|price|stock|availability)/i.test(key)) specs[key] = value;
  }
  if (!matched) {
    return {
      status: "REVIEW_REQUIRED", categoryCode: null, subcategoryCode: null,
      normalizedName,
      normalizedDescription: "Hospitality product reference requires category review. No price, stock, supplier offer or availability is implied.",
      unitOfMeasure: unit, purchaseUnit, specifications: specs,
      reasons: ["No sufficiently specific hospitality taxonomy rule matched the observed product facts."],
    };
  }
  return {
    status: "MAPPED",
    categoryCode: matched.root,
    subcategoryCode: matched.sub,
    normalizedName,
    normalizedDescription: buildDescription(record, matched.root, matched.sub, normalizedName, clean(record.packSize) || null, unit),
    unitOfMeasure: unit,
    purchaseUnit,
    specifications: specs,
    reasons: ["Mapped using observed product terms to " + matched.root + "/" + matched.sub + "."],
  };
}

export const HOSPITALITY_TAXONOMY_AGENT_RULE_COUNT = RULES.length;
export const HOSPITALITY_TAXONOMY_ROOT_CODES = taxonomy.categories.map((category) => category.code);
