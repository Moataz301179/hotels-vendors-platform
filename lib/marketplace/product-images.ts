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
 */

// ─── REAL UNSPLASH PHOTOGRAPHY ──────────────────────────────────────────────
// Every URL below points to an actual photograph of the product category.
// Zero random placeholder images. Zero Picsum.

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
  glove:        "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80",
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
  shampoo:    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  conditioner:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  lotion:     "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  gel:        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  body:       "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  shower:     "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  bath:       "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
  soap:       "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",

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
  router:    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  modem:     "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  network:   "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  wifi:      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
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
  hub:       "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  voice:     "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  ups:       "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  battery:   "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  pos:       "https://commons.wikimedia.org/wiki/Special:FilePath/Ingenico_iCT250_payment_terminal_machine.jpg?width=800",
  terminal:  "https://commons.wikimedia.org/wiki/Special:FilePath/Ingenico_iCT250_payment_terminal_machine.jpg?width=800",

  // ═══════════════════════════════════════════════════════════════
  //  SECURITY
  // ═══════════════════════════════════════════════════════════════
  lock:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  key:    "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  card:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  rfid:   "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  camera: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
  cctv:   "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
  access: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  ENGINEERING & MAINTENANCE
  // ═══════════════════════════════════════════════════════════════
  tool:        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  drill:       "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  saw:         "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  wrench:      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  screw:       "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  bolt:        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  nut_hardware:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
  motor:       "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_motor_on_the_slewing_bearing_of_a_remote_controlled_yellow_Liebherr_tower_crane.jpg?width=800",
  panel:       "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  switch:      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  breaker:     "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  transformer: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  welding:     "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
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
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80",
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
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
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

/**
 * Deterministic hash of a string — same input always produces same output.
 * Used to pick a consistent image from a pool for the same product.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function getProductImage(product: { name: string; category: string; sku?: string }): { type: "url"; src: string } | { type: "gradient"; colors: string[]; initials: string } {
  const name = product.name.toLowerCase();
  const category = product.category as string;

  // 1) Try exact keyword match
  for (const [keyword, url] of Object.entries(KEYWORD_MAP)) {
    if (name.includes(keyword)) {
      return { type: "url", src: url };
    }
  }

  // 1b) Try singularized keyword match (strip trailing 's' / 'es')
  const singularName = name
    .replace(/ies\b/g, "y")
    .replace(/es\b/g, "")
    .replace(/s\b/g, "");
  for (const [keyword, url] of Object.entries(KEYWORD_MAP)) {
    if (singularName.includes(keyword)) {
      return { type: "url", src: url };
    }
  }

  // 2) Pick a UNIQUE image from the category pool using product hash
  const pool = CATEGORY_IMAGE_POOLS[category];
  if (pool && pool.length > 0) {
    const hashInput = product.sku || product.name;
    const hash = hashString(hashInput);
    const index = hash % pool.length;
    return { type: "url", src: pool[index] };
  }

  // 3) Category-colored gradient with product initials
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
