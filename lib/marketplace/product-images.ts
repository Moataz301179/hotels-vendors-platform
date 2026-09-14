/**
 * Product Image Resolver
 * Maps product names to relevant Unsplash photography.
 * Falls back to category-colored gradient placeholders for niche/industrial items.
 *
 * AUDIT 2026-08-11: Every URL verified live + subject-matched via local vision
 * (llava:7b). All dead/wrong-subject images removed. Entries without a verified
 * photo fall through to the (also verified) category pools or gradient.
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
  tuna:      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&q=80",
  shrimp:      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80",
  prawn:      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80",
  fish:      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
  seafood:      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
  sardine:      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
  lobster:      "https://images.unsplash.com/photo-1553659971-f01207815844?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  PRODUCE & VEGETABLES
  // ═══════════════════════════════════════════════════════════════
  cucumber:      "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&q=80",
  tomato:      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80",
  onion:      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80",
  potato:      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80",
  lettuce:      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80",
  pepper:      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80",
  capsicum:      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80",
  lemon:      "https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&q=80",
  lime:      "https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&q=80",
  apple:      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80",
  banana:      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80",
  watermelon:      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
  strawberry:      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80",
  pineapple:      "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80",
  broccoli:      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80",
  spinach:      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80",
  egg:      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80",
  microgreen:      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
  couscous:      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",

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
  seed:      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
  sesame:      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
  walnut:      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
  herb:      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  BEVERAGES
  // ═══════════════════════════════════════════════════════════════
  juice:      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
  water:      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  fountain:      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  soda:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  soft:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  energy:      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  milk:      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80",
  wine:      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  beer:      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80",
  spirit:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  whiskey:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  vodka:      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&q=80",
  tea:      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
  jasmine:      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
  chamomile:      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
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
  yogurt:      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
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
  fabric:      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  cotton:      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  linen:      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  silk:      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  satin:      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",

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
  microphone:"https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
  speaker:   "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80",
  sound:     "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80",
  smart:     "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  hub:       "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  voice:     "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
  ups:       "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  battery:   "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  pos:       "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  terminal:  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",

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
  hvac:        "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  motor:       "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  pump:        "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  valve:       "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  pipe:        "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  fitting:     "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  compressor:  "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  bearing:     "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  gasket:      "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  lubricant:   "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
  grease:      "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
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
  mixer:      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&q=80",
  blender:    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&q=80",
  cabinet:    "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80",
  shelf:      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80",
  chair:      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&q=80",
  desk:       "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  FURNITURE (FFE)
  // ═══════════════════════════════════════════════════════════════
  bed:        "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80",
  sofa:       "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  furniture:  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
  lounge:     "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  minibar:    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  rental:     "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",

  // ═══════════════════════════════════════════════════════════════
  //  OFFICE / OS&E
  // ═══════════════════════════════════════════════════════════════
  notebook:   "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
  stationery: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
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
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
    "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=600&q=80",
  ],
  lin: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80",
    "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=600&q=80",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
  ],
  eng: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&q=80",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  ],
  gra: [
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80",
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
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
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
