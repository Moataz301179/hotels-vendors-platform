"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Star, MapPin } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  city: string;
  governorate: string;
  tier: string;
  rooms: number;
  chain: string;
  monthly_gmv_egp: number;
}

/* ─── LOCAL EGYPTIAN HOTEL GROUPS ONLY ───
   International chains (Marriott, Hilton, Four Seasons, Accor, etc.)
   are excluded. These are Egyptian-owned and operated groups.
*/
const LOCAL_HOTELS: Hotel[] = [
  // ─── JAZ HOTEL GROUP (Travco) — 75+ properties ───
  { id: "lz01", name: "Jaz Aquamarine Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 1001, chain: "Jaz", monthly_gmv_egp: 5200000 },
  { id: "lz02", name: "Jaz Aquaviva", city: "Makadi Bay", governorate: "Red Sea", tier: "luxury", rooms: 1009, chain: "Jaz", monthly_gmv_egp: 4800000 },
  { id: "lz03", name: "Jaz Makadi Star & Spa", city: "Makadi Bay", governorate: "Red Sea", tier: "luxury", rooms: 420, chain: "Jaz", monthly_gmv_egp: 2100000 },
  { id: "lz04", name: "Jaz Fanara Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 320, chain: "Jaz", monthly_gmv_egp: 1800000 },
  { id: "lz05", name: "Jaz Mirabel Beach", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 380, chain: "Jaz", monthly_gmv_egp: 1950000 },
  { id: "lz06", name: "Jaz Bluemarine", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 450, chain: "Jaz", monthly_gmv_egp: 2200000 },
  { id: "lz07", name: "Jaz Sakhra", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 290, chain: "Jaz", monthly_gmv_egp: 1600000 },
  { id: "lz08", name: "Jaz Casa Del Mar Beach", city: "Hurghada", governorate: "Red Sea", tier: "luxury", rooms: 380, chain: "Jaz", monthly_gmv_egp: 2400000 },
  { id: "lz09", name: "Jaz Sharks Bay", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 220, chain: "Jaz", monthly_gmv_egp: 1200000 },
  { id: "lz10", name: "Jaz Almaza Beach", city: "North Coast", governorate: "Matrouh", tier: "luxury", rooms: 350, chain: "Jaz", monthly_gmv_egp: 2800000 },

  // ─── SUNRISE HOTELS & RESORTS ───
  { id: "ls01", name: "Sunrise Arabian Beach Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 470, chain: "Sunrise", monthly_gmv_egp: 3800000 },
  { id: "ls02", name: "Sunrise Crystal Bay Resort", city: "Hurghada", governorate: "Red Sea", tier: "luxury", rooms: 360, chain: "Sunrise", monthly_gmv_egp: 2100000 },
  { id: "ls03", name: "Sunrise Holidays Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 320, chain: "Sunrise", monthly_gmv_egp: 1750000 },
  { id: "ls04", name: "Sunrise Garden Beach Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 280, chain: "Sunrise", monthly_gmv_egp: 1500000 },
  { id: "ls05", name: "Sunrise Montemare Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 310, chain: "Sunrise", monthly_gmv_egp: 2500000 },
  { id: "ls06", name: "Sunrise Remal Beach Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 260, chain: "Sunrise", monthly_gmv_egp: 1400000 },
  { id: "ls07", name: "Sunrise Tucana Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 340, chain: "Sunrise", monthly_gmv_egp: 1800000 },
  { id: "ls08", name: "Sunrise Diamond Beach Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 290, chain: "Sunrise", monthly_gmv_egp: 1650000 },
  { id: "ls09", name: "Sunrise Mamlouk Palace Resort", city: "Hurghada", governorate: "Red Sea", tier: "luxury", rooms: 410, chain: "Sunrise", monthly_gmv_egp: 2600000 },
  { id: "ls10", name: "Sunrise Alora Aqua Park", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 380, chain: "Sunrise", monthly_gmv_egp: 1900000 },

  // ─── PICKALBATROS / ALBATROS ───
  { id: "lp01", name: "Albatros Palace Resort", city: "Hurghada", governorate: "Red Sea", tier: "luxury", rooms: 480, chain: "Pickalbatros", monthly_gmv_egp: 2900000 },
  { id: "lp02", name: "Albatros Aqua Park", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 520, chain: "Pickalbatros", monthly_gmv_egp: 2400000 },
  { id: "lp03", name: "Pickalbatros Citadel Resort", city: "Sahl Hasheesh", governorate: "Red Sea", tier: "luxury", rooms: 380, chain: "Pickalbatros", monthly_gmv_egp: 2700000 },
  { id: "lp04", name: "Albatros Dana Beach Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 420, chain: "Pickalbatros", monthly_gmv_egp: 2100000 },
  { id: "lp05", name: "Albatros Makadi Resort", city: "Makadi Bay", governorate: "Red Sea", tier: "upscale", rooms: 350, chain: "Pickalbatros", monthly_gmv_egp: 1800000 },
  { id: "lp06", name: "Pickalbatros Laguna Club", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 290, chain: "Pickalbatros", monthly_gmv_egp: 1500000 },
  { id: "lp07", name: "Pickalbatros Aqua Park", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 340, chain: "Pickalbatros", monthly_gmv_egp: 1750000 },
  { id: "lp08", name: "Albatros White Beach Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 310, chain: "Pickalbatros", monthly_gmv_egp: 1600000 },

  // ─── PYRAMISA HOTELS ───
  { id: "ly01", name: "Pyramisa Beach Resort", city: "Sahl Hasheesh", governorate: "Red Sea", tier: "upscale", rooms: 380, chain: "Pyramisa", monthly_gmv_egp: 1700000 },
  { id: "ly02", name: "Pyramisa Island Hotel", city: "Aswan", governorate: "Aswan", tier: "midscale", rooms: 400, chain: "Pyramisa", monthly_gmv_egp: 1100000 },
  { id: "ly03", name: "Pyramisa Suites Hotel", city: "Cairo", governorate: "Cairo", tier: "upscale", rooms: 260, chain: "Pyramisa", monthly_gmv_egp: 950000 },

  // ─── BARON HOTELS ───
  { id: "lb01", name: "Baron Resort Sharm El Sheikh", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 336, chain: "Baron", monthly_gmv_egp: 3100000 },
  { id: "lb02", name: "Baron Palace Sahl Hasheesh", city: "Sahl Hasheesh", governorate: "Red Sea", tier: "luxury", rooms: 290, chain: "Baron", monthly_gmv_egp: 2200000 },
  { id: "lb03", name: "Baron Hotel Taba", city: "Taba", governorate: "South Sinai", tier: "upscale", rooms: 220, chain: "Baron", monthly_gmv_egp: 850000 },

  // ─── SIVA HOTELS ───
  { id: "lvi01", name: "Siva Grand Beach", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 368, chain: "Siva", monthly_gmv_egp: 1400000 },
  { id: "lvi02", name: "Siva Sharm Resort & Spa", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 510, chain: "Siva", monthly_gmv_egp: 4100000 },
  { id: "lvi03", name: "Siva Port Ghalib", city: "Marsa Alam", governorate: "Red Sea", tier: "upscale", rooms: 280, chain: "Siva", monthly_gmv_egp: 980000 },

  // ─── STELLA DI MARE ───
  { id: "lst01", name: "Stella Di Mare Beach Hotel", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 298, chain: "Stella Di Mare", monthly_gmv_egp: 2200000 },
  { id: "lst02", name: "Stella Di Mare Gardens Resort", city: "Makadi Bay", governorate: "Red Sea", tier: "upscale", rooms: 340, chain: "Stella Di Mare", monthly_gmv_egp: 1600000 },
  { id: "lst03", name: "Stella Beach Resort", city: "Makadi Bay", governorate: "Red Sea", tier: "upscale", rooms: 220, chain: "Stella Di Mare", monthly_gmv_egp: 1100000 },

  // ─── DESERT ROSE ───
  { id: "ldr01", name: "Desert Rose Resort", city: "Hurghada", governorate: "Red Sea", tier: "midscale", rooms: 884, chain: "Desert Rose", monthly_gmv_egp: 2100000 },
  { id: "ldr02", name: "Desert Rose Neverland City", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 420, chain: "Desert Rose", monthly_gmv_egp: 1400000 },

  // ─── REEF OASIS ───
  { id: "lro01", name: "Reef Oasis Blue Bay Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 530, chain: "Reef Oasis", monthly_gmv_egp: 1600000 },
  { id: "lro02", name: "Reef Oasis Beach Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 380, chain: "Reef Oasis", monthly_gmv_egp: 2100000 },

  // ─── TROPITEL ───
  { id: "ltr01", name: "Tropitel Sahl Hasheesh", city: "Sahl Hasheesh", governorate: "Red Sea", tier: "upscale", rooms: 438, chain: "Tropitel", monthly_gmv_egp: 1600000 },
  { id: "ltr02", name: "Tropitel Naama Bay", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 290, chain: "Tropitel", monthly_gmv_egp: 1250000 },

  // ─── AL NABILA ───
  { id: "lan01", name: "Al Nabila Grand Bay Makadi", city: "Makadi Bay", governorate: "Red Sea", tier: "luxury", rooms: 314, chain: "Al Nabila", monthly_gmv_egp: 1900000 },

  // ─── TOLIP ───
  { id: "ltl01", name: "Tolip Hotel Alexandria", city: "Alexandria", governorate: "Alexandria", tier: "midscale", rooms: 200, chain: "Tolip", monthly_gmv_egp: 900000 },
  { id: "ltl02", name: "Tolip El Galaa", city: "Cairo", governorate: "Cairo", tier: "upscale", rooms: 300, chain: "Tolip", monthly_gmv_egp: 1350000 },

  // ─── HELNAN ───
  { id: "lhl01", name: "Helnan Dreamland Hotel", city: "6th of October", governorate: "Giza", tier: "midscale", rooms: 150, chain: "Helnan", monthly_gmv_egp: 650000 },
  { id: "lhl02", name: "Helnan Aswan", city: "Aswan", governorate: "Aswan", tier: "upscale", rooms: 195, chain: "Helnan", monthly_gmv_egp: 680000 },

  // ─── ARABELLA ───
  { id: "lar01", name: "Arabella Azur Resort", city: "Hurghada", governorate: "Red Sea", tier: "midscale", rooms: 396, chain: "Arabella", monthly_gmv_egp: 1200000 },

  // ─── CORAL SEA ───
  { id: "lcs01", name: "Coral Sea Holiday Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 340, chain: "Coral Sea", monthly_gmv_egp: 1450000 },
  { id: "lcs02", name: "Coral Sea Aqua Club", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 280, chain: "Coral Sea", monthly_gmv_egp: 1100000 },

  // ─── CHARMILLION ───
  { id: "lch01", name: "Charmillion Club Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 320, chain: "Charmillion", monthly_gmv_egp: 1900000 },
  { id: "lch02", name: "Charmillion Sea Life Resort", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "upscale", rooms: 260, chain: "Charmillion", monthly_gmv_egp: 1350000 },

  // ─── SAVOY ───
  { id: "lsv01", name: "Savoy Sharm El Sheikh", city: "Sharm El-Sheikh", governorate: "South Sinai", tier: "luxury", rooms: 510, chain: "Savoy", monthly_gmv_egp: 4100000 },

  // ─── PORTO (Amer Group) ───
  { id: "lpt01", name: "Porto Marina Resort", city: "Marsa Matrouh", governorate: "Matrouh", tier: "upscale", rooms: 250, chain: "Porto", monthly_gmv_egp: 950000 },
  { id: "lpt02", name: "Porto Sokhna", city: "Ain Sokhna", governorate: "Suez", tier: "upscale", rooms: 380, chain: "Porto", monthly_gmv_egp: 1200000 },

  // ─── PARADISE INN ───
  { id: "lpi01", name: "Paradise Inn Beach Resort", city: "Alexandria", governorate: "Alexandria", tier: "midscale", rooms: 180, chain: "Paradise Inn", monthly_gmv_egp: 580000 },

  // ─── CONTINENTAL (formerly Movenpick, now local) ───
  { id: "lcn01", name: "Continental Hotel Hurghada", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 310, chain: "Continental", monthly_gmv_egp: 1150000 },

  // ─── OLD PALACE ───
  { id: "lop01", name: "Old Palace Resort", city: "Sahl Hasheesh", governorate: "Red Sea", tier: "upscale", rooms: 290, chain: "Old Palace", monthly_gmv_egp: 980000 },

  // ─── JASMINE PALACE ───
  { id: "ljm01", name: "Jasmine Palace Resort", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 340, chain: "Jasmine Palace", monthly_gmv_egp: 1250000 },

  // ─── SEA STAR ───
  { id: "lss01", name: "Sea Star Beau Rivage", city: "Hurghada", governorate: "Red Sea", tier: "upscale", rooms: 280, chain: "Sea Star", monthly_gmv_egp: 1050000 },

  // ─── AMARINA ───
  { id: "lam01", name: "Amarina Abu Soma Resort", city: "Safaga", governorate: "Red Sea", tier: "luxury", rooms: 320, chain: "Amarina", monthly_gmv_egp: 1450000 },
];

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury",
  upscale: "Upscale",
  midscale: "Midscale",
};

const TIER_COLORS: Record<string, string> = {
  luxury: "var(--accent-base)",
  upscale: "#1a1a2e",
  midscale: "#2d2d44",
};

const CHAIN_LOGOS: Record<string, string> = {
  Jaz: "JZ",
  Sunrise: "SR",
  Pickalbatros: "PB",
  Pyramisa: "PY",
  Baron: "BR",
  Siva: "SV",
  "Stella Di Mare": "ST",
  "Desert Rose": "DR",
  "Reef Oasis": "RO",
  Tropitel: "TR",
  "Al Nabila": "AN",
  Tolip: "TL",
  Helnan: "HL",
  Arabella: "AR",
  "Coral Sea": "CS",
  Charmillion: "CH",
  Savoy: "SY",
  Porto: "PT",
  "Paradise Inn": "PI",
  Continental: "CN",
  "Old Palace": "OP",
  "Jasmine Palace": "JM",
  "Sea Star": "SS",
  Amarina: "AM",
};

const CHAIN_COUNTS: Record<string, number> = {};
for (const h of LOCAL_HOTELS) {
  CHAIN_COUNTS[h.chain] = (CHAIN_COUNTS[h.chain] || 0) + 1;
}

export function OurClientsSection() {
  const [activeTier, setActiveTier] = useState("all");
  const [activeChain, setActiveChain] = useState<string | "all">("all");

  const tiers = ["all", ...Array.from(new Set(LOCAL_HOTELS.map((h) => h.tier)))];
  const chains = Array.from(new Set(LOCAL_HOTELS.map((h) => h.chain))).sort(
    (a, b) => (CHAIN_COUNTS[b] || 0) - (CHAIN_COUNTS[a] || 0)
  );

  const filtered = LOCAL_HOTELS.filter((h) => {
    if (activeTier !== "all" && h.tier !== activeTier) return false;
    if (activeChain !== "all" && h.chain !== activeChain) return false;
    return true;
  });

  const totalGmv = LOCAL_HOTELS.reduce((s, h) => s + h.monthly_gmv_egp, 0);

  return (
    <section className="py-16 bg-[#0a0a0a] border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-accent-base tracking-[0.18em] uppercase mb-3">
            Egyptian Hotel Partners
          </p>
          <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-[-0.02em]">
            Local Chains, Real Properties
          </h2>
          <p className="mt-2 text-[14px] text-gray-400 max-w-xl">
            {LOCAL_HOTELS.length}+ Egyptian-owned properties across the Red Sea,
            South Sinai, Nile Valley, and Mediterranean coast.
            No international franchises — just local groups powering local hospitality.
          </p>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {LOCAL_HOTELS.length} properties
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              EGP {(totalGmv / 1_000_000).toFixed(0)}M+ monthly GMV
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {chains.length} Egyptian groups
            </span>
          </div>
        </div>

        {/* Chain filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveChain("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
              activeChain === "all"
                ? "bg-accent-base text-white border-accent-base"
                : "bg-[#111] text-gray-400 border-white/10 hover:text-white"
            }`}
          >
            All Groups
          </button>
          {chains.map((chain) => (
            <button
              key={chain}
              onClick={() => setActiveChain(chain)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                activeChain === chain
                  ? "bg-accent-base text-white border-accent-base"
                  : "bg-[#111] text-gray-400 border-white/10 hover:text-white"
              }`}
            >
              {chain}
              <span className="ml-1 text-gray-600">
                ({CHAIN_COUNTS[chain]})
              </span>
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeTier === tier
                  ? "bg-white text-black"
                  : "bg-white/5 text-gray-500 border border-white/10 hover:text-white"
              }`}
            >
              {tier === "all" ? "All Tiers" : TIER_LABELS[tier] || tier}
            </button>
          ))}
        </div>

        {/* Hotel grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="group p-4 rounded-xl bg-[#111] border border-white/10 hover:border-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                  style={{
                    background:
                      TIER_COLORS[hotel.tier] || TIER_COLORS.midscale,
                  }}
                >
                  {CHAIN_LOGOS[hotel.chain] ||
                    hotel.chain.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    background:
                      (TIER_COLORS[hotel.tier] || TIER_COLORS.midscale) +
                      "25",
                    color: TIER_COLORS[hotel.tier] || TIER_COLORS.midscale,
                  }}
                >
                  {TIER_LABELS[hotel.tier] || hotel.tier}
                </span>
              </div>

              <h3 className="text-[13px] font-semibold text-white leading-snug mb-1 group-hover:text-accent-base transition-colors">
                {hotel.name}
              </h3>

              <p className="text-[11px] text-gray-500 mb-2">{hotel.chain}</p>

              <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                {hotel.city}, {hotel.governorate}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {hotel.rooms} rooms
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  EGP {(hotel.monthly_gmv_egp / 1_000_000).toFixed(1)}M/mo
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[13px] text-gray-600">
            No properties match the selected filters.
          </div>
        )}
      </div>
    </section>
  );
}
