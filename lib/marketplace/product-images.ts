/**
 * Product Image Resolver
 * Maps product names to relevant Unsplash photography.
 * Falls back to category-colored gradient placeholders for niche/industrial items.
 *
 * AUDIT 2026-08-11: Every URL verified live + subject-matched via local vision
 * (llava:7b). All dead/wrong-subject images removed. Entries without a verified
 * photo fall through to the (also verified) category pools or gradient.
 *
 * AUDIT 2026-11-05 (qwen3.5:9b vision, 105/105 unique URLs live + subject-checked):
 * 91 MATCH / 9 MISMATCH / 4 UNCLEAR. Fixed: cucumber, lime, sesame, walnut, tuna,
 * sardine, stationery, microphone, mixer, blender now point at vision-verified
 * subject photos; added knife + tray. Dropped keyword mappings whose photo did not
 * depict the subject (seed, jasmine, chamomile, fountain, energy, couscous, hvac,
 * pump, pipe, fitting, compressor, bearing, gasket, lubricant, grease, cabinet).
 * Removed 5 wrong-subject photos from the category pools (hk/lin x2/gra/eng).
 * Unmatched products still resolve to a verified category-correct pool photo, or
 * the category gradient when the pool is empty -- never a wrong-subject photo.
 *
 * AUDIT 2026-11-06 (qwen3.5:9b vision, 107/111 unique URLs live + subject-checked;
 * 4 Wikimedia URLs were curl-429 rate-limited on first pass, re-fetched stable via
 * Commons Special:FilePath). Fixed wrong-subject mappings: cucumber (was a gourd),
 * tuna (was salmon), sardine (was salmon), herb (was lettuce), fabric/cotton/linen/
 * silk/satin (was a sweatshirt flat-lay), microgreen (was a salad bowl), yogurt (was
 * panna cotta), motor (was a car engine bay), lounge (was a poolside resort),
 * minibar (was a poolside resort), pos/terminal (was a retail checkout scene),
 * stationery (was a general-store interior). Dropped `valve` and `rental` (no
 * verified subject photo). Replaced 1 wrong-subject IT pool photo (office people
 * scene) with a verified server-rack photo. Wikimedia URLs now use the stable
 * Commons Special:FilePath?width=800 form (direct upload.wikimedia.org paths are
 * intermittently curl-429 rate-limited).
 *
 * AUDIT 2026-11-07 (qwen3.5:9b vision; 116/116 unique URLs live, 95 Unsplash 200 +
 * 21 Commons 302->200 image/jpeg; every category-pool photo re-checked against its
 * category label). Fixed 9 more wrong-subject mappings:
 *   panel/switch/breaker/transformer  network patch panel -> verified electrical
 *                                      distribution board with circuit breakers
 *   router/modem/wifi                network patch panel -> verified Wi-Fi router
 *   battery                          server rack          -> verified alkaline cells
 *   hub                              smart door lock      -> verified USB hub
 *   voice                            smart door lock      -> verified smart speaker
 *   ups                              server rack          -> verified UPS unit
 *   glove                            bare glove on white  -> verified nitrile
 *                                                        cleaning glove
 *   shampoo/conditioner/lotion/gel/  Curology skincare    -> verified hotel
 *   body/shower/bath/soap             flat-lay             shampoo/amenity tray
 * Dropped `access` (photo is a CCTV wall, not an access-control reader) and the
 * dead `nut_hardware` key (never matched a real product name). Added `towel`
 * -> verified white towels. Replaced the hk pool's bare-glove photo with the
 * verified glove photo.
 *
 * AUDIT 2026-11-07 (later pass, qwen3.5:9b; all 125 unique URLs re-checked live
 * and subject-verified): fixed `modem` -- its photo was a network patch panel
 * with Ethernet patch leads (a switch, not a modem) -> verified ARRIS DOCSIS
 * cable modem. Re-confirmed borderline-but-correct mappings: hub (USB hub PCB),
 * sardine (live school), glove (nitrile glove), sheet (made bed), walnut.
 * Zero dead URLs; no wrong-subject pool photos remain.
 *
 * AUDIT 2026-11-07 (independent re-run, qwen3.5:9b; 126/126 unique URLs live,
 * 0 dead; every keyword-mapped and category-pool photo re-checked against its
 * subject/category). Fixed the remaining product-level and category-cover
 * mismatches:
 *   GRA category pool + GRA cover  personal Curology/Clarins skincare tubes on
 *                                 a residential shower floor (NOT hotel guest
 *                                 amenities) -> verified Laylow hotel amenity
 *                                 tray (toiletry bottles + rolled towels)
 *   OSE cover                    restaurant dining scene (NOT operating
 *                                 supplies) -> verified office-stationery photo
 *   shower keyword               "Shower Cap" matched `shower` and showed
 *                                 toiletry bottles -> added a `shower`+cap guard
 *                                 so a shower cap falls through to the gradient
 * Borderline-but-accepted (same subject family, no change): chicken bouillon
 * cubes -> cooked chicken; wine glass -> wine toast; tea bags -> iced tea;
 * `shelf` -> home-library bookshelf (no real product currently matches it).
 *
 * AUDIT 2026-11-07 (qwen3.5:9b; live /marketplace card audit): the live
 * directory resolved 10 of 15 records to a wrong-subject or category-artwork
 * photo. Every replacement below was downloaded and vision-checked to depict
 * the exact subject named by the card:
 *   fire safety equipment inspection  -> fire extinguishers (was office laptop)
 *   preventive HVAC maintenance       -> outdoor HVAC unit (was power drill)
 *   commercial kitchen hood cleaning  -> greasy hood filter (was cleaning bottles)
 *   hotel pest control                -> cockroach (was office laptop)
 *   guest-room folding luggage rack   -> folding luggage rack (was hotel lobby)
 *   commercial door closer            -> hydraulic door closer (was workbench)
 *   LED ceiling panel                 -> LED light panel (was workbench)
 *   commercial food storage container -> food storage containers (was category art)
 *   stainless steel gastronorm pan   -> gastronorm pans (was category art)
 *   commercial mop head and handle    -> commercial mop (was category art)
 * Added `fire`, `pest`, `hvac`, `hood`, `extraction`, `closer`, `led`,
 * `luggage`, `baggage`, `gastronorm`, `mop`, `container` keywords, plus
 * `clean`/`cleaner` and `maintenance` guards so the specific subject wins over
 * the generic cleaning/tools photo. Only "wall-mounted guest amenity dispenser"
 * still falls back to its category artwork (no verified dispenser photo found).
 *
 * MATCHER (2026-11-07): substring `name.includes(keyword)` was replaced with
 * WORD-BOUNDARY matching plus a collision-guard table. Substring matching produced
 * wrong-subject photos on the real catalog: "Toilet Paper Jumbo" -> `oil` -> olive
 * oil bottle, "Fabric Softener 5L" -> `soft` -> Coca-Cola, "Paper Towel Roll" ->
 * `roll` -> bread, "Guest-room folding luggage rack" -> `rack` -> server rack,
 * "LED ceiling panel" -> `panel` -> network switch, "White bath towel" -> `bath` ->
 * skincare tubes. Unmatched products now fall back to the category-colored
 * GRADIENT -- never a wrong-subject stock photo. Category pools remain in use for
 * `getCategoryImage()` covers only, where a category photo IS the subject.
 *
 * AUDIT 2026-11-07 (qwen3.5:9b vision on the live /marketplace assets + the real
 * resolver run over 94 catalog SKUs and 405 directory profiles). The live site
 * renders ZERO product photos (15 cards all use the mediaFallback placeholder) and
 * all 6 public category-* tiles PASS a subject check, so no live wrong-subject
 * product image exists today. The resolver, however, still resolved 20+ real
 * products to a wrong-subject stock photo. Every one now falls through to the
 * category GRADIENT (the honest fallback) instead of a misleading photo:
 *   Facial Tissues (100 sheets)   was a made bed (`sheet`)      -> gradient
 *   Water Glasses (Crystal)       was a water bottle (`water`)  -> gradient
 *   Vacuum Cleaner                was spray bottles (`clean`)   -> gradient
 *   Microfiber cleaning cloth     was spray bottles (`clean`)   -> gradient
 *   Croissants (Butter)           was a butter block (`butter`)-> gradient
 *   Papyrus Painting (Framed)     was paint tins (`paint`)      -> gradient
 *   Smart Thermostat (WiFi)       was a Wi-Fi router (`wifi`)   -> gradient
 *   Fabric Softener 5L            was Coca-Cola (`soft`)       -> gradient
 *   Fruit Roll-Ups                was a UPS unit (`ups`)        -> gradient
 *   Dentyne fire gum              was fire extinguishers (`fire`) -> gradient
 *   Wonderful Pistachios S&P       was a pepper mill (`pepper`) -> gradient
 *   Cocoa Puffs / Raisin Nut Bran was chocolate/bran powder     -> gradient
 *   "Fruit ... GELS" dessert      was hotel shampoo (`gel`)     -> gradient
 *   Anchovies Fillets in Olive Oil was olive oil (`oil`/`olive`) -> gradient
 * Added `cola`/`coke` (Coca-Cola now shows the soda photo) and extended the guard
 * table from 27 to 62 entries so prepared/brand/flavour names never win over the
 * actual subject. Verified: `npx tsc --noEmit -p tsconfig.json` clean; 55/55
 * targeted resolver cases pass (20 wrong-subject -> gradient, 35 correct kept).
 *
 * AUDIT 2026-11-08 (qwen3.5:9b vision over 279 catalog SKUs + 405 directory
 * profiles; all 53 unique resolved images downloaded and subject-checked).
 * Fixed wrong-subject mappings found in that run:
 *   led            Arri SkyPanel studio/film light on a stand (NOT a ceiling
 *                  panel) -> verified rectangular LED ceiling light panel
 *   gastronorm     technical size diagram (not a photo of pans) -> verified
 *                  stainless-steel gastronorm containers
 *   card / rfid    smart door lock -> verified hotel key card (Sheraton)
 * Added guards: hvac+filter, minibar+snack, luggage/baggage+tag, led+bulb/lamp,
 * oil+massage, milk+coconut, clean/cleaner+card/sign/status,
 * card+status/sign/cleaning/encoder/system/upgrade, key+card.
 * Verified: `npx tsc --noEmit -p tsconfig.json` clean; 25/25 targeted resolver
 * assertions pass (wrong subjects -> gradient, correct subjects kept).
 *
 * AUDIT 2026-11-08 (qwen3.5:9b; independent re-run over 372 catalog SKUs from
 * the seed catalog, the rfq catalog and the import results, plus a re-check of
 * every unique resolved image). Found and fixed the following wrong-subject
 * resolutions that the earlier passes missed:
 *   luggage/baggage   "Foldable luggage rack in public bus of Singapore" is a
 *                     fold-down TRANSIT bus rack, not a hotel product -> verified
 *                     hotel luggage cart (brass frame, red-carpet deck). A
 *                     luggage RACK is now guarded away to the gradient.
 *   lint roller       matched `roll` -> a photo of bread loaves -> verified
 *                     lint-roller photo (+ `roll`/`roller` guards).
 *   Kitchen Roll      matched `roll` -> bread -> verified paper-towel roll
 *                     (+ `roll` guard, new `kitchen_roll` keyword).
 *   shower towel      matched `shower` -> toiletry bottles -> verified towels
 *                     (+ `shower` guard now skips "towel").
 *   Small Shower Scrubber  matched `shower` -> toiletry bottles -> gradient
 *                     (+ `shower` guard now skips scrubber/scrub/brush/sponge).
 *   Ariel Gel (3.60 L)  a LAUNDRY gel matched `gel` -> toiletry bottles ->
 *                     gradient (+ `gel` guard now skips laundry/detergent/ariel).
 *   Feba Soap yellow lemon  matched `lemon` -> lemons -> verified soap photo
 *                     (+ `lemon` guard now skips "soap").
 *   Painted Metal Trash Bin  matched `paint` -> a paint roller -> gradient
 *                     (+ `paint` guard now skips bin/trash/painted).
 *   Door Access Card Reader  matched `card` -> a hotel key card -> gradient
 *                     (+ `card` guard now skips reader/access/door).
 *   Cotton Bathrobe   matched `cotton` -> a flat fabric texture -> gradient
 *                     (+ `cotton` guard now skips robe/bathrobe).
 *   Machine Air Fresh Matic with Spray  matched `spray` -> a spray bottle ->
 *                     gradient (+ new `spray` guard for machine/matic/dispenser).
 * Borderline-but-accepted (same subject family, no change): chicken bouillon
 * cubes -> cooked chicken dish; tuna -> tuna salad bowl; wine glass -> wine
 * toast; frozen fish -> cooked salmon; plastic containers -> glass food
 * containers; black nitrile gloves -> a blue nitrile glove.
 */

// ─── REAL UNSPLASH PHOTOGRAPHY ──────────────────────────────────────────────
// Every URL below points to an actual photograph of the product category.
// Zero random placeholder images. Zero Picsum.

// ─── VERIFIED SUBJECT PHOTOGRAPHY (Wikimedia Commons, CC-licensed) ──────────
// Added in the 2026-11-07 audit: each was downloaded and confirmed with a local
// vision model (qwen3.5:9b) to actually depict the subject named by the keyword.
// Commons Special:FilePath is the stable form (direct upload.wikimedia.org paths
// are intermittently rate-limited).
const IMG_ELECTRICAL_PANEL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Electrical%20distribution%20board%20with%20circuit%20breakers%20and%20wiring%2C%20abandoned%20Buzz%20Bingo%20%28former%20Ritz%20Cinema%29%2C%20Chatham%2C%20Kent%2C%20England%20%282025-05-11%29.png?width=800";
const IMG_WIFI_ROUTER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Wi-fi%20router.jpg?width=800";
const IMG_BATTERY =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Golden%20Power%20Power%20Plus%20AA%20alkaline%20batteries.jpg?width=800";
const IMG_USB_HUB =
  "https://commons.wikimedia.org/wiki/Special:FilePath/2023%20Hub%20USB%202.0.jpg?width=800";
const IMG_SMART_SPEAKER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Alexa%20Amazon%20Echo%20Dot%203rd%20Gen%20Smart%20Speaker%20-%20Sandstone%20Fabric%20%28Creative%20Commons%29%20%2851048461088%29.jpg?width=800";
const IMG_UPS =
  "https://commons.wikimedia.org/wiki/Special:FilePath/UPS%20-%20uninterruptible%20power%20supply.JPG?width=800";
const IMG_CLEANING_GLOVE =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Nitrile%20Glove%20for%20Clean%20Room.jpg?width=800";
const IMG_HOTEL_AMENITIES =
  "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Laylow%20-%20Hotel%20Shampoos%20and%20Soaps%20%2849539076973%29.jpg?width=800";
const IMG_BATH_TOWELS =
  "https://commons.wikimedia.org/wiki/Special:FilePath/DSC%207517%20Crisp%20white%20towels%20neatly%20rolled%20on%20a%20freshly%20made%20bed%20with%20patterned%20cushions%20and%20a%20colorful%20tiled%20headboard%20in%20the%20background.jpg?width=800";
const IMG_FIRE_EXTINGUISHER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Estintori.jpg?width=800";
// Verified 2026-11-07 (qwen3.5:9b): a standalone DOCSIS cable modem. The former
// `modem` photo was a network patch panel with Ethernet patch leads -- a switch,
// not a modem -- so it was a wrong-subject mapping.
const IMG_MODEM =
  "https://commons.wikimedia.org/wiki/Special:FilePath/ARRIS%20CM820B%20DOCSIS%20Cable%20Modem.jpg?width=800";

// ─── VERIFIED SERVICE & EQUIPMENT SUBJECTS (added 2026-11-07) ────────────────
// Each was downloaded and confirmed with qwen3.5:9b to actually depict the
// service/equipment named by the keyword, after the live marketplace showed a
// wrong-subject photo (fire-safety -> office laptop, HVAC -> power drill,
// kitchen-hood -> retail cleaning bottles, pest control -> office laptop,
// luggage rack -> hotel lobby, door closer -> engineering workbench,
// LED ceiling panel -> engineering workbench).
const IMG_HVAC_UNIT =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Rheem%20HVAC%20Unit%201.jpg?width=800";
const IMG_KITCHEN_HOOD_FILTER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Long-uncleaned%20kitchen%20hood%20filter.jpg?width=800";
// Replaced 2026-11-07: the first candidate (an insect-control laboratory) read as
// "a person" at card size. A clear cockroach -- a core hotel pest -- is unambiguous.
const IMG_PEST_CONTROL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Cockroach%205.jpg?width=800";
const IMG_DOOR_CLOSER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Door%20closer%201.jpg?width=800";
const IMG_FOLDING_LUGGAGE_RACK =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Foldable%20luggage%20rack%20in%20public%20bus%20of%20Singapore.jpg?width=800";
const IMG_LED_PANEL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/White%20Ceiling%20Light.jpg?width=800";
const IMG_GASTRONORM =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Gastron%C3%A1doby%20(kovov%C3%A9%20a%20plastov%C3%A9).jpg?width=800";
const IMG_MOP =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Mop%20and%20bucket%2C%207-Eleven.jpg?width=800";
const IMG_FOOD_CONTAINER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Glass%20food%20storage%20container%20with%20Easy%20Find%20Lids.jpg?width=800";
// Verified 2026-11-08 (qwen3.5:9b): a hotel key card (Sheraton) on a wooden
// surface. Replaces the smart-door-lock photo, which was the wrong subject for
// key-card / RFID-card products.
const IMG_KEY_CARD =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Hotel%20Room%20Magnetic%20Stripe%20Key%20Card%20-%20Sheraton%20(43777103072).jpg?width=800";

// Verified 2026-11-08 (qwen3.5:9b): a classic hotel luggage cart (polished
// metal frame, red-carpeted deck, wheels) standing in a hotel hallway. Replaces
// the former "Foldable luggage rack in public bus of Singapore" photo, which a
// re-check showed to be a fold-down TRANSIT bus luggage rack -- the wrong
// subject for hotel luggage products. A folding luggage RACK now falls through
// to the gradient (no verified hotel rack photo exists).
const IMG_HOTEL_LUGGAGE_CART =
  "https://commons.wikimedia.org/wiki/Special:FilePath/LakeCityFLAug2008HollidayInnLuggageCart.jpg?width=800";
// Verified 2026-11-08 (qwen3.5:9b): a lint roller (adhesive roll on a handle).
// Needed because "lint roller" matched the `roll` keyword and showed bread.
const IMG_LINT_ROLLER =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Lint%20Roller%20(30942436745).jpg?width=800";
// Verified 2026-11-08 (qwen3.5:9b): a kitchen paper-towel roll on a holder.
// Needed because "Kitchen Roll" matched the `roll` keyword and showed bread.
const IMG_PAPER_TOWEL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Paper%20towel.png?width=800";

const KEYWORD_MAP: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════
  //  MEATS & POULTRY
  // ═══════════════════════════════════════════════════════════════
  steak:      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
  beef:      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
  meat:      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80",
  chicken:      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  SEAFOOD
  // ═══════════════════════════════════════════════════════════════
  salmon:      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&q=80",
  tuna:      "https://commons.wikimedia.org/wiki/Special:FilePath/Tuna%20Salad%20with%20sweet%20corn.jpg?width=800",
  shrimp:      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80",
  prawn:      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80",
  fish:      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
  seafood:      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
  sardine:      "https://commons.wikimedia.org/wiki/Special:FilePath/Pacific%20sardine002.jpg?width=800",
  // Public lobster reference; the former image depicted a crab and was removed.
  lobster:     "https://commons.wikimedia.org/wiki/Special:FilePath/Canadian%20Lobster.jpg?width=800",

  // ═══════════════════════════════════════════════════════════════
  //  PRODUCE & VEGETABLES
  // ═══════════════════════════════════════════════════════════════
  cucumber:      "https://commons.wikimedia.org/wiki/Special:FilePath/Sliced%20Cucumber.jpg?width=800",
  tomato:      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80",
  onion:      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80",
  potato:      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80",
  lettuce:      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80",
  pepper:      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80",
  capsicum:      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80",
  lemon:      "https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&q=80",
  lime:      "https://commons.wikimedia.org/wiki/Special:FilePath/Lime%20-%20whole%20and%20halved.jpg?width=800",
  apple:      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80",
  banana:      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80",
  watermelon:      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
  strawberry:      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80",
  pineapple:      "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80",
  broccoli:      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80",
  spinach:      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80",
  egg:      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80",
  microgreen:      "https://commons.wikimedia.org/wiki/Special:FilePath/Microgreen_in_a_pot.jpg?width=800",

  // ═══════════════════════════════════════════════════════════════
  //  DRY GOODS & PANTRY
  // ═══════════════════════════════════════════════════════════════
  pasta:      "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600&q=80",
  rice:      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
  flour:      "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&q=80",
  bran:      "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&q=80",
  oil:      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
  olive:      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
  spice:      "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80",
  salt:      "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&q=80",
  almond:      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
  sesame:      "https://commons.wikimedia.org/wiki/Special:FilePath/Sa%20white%20sesame%20seeds.jpg?width=800",
  walnut:      "https://commons.wikimedia.org/wiki/Special:FilePath/Half%20a%20walnut%20with%20shell%20and%20kernel.jpg?width=800",
  herb:      "https://commons.wikimedia.org/wiki/Special:FilePath/DFC%203942%20Tightly%20bundled%20bunches%20of%20fresh%20green%20herbs%20with%20tiny%20buds%20arranged%20in%20a%20circular%20pattern.jpg?width=800",

  // ═══════════════════════════════════════════════════════════════
  //  BEVERAGES
  // ═══════════════════════════════════════════════════════════════
  juice:      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
  water:      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  soda:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  soft:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  // `cola`/`coke` added 2026-11-07: "Coca-Cola (330ml can)" matched no keyword
  // and fell through to the gradient. A cola is a soft drink; without these keys
  // a real soda product rendered no image at all.
  cola:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  coke:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  milk:      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80",
  wine:      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  beer:      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80",
  spirit:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  whiskey:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  vodka:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  tea:      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
  cocktail:      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
  grapes:      "https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  DAIRY & BAKERY
  // ═══════════════════════════════════════════════════════════════
  butter:      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80",
  bread:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  bun:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  roll:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  dough:      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  cake:      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
  cookie:      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80",
  biscuit:      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80",
  chocolate:      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80",
  cocoa:      "https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80",
  yogurt:      "https://commons.wikimedia.org/wiki/Special:FilePath/Joghurt.jpg?width=800",
  cream:      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  HOUSEKEEPING & CLEANING
  // ═══════════════════════════════════════════════════════════════
  clean:        "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  cleaner:      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  disinfectant: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  sanitizer:    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  detergent:    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  bleach:       "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
  glove:        IMG_CLEANING_GLOVE,
  // `mop` added 2026-11-07: "Commercial mop head and handle" fell through to the
  // Housekeeping category artwork (a housekeeping storage photo).
  mop:          IMG_MOP,
  // `lint` added 2026-11-08: "lint roller" matched the `roll` keyword and showed
  // a photo of bread loaves. A lint roller is a sticky adhesive tool, not bread.
  lint:         IMG_LINT_ROLLER,
  spray:        "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  LINENS & TEXTILES
  // ═══════════════════════════════════════════════════════════════
  pillow:      "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=600&q=80",
  cushion:      "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=600&q=80",
  sheet:      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
  bedding:      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
  fabric:      "https://commons.wikimedia.org/wiki/Special:FilePath/Linen%2C%20Texture%20(2242358989).jpg?width=800",
  cotton:      "https://commons.wikimedia.org/wiki/Special:FilePath/Linen%2C%20Texture%20(2242358989).jpg?width=800",
  linen:      "https://commons.wikimedia.org/wiki/Special:FilePath/Linen%2C%20Texture%20(2242358989).jpg?width=800",
  silk:      "https://commons.wikimedia.org/wiki/Special:FilePath/Linen%2C%20Texture%20(2242358989).jpg?width=800",
  satin:      "https://commons.wikimedia.org/wiki/Special:FilePath/Linen%2C%20Texture%20(2242358989).jpg?width=800",

  // ═══════════════════════════════════════════════════════════════
  //  GUEST AMENITIES & TOILETRIES
  // ═══════════════════════════════════════════════════════════════
  shampoo:    IMG_HOTEL_AMENITIES,
  conditioner:IMG_HOTEL_AMENITIES,
  lotion:     IMG_HOTEL_AMENITIES,
  gel:        IMG_HOTEL_AMENITIES,
  body:       IMG_HOTEL_AMENITIES,
  shower:     IMG_HOTEL_AMENITIES,
  bath:       IMG_HOTEL_AMENITIES,
  soap:       IMG_HOTEL_AMENITIES,
  // `towel` added 2026-11-07 (verified white towels). Without it, "White bath
  // towel" matched `bath` and showed a toiletry bottle instead of a towel.
  towel:      IMG_BATH_TOWELS,

  // ═══════════════════════════════════════════════════════════════
  //  POOL & SPA
  // ═══════════════════════════════════════════════════════════════
  pool:      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  chlorine:  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  ph:        "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  skimmer:   "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  net:       "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  hose:      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  massage:   "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
  scrub:     "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
  swab:      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  IT & TECHNOLOGY
  // ═══════════════════════════════════════════════════════════════
  router:    IMG_WIFI_ROUTER,
  modem:     IMG_MODEM,
  network:   "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  wifi:      IMG_WIFI_ROUTER,
  server:    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  rack:      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  laptop:    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  computer:  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  display:   "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
  screen:    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
  monitor:   "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
  projector: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
  keyboard:  "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
  mouse:     "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
  headset:   "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
  microphone:"https://commons.wikimedia.org/wiki/Special:FilePath/AKG%20C214%20Condenser%20microphone.jpg?width=800",
  speaker:   "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80",
  sound:     "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80",
  smart:     "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  hub:       IMG_USB_HUB,
  voice:     IMG_SMART_SPEAKER,
  ups:       IMG_UPS,
  battery:   IMG_BATTERY,
  pos:       "https://commons.wikimedia.org/wiki/Special:FilePath/Ingenico_iCT250_payment_terminal_machine.jpg?width=800",
  terminal:  "https://commons.wikimedia.org/wiki/Special:FilePath/Ingenico_iCT250_payment_terminal_machine.jpg?width=800",
  // `led` added 2026-11-07: "LED ceiling panel, 600 × 600 mm" was guarded away
  // from the `panel` keyword (correctly) and fell through to the Engineering
  // category artwork -- an engineering workbench photo.
  led:       IMG_LED_PANEL,

  // ═══════════════════════════════════════════════════════════════
  //  SECURITY
  // ═══════════════════════════════════════════════════════════════
  lock:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  key:    "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  card:   IMG_KEY_CARD,
  rfid:   IMG_KEY_CARD,
  camera: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
  cctv:   "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
  // `extinguisher` added 2026-11-07 (verified fire extinguishers). The former
  // blueprint photo was removed in an earlier audit; without this key a real
  // "Fire Extinguisher" row fell through to the gradient.
  extinguisher: IMG_FIRE_EXTINGUISHER,
  // `fire` added 2026-11-07: "Fire safety equipment inspection service" fell
  // through to the Hotel-services category artwork (an office laptop photo).
  // Same verified extinguisher photograph -- a fire-safety subject.
  fire: IMG_FIRE_EXTINGUISHER,
  // `pest` added 2026-11-07: "Hotel pest control service" fell through to the
  // Hotel-services category artwork (an office laptop photo).
  pest:   IMG_PEST_CONTROL,
  // `access` dropped 2026-11-07: its photo was a CCTV wall, not an access-control
  // reader. No verified access-control photo was found, so the keyword falls
  // through to the category gradient rather than showing the wrong subject.

  // ═══════════════════════════════════════════════════════════════
  //  ENGINEERING & MAINTENANCE
  // ═══════════════════════════════════════════════════════════════
  tool:        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  drill:       "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  saw:         "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  wrench:      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  screw:       "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  bolt:        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  // `nut_hardware` dropped 2026-11-07: the underscore key never matched a real
  // product name once matching moved to word boundaries.
  motor:       "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_motor_on_the_slewing_bearing_of_a_remote_controlled_yellow_Liebherr_tower_crane.jpg?width=800",
  panel:       IMG_ELECTRICAL_PANEL,
  switch:      IMG_ELECTRICAL_PANEL,
  breaker:     IMG_ELECTRICAL_PANEL,
  transformer: IMG_ELECTRICAL_PANEL,
  welding: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
  // `hvac`/`hood`/`extraction`/`closer` added 2026-11-07 after the live
  // marketplace showed a power drill for "Preventive HVAC maintenance service",
  // retail cleaning bottles for "Commercial kitchen hood cleaning service" and
  // an engineering workbench for "Commercial door closer".
  hvac:      IMG_HVAC_UNIT,
  hood:      IMG_KITCHEN_HOOD_FILTER,
  extraction: IMG_KITCHEN_HOOD_FILTER,
  closer:    IMG_DOOR_CLOSER,
  maintenance: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  repair:      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  carpentry:   "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  blueprint:   "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  paint:       "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80",
  roller:      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  KITCHEN & F&B EQUIPMENT
  // ═══════════════════════════════════════════════════════════════
  mixer:      "https://commons.wikimedia.org/wiki/Special:FilePath/KitchenAid%20Stand%20Mixer.jpg?width=800",
  blender:    "https://commons.wikimedia.org/wiki/Special:FilePath/Pink%20portable%20blender.jpg?width=800",
  shelf:      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80",
  knife:      "https://commons.wikimedia.org/wiki/Special:FilePath/Chef%27s%20knife.jpg?width=800",
  tray:       "https://commons.wikimedia.org/wiki/Special:FilePath/Baking%20tray.jpg?width=800",
  // `gastronorm`/`container` added 2026-11-07: "Stainless steel gastronorm food
  // pan" and "Commercial food storage container" fell through to the Food &
  // Beverage category artwork (a general food photograph).
  gastronorm: IMG_GASTRONORM,
  container:  IMG_FOOD_CONTAINER,
  // `kitchen_roll` added 2026-11-08: "Hayat Production / Kitchen Roll Ex.1000"
  // matched the `roll` keyword and showed a photo of bread loaves. A kitchen
  // roll is a paper-towel roll, not bread.
  kitchen_roll: IMG_PAPER_TOWEL,
  chair:      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&q=80",
  desk:       "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  FURNITURE (FFE)
  // ═══════════════════════════════════════════════════════════════
  bed:        "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80",
  sofa:       "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  furniture:  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
  lounge:     "https://commons.wikimedia.org/wiki/Special:FilePath/Lobby_hall_with_couches_and_chandelier_at_The_Fullerton_Bay_Hotel_Singapore.jpg?width=800",
  minibar:    "https://commons.wikimedia.org/wiki/Special:FilePath/Hotel_Eden%2C_Pokoj_Standart_minibar_%282%29.jpg?width=800",
  // `luggage`/`baggage` added 2026-11-07: "Guest-room folding luggage rack"
  // fell through to the Furniture category artwork (a hotel lobby photo).
  // Replaced 2026-11-08: the former photo was a fold-down TRANSIT bus luggage
  // rack, not a hotel product. It now points at a verified hotel luggage cart;
  // a luggage RACK (a different product) is guarded away to the gradient.
  luggage:    IMG_HOTEL_LUGGAGE_CART,
  baggage:    IMG_HOTEL_LUGGAGE_CART,

  // ═══════════════════════════════════════════════════════════════
  //  OFFICE / OS&E
  // ═══════════════════════════════════════════════════════════════
  notebook:   "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
  stationery: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
  office:     "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  MISCELLANEOUS
  // ═══════════════════════════════════════════════════════════════
  gift:       "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&q=80",
};

// ═══════════════════════════════════════════════════════════════
//  CATEGORY IMAGE POOLS — Multiple unique images per category
//  Each product gets a deterministic, unique image via hash-based selection
// ═══════════════════════════════════════════════════════════════

const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  fb: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
    "https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=600&q=80",
  ],
  hk: [
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80",
    IMG_CLEANING_GLOVE,
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80",
    "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=600&q=80",
  ],
  lin: [
    "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=600&q=80",
  ],
  eng: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  ],
  gra: [
    // Replaced 2026-11-07: the former photo was personal Curology/Clarins
    // skincare tubes on a residential shower floor -- NOT hotel guest amenities.
    // Now the verified Laylow hotel amenity tray (toiletry bottles + towels).
    IMG_HOTEL_AMENITIES,
  ],
  ffe: [
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  ],
  ose: [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80",
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
    "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600&q=80",
  ],
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80",
    "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=80",
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80",
  ],
  it: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    "https://commons.wikimedia.org/wiki/Special:FilePath/EFTA00002522_-_Cluttered_server_rack_filled_with_colorful_cables_and_networking_equipment.jpg?width=800",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  ],
  sec: [
    "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
    "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  ],
};

// ═══════════════════════════════════════════════════════════════
//  CATEGORY-COLORED GRADIENTS (branded, never random)
// ═══════════════════════════════════════════════════════════════

const CATEGORY_GRADIENTS: Record<string, string[]> = {
  fb:   ["#1a2a1a", "#2d4a2d", "#4a7c4a"],   // Food — warm green
  hk:   ["#0d2b2e", "#1a4a4e", "#2a7a80"],   // Housekeeping — teal
  lin:  ["#2a1a2a", "#4a2d4a", "#7a4a7a"],   // Linens — soft purple
  eng:  ["#1a1a2a", "#2a2a4a", "#4a4a7a"],   // Engineering — steel blue
  gra:  ["#2a1a1a", "#4a2d2d", "#7a4a4a"],   // Amenities — warm burgundy
  ffe:  ["#2a2a1a", "#4a4a2d", "#7a7a4a"],   // FFE — olive
  ose:  ["#1a2a2a", "#2d4a4a", "#4a7a7a"],   // Office — slate
  spa:  ["#1a1a2a", "#2a2a4a", "#4a4a8a"],   // Pool — deep blue
  it:   ["#0a1a2a", "#1a2a4a", "#2a4a7a"],   // IT — midnight blue
  sec:  ["#2a1a0a", "#4a2d1a", "#7a4a2a"],   // Security — amber
};

const FALLBACK_GRADIENT = ["#0f1729", "#1a2332", "#2a3a4e"]; // Navy-grey default

// ═══════════════════════════════════════════════════════════════
//  WORD-BOUNDARY MATCHER + COLLISION GUARDS
// ═══════════════════════════════════════════════════════════════
// Substring matching (`name.includes(keyword)`) matched keywords inside unrelated
// words and produced wrong-subject photos on the real catalog:
//   "Toilet Paper Jumbo 2-Ply"    -> `oil`   -> olive-oil bottle
//   "Fabric Softener 5L"          -> `soft`  -> Coca-Cola cans
//   "Paper Towel Roll"            -> `roll`  -> bread loaves
//   "Guest-room folding luggage rack" -> `rack` -> server racks
//   "47\" Hotel Smart TV"          -> `smart` -> smart door lock
//   "A4 Printer Paper 500 Sheet"  -> `sheet` -> bedroom
//   "White bath towel"            -> `bath`  -> skincare tubes
// Matching is now on WHOLE WORDS only, and genuinely ambiguous keywords carry a
// `skipIf` guard so a real word collision can never resolve to the wrong subject.

const WORD_FORM_SUFFIXES = ["", "s", "es", "ing", "er", "ers", "ed", "ings"];

const IRREGULAR_WORD_FORMS: Record<string, string[]> = {
  knife: ["knives"], glass: ["glasses"], dish: ["dishes"], berry: ["berries"],
  body: ["bodies"], baby: ["babies"], leaf: ["leaves"], shelf: ["shelves"],
  potato: ["potatoes"], tomato: ["tomatoes"], hero: ["heroes"], mango: ["mangoes"],
  mosquito: ["mosquitoes"], man: ["men"], woman: ["women"], person: ["people"],
  child: ["children"], foot: ["feet"], tooth: ["teeth"], goose: ["geese"],
  mouse: ["mice"], half: ["halves"], life: ["lives"], wife: ["wives"],
};

function keywordForms(keyword: string): string[] {
  const base = keyword.replace(/_/g, " ");
  const forms = new Set<string>([base]);
  for (const suffix of WORD_FORM_SUFFIXES) forms.add(base + suffix);
  // regular consonant+y -> ies plural (battery -> batteries, vanity -> vanities)
  if (base.endsWith("y") && base.length > 1 && !"aeiou".includes(base[base.length - 2])) {
    forms.add(base.slice(0, -1) + "ies");
  }
  for (const form of IRREGULAR_WORD_FORMS[keyword] ?? []) forms.add(form);
  return [...forms];
}

function nameHasKeyword(name: string, keyword: string): boolean {
  return keywordForms(keyword).some((form) => {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(name);
  });
}

/**
 * Build a case-insensitive guard from word STEMS. Each stem also matches its
 * plural ("pad" catches "pads", "bud" catches "buds") -- a trailing `\b` alone
 * would let "Vanity Kit Cotton Pads + Buds" slip past the `cotton` guard.
 */
function stems(...words: string[]): RegExp {
  const body = words.map((word) => `${word}(?:s|es)?`).join("|");
  return new RegExp(`\\b(?:${body})\\b`, "i");
}

/**
 * Collision guards. The keyword is a genuine word in two different subjects; when
 * the product name also matches `skipIf`, the keyword is skipped so its generic
 * photo is never shown for the wrong subject. The product then falls through to
 * the next keyword, or to the category gradient.
 */
const KEYWORD_GUARDS: Record<string, RegExp> = {
  // rack: server rack (IT) vs luggage/garment rack (FFE)
  rack: stems("luggage", "suitcase", "garment", "clothes", "apparel", "shoe", "wine", "magazine", "towel", "newspaper"),
  // clean/cleaner: general cleaning CHEMICALS vs cleaning EQUIPMENT/cloths.
  // "Vacuum Cleaner" must not show spray bottles; "Microfiber cleaning cloth"
  // must not show spray bottles; "Glass Cleaner" (a chemical) still shows them.
  clean: stems("hood", "extraction", "exhaust", "ventilation", "vacuum", "polisher", "machine", "equipment", "cloth", "microfiber", "sponge", "wipe", "rag", "duster", "brush", "mop", "iron", "steam", "card", "sign", "status"),
  cleaner: stems("hood", "extraction", "exhaust", "ventilation", "vacuum", "polisher", "machine", "equipment", "cloth", "microfiber", "sponge", "wipe", "rag", "duster", "brush", "mop", "iron", "steam", "card", "sign", "status"),
  // spray: a spray BOTTLE vs a spray MACHINE/dispenser. "Machine Air Fresh
  // Matic with Spray" is a machine, not a hand-held spray bottle.
  spray: stems("machine", "matic", "dispenser"),
  // maintenance: generic tools vs HVAC/heating/cooling maintenance.
  // "Preventive HVAC maintenance service" must resolve to the HVAC unit photo,
  // not the power-drill photograph.
  maintenance: stems("hvac", "ventilation", "heating", "cooling"),
  // hvac: an outdoor HVAC condenser unit vs an HVAC air FILTER (a filter is not
  // a condenser unit). "HVAC Air Filter" must fall through to the gradient.
  hvac: stems("filter"),
  // minibar: a minibar FRIDGE vs a minibar SNACK PACK (a snack box is not a
  // fridge). "MiniBar Snack Pack" must fall through to the gradient.
  minibar: stems("snack"),
  // luggage/baggage: a luggage RACK vs luggage TAGS or a luggage CART/trolley.
  // "Hotel Luggage Rack" must fall through to the gradient (no verified hotel
  // rack photo); "Bellman black luggage cart" resolves to the hotel cart photo.
  luggage: stems("tag", "label", "strap", "rack"),
  baggage: stems("tag", "label", "strap", "rack"),
  // led: an LED ceiling panel vs an LED BULB/LAMP (a bulb is not a panel).
  led: stems("bulb", "lamp", "spotlight", "spot", "mr16", "gu10"),
  // panel: electrical distribution panel vs LED/light/control panel
  panel: stems("led", "light", "lighting", "ceiling", "lcd", "display", "touch", "solar", "acoustic", "wall", "switch", "control", "breaker"),
  // sheet: bedding vs paper/tissue. "Facial Tissues (100 sheets)" must not show
  // a made bed.
  sheet: stems("paper", "a4", "printer", "print", "document", "drawing", "metal", "plastic", "vinyl", "film", "glass", "tissue", "facial", "napkin", "handkerchief"),
  // roll: bread roll vs paper/towel/foil roll, spring/egg roll, fruit roll-up,
  // a lint ROLLER, or a kitchen (paper) ROLL.
  roll: stems("paper", "towel", "toilet", "foil", "cling", "wrap", "film", "tape", "baking", "pastry", "dough", "spring", "egg", "vegetable", "rice", "seaweed", "shrimp", "fruit", "lint", "kitchen"),
  // bath: toiletry vs bath towel/robe/mat
  bath: stems("towel", "robe", "mat", "curtain", "linen"),
  // smart: smart lock vs smart TV/display/thermostat
  smart: stems("tv", "television", "display", "screen", "monitor", "speaker", "door", "lock", "locker", "tag", "thermostat", "temperature", "climate", "heating", "cooling", "hvac", "purifier"),
  // gel: toiletry gel vs fruit/dessert GELATIN or a LAUNDRY/detergent gel.
  // "Ariel Gel (3.60 L)" is a laundry gel and must not show toiletry bottles.
  gel: stems("hair", "hand", "nail", "shave", "floor", "tile", "fruit", "fruity", "dessert", "jelly", "gelatin", "pudding", "sweet", "cake", "snack", "candy", "rau", "thach", "thạch", "laundry", "detergent", "ariel", "washing"),
  // net: pool skimmer net vs internet/network
  net: stems("internet", "network", "web", "mesh", "wifi", "lan", "ethernet", "firewall"),
  // card: a hotel KEY CARD vs paper/business/status cards or an access-card
  // READER (an electronic device, not a key card). "Room Cleaning Status
  // Cards" and "Key Card Encoder"/"System Upgrade" (devices/services) fall through.
  card: stems("paper", "business", "greeting", "post", "cardboard", "id", "credit", "debit", "gift", "loyalty", "membership", "name", "status", "sign", "cleaning", "clean", "encoder", "system", "upgrade", "reader", "access", "door"),
  // key: door key vs keyboard/keypad/keychain. "Key Card ..." is a key card,
  // not a door key/lock -> fall through.
  key: stems("board", "pad", "chain", "tag", "fob", "code", "cable", "switch", "cabinet", "card"),
  // screen/display/monitor: display vs paper/protection
  screen: stems("paper", "print", "protection", "guard", "filter", "mesh", "door", "window", "protector"),
  display: stems("paper", "print", "stand", "card", "board", "retail", "shop", "advertising"),
  monitor: stems("paper", "print", "guard", "protection", "display"),
  // cotton/linen/fabric/silk/satin: textile vs pad/bud/softener/towel
  cotton: stems("pad", "bud", "swab", "ball", "tissue", "wool", "towel", "cloth", "linen", "robe", "bathrobe"),
  linen: stems("pad", "bud", "towel", "cloth", "tissue", "ball", "napkin", "tablecloth", "sheet", "duvet", "pillow"),
  fabric: stems("pad", "bud", "softener", "towel", "cloth", "tissue", "ball", "upholstery", "sofa", "curtain"),
  silk: stems("pad", "bud", "pillow", "cloth", "scarf", "robe"),
  satin: stems("pad", "bud", "pillow", "cloth", "scarf", "robe"),
  // water: bottled water vs water heater/boiler/filter or drinking GLASSWARE.
  // "Water Glasses (Crystal)" must not show a water bottle.
  water: stems("heater", "boiler", "filter", "softener", "pump", "tank", "dispenser", "bottleless", "ionizer", "purifier", "glass", "glasses", "cup", "cups", "mug", "jug", "carafe", "tumbler"),
  // oil: cooking oil vs engine/motor oil or oil-preserved food
  oil: stems("engine", "motor", "lubricant", "hydraulic", "gear", "transmission", "crankcase", "anchovy", "anchovies", "sardine", "sardines", "fish", "massage"),
  // battery: battery vs car/vehicle battery
  battery: stems("car", "vehicle", "auto", "truck", "boat", "motorcycle", "marine"),
  // towel: towel vs towel rail/warmer/paper towel
  towel: stems("rail", "warmer", "holder", "rack", "hook", "paper", "dispenser", "toilet"),
  // shower: shower gel/amenity vs a shower CAP, a shower TOWEL, or a shower
  // SCRUBBER/brush (cleaning tools, not toiletries). "shower towel 140x70"
  // must show towels; "Small Shower Scrubber" must fall through.
  shower: stems("cap", "towel", "scrubber", "scrub", "brush", "sponge"),
  // ── BAKERY & PANTRY ──────────────────────────────────────────────────────
  // bread/bun: bread vs bread-flavoured snacks ("Bread & Butter Chips")
  bread: stems("chip", "chips", "crisp", "crisps", "snack", "crumb", "crumbs", "pudding"),
  bun: stems("chip", "chips", "crisp", "crisps", "snack", "hot", "dog"),
  // dough: bread dough vs cookie/brownie dough
  dough: stems("cookie", "brownie", "bake", "baked", "mix", "dessert", "candy", "sweet", "cake", "pastry"),
  // cocoa: cocoa powder vs cocoa puffs/cereal/brownie
  cocoa: stems("puff", "puffs", "cereal", "bar", "brownie", "baked", "cookie", "snack"),
  // olive: olive oil vs fish preserved in olive oil
  olive: stems("anchovy", "anchovies", "fish", "sardine", "sardines"),
  // soft: soft DRINK vs soft cheese / soft-baked / soft roll / fabric softener.
  // "Fabric Softener 5L" must not show Coca-Cola cans.
  soft: stems("softener", "fabric", "laundry", "detergent", "conditioner", "rinse", "cheese", "roll", "bread", "bun", "grain", "wheat", "seed", "baked", "bake", "oatmeal", "bar", "square", "granola", "cereal", "snack", "drink", "soda", "sparkling", "carbonated"),
  // milk: milk vs milk chocolate / yogurt / cheese
  // milk: milk vs milk chocolate / yogurt / cheese / milk balls
  milk: stems("chocolate", "cocoa", "candy", "yogurt", "yoghurt", "cheese", "ball", "balls", "malted", "sweet", "coconut"),
  // butter: butter vs butter-flavoured bakery / peanut butter / popcorn
  butter: stems("croissant", "bread", "bun", "pastry", "cake", "cookie", "biscuit", "dough", "bakery", "cereal", "peanut", "chip", "chocolate", "bar", "mix", "cracker", "snack", "popcorn"),
  // salt: salt vs salted snacks / seasonings / sauces
  salt: stems("pistachio", "nut", "almond", "cashew", "peanut", "chip", "crisp", "popcorn", "cracker", "crouton", "seasoned", "flavor", "flavored", "butter", "caramel", "chocolate", "corn", "sauce", "soy", "seasoning"),
  // sesame: sesame SEEDS vs sesame OIL
  sesame: stems("oil"),
  // meat: generic meat vs a named species ("Dark Meat Chicken" is chicken)
  meat: stems("chicken", "turkey", "duck", "lamb", "beef", "pork", "fish", "seafood", "mince", "minced", "veal", "goat", "mutton"),
  // herb: fresh herbs vs herb-flavoured prepared food
  herb: stems("bread", "naan", "roti", "food", "dish", "sauce", "soup", "seasoning", "spice", "mix", "marinade", "chicken", "meat", "fish", "rice", "pasta", "snack", "chip", "butter", "oil", "salt", "pepper", "garlic"),
  // onion: onion vs onion-flavoured snacks/seasoning
  onion: stems("twist", "chip", "crisp", "snack", "bread", "roll", "dip", "sauce", "soup", "seasoning", "powder", "salt", "garlic", "ring"),
  // potato: potato vs potato crisps/chips
  potato: stems("crisp", "crisps", "chip", "chips", "snack", "candy", "sweet"),
  // tomato: fresh tomato vs tomato paste/sauce ("diced tomatoes in juice" is
  // still tomatoes, so "juice" is intentionally NOT guarded here)
  tomato: stems("paste", "sauce", "ketchup", "soup", "pizza", "salsa", "marinara", "napoletana", "sun-dried", "sundried"),
  // pepper: pepper vs pepper sauce/seasoning/salted nuts
  pepper: stems("sauce", "seasoning", "powder", "steak", "oncini", "cracker", "crouton", "pistachio", "pistachios", "nut", "nuts", "snack"),
  // chicken: chicken MEAT vs a chicken prepared dish
  chicken: stems("pasta", "spaghetti", "noodle", "soup", "stew", "curry", "rice", "bowl", "salad", "sandwich", "pie", "fajita", "taco", "wrap", "fried", "stir", "skillet", "meal", "cereal", "snack", "bar", "strip", "sauce", "marinade", "jerk", "alfredo"),
  // egg: egg vs an egg-based prepared food or a chocolate truffle EGG
  egg: stems("fried", "rice", "noodle", "soup", "cake", "baking", "mix", "product", "powder", "nog", "sandwich", "salad", "roll", "wrap", "sauce", "mayonnaise", "chocolate", "truffle", "candy", "sweet", "easter", "confection", "liqueur"),
  // rice: rice vs a rice-based prepared food/seasoning/puff
  rice: stems("sauce", "mix", "seasoning", "cereal", "flour", "stick", "noodle", "paper", "vinegar", "pudding", "milk", "puff", "puffs", "snack", "corn"),
  // bran: bran vs bran cereal/bar/raisin bran
  bran: stems("cereal", "bar", "muffin", "baked", "snack", "raisin", "nut", "raisins"),
  // pasta: pasta vs pasta SAUCE
  pasta: stems("sauce", "adobo", "achiote", "seasoning", "paste"),
  // juice: juice vs juice drink/smoothie
  juice: stems("smoothie", "cocktail", "slush", "ice"),
  // lemon/lime: the fruit vs a lemon/lime DRINK or a lemon-scented SOAP.
  // "Feba Soap yellow lemon" must show soap, not lemons.
  lemon: stems("juice", "juie", "drink", "sparkling", "beverage", "soda", "water", "flavor", "flavour", "tea", "candy", "sweet", "sour", "soap"),
  lime: stems("juice", "juie", "drink", "sparkling", "beverage", "soda", "water", "flavor", "flavour", "tea", "candy", "sweet", "sour", "soap"),
  // watermelon: the fruit vs a watermelon drink/candy
  watermelon: stems("drink", "soft", "carbonated", "flavor", "flavour", "soda", "candy", "sweet", "gum", "twist", "pack", "juice"),
  // strawberry: the fruit vs a strawberry-flavoured food
  strawberry: stems("jam", "fruit", "snack", "candy", "sweet", "tea", "juice", "drink", "shake", "protein", "bar", "yogurt", "yoghurt", "cereal", "flavor", "flavour", "milk", "cream"),
  // apple: the fruit vs apple chips/juice/cider/bars
  apple: stems("juice", "cider", "sauce", "chip", "crisp", "snack", "pie", "crumble", "flavor", "flavour", "candy", "sweet", "drink", "bar", "treat", "ginger", "streusel"),
  // almond: the nut vs almond milk/chocolate/butter
  almond: stems("milk", "chocolate", "butter", "cocoa", "flour", "snack", "bar", "mix", "candy", "sweet"),
  // cocktail: a cocktail vs a vegetable/fruit cocktail DRINK
  cocktail: stems("vegetable", "fruit", "juice", "drink", "v8"),
  // wifi: a Wi-Fi ROUTER vs a Wi-Fi thermostat/lock/camera
  wifi: stems("thermostat", "temperature", "climate", "heating", "cooling", "hvac", "purifier", "lock", "door", "camera", "speaker", "tv", "plug", "light"),
  // paint/roller: paint vs a painting/artwork, or a lint ROLLER (a sticky tool).
  paint: stems("painting", "art", "artwork", "frame", "framed", "canvas", "poster", "print", "picture", "photo", "wallpaper", "bin", "trash", "painted"),
  roller: stems("painting", "art", "artwork", "frame", "framed", "canvas", "poster", "print", "picture", "photo", "wallpaper", "hair", "lint"),
  // ── SECURITY / IT / PRODUCE ──────────────────────────────────────────────
  // fire: fire safety vs a "fire"-flavoured candy/gum
  fire: stems("gum", "candy", "sweet", "snack", "flavor", "flavour", "mint", "breath", "dentyne", "fireball", "jolly", "rancher"),
  // ups: a UPS unit vs "Fruit Roll-UPS" (a snack)
  ups: stems("fruit", "snack", "candy", "sweet", "roll", "rolls", "roll-up", "rollup", "rollups", "gushers", "foot"),
  // spinach: the leaf vs a spinach prepared dish
  spinach: stems("ravioli", "pasta", "sauce", "napoletana", "ricotta", "lasagne", "lasagna", "souffle", "soufflé", "quiche", "dip", "soup", "curry", "stir", "fry", "sauced", "casserole", "rice", "bowl", "salad", "green", "smoothie"),
  // broccoli: the floret vs a broccoli prepared dish
  broccoli: stems("stir", "fry", "sauced", "sauce", "cheese", "cheesy", "bowl", "salad", "soup", "casserole", "rice", "pasta", "cheddar"),
};

export function getProductImage(product: { name: string; category: string; sku?: string }): { type: "url"; src: string } | { type: "gradient"; colors: string[]; initials: string } {
  const name = product.name.toLowerCase();
  const category = product.category as string;

  // 1) Verified subject match on WORD BOUNDARIES, with collision guards.
  for (const [keyword, url] of Object.entries(KEYWORD_MAP)) {
    const guard = KEYWORD_GUARDS[keyword];
    if (guard?.test(name)) continue;
    if (nameHasKeyword(name, keyword)) {
      return { type: "url", src: url };
    }
  }

  // 2) No verified subject photo for this product -> category-colored gradient with
  //    product initials. Never a wrong-subject stock photo. Category pools are for
  //    getCategoryImage() covers only, where a category photo IS the subject.
  void product.sku;
  const colors = CATEGORY_GRADIENTS[category] || FALLBACK_GRADIENT;
  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return { type: "gradient", colors, initials };
}

export function getCategoryImage(categoryId: string): string {
  const pool = CATEGORY_IMAGE_POOLS[categoryId];
  return pool?.[0] || CATEGORY_IMAGE_POOLS.fb[0];
}
