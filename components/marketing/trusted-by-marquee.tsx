"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LocalChain {
  name: string;
  shortName: string;
  initials: string;
  color: string;
  properties: number;
  locations: string;
}

const LOCAL_CHAINS: LocalChain[] = [
  {
    name: "Jaz Hotel Group",
    shortName: "Jaz",
    initials: "JZ",
    color: "#1B5E20",
    properties: 75,
    locations: "Cairo, Hurghada, Sharm, Luxor, Marsa Alam",
  },
  {
    name: "Sunrise Hotels & Resorts",
    shortName: "Sunrise",
    initials: "SR",
    color: "#E65100",
    properties: 28,
    locations: "Hurghada, Sharm, Marsa Alam, Sahl Hasheesh",
  },
  {
    name: "Pickalbatros",
    shortName: "Pickalbatros",
    initials: "PB",
    color: "#00695C",
    properties: 22,
    locations: "Hurghada, Sharm, Makadi Bay, Sahl Hasheesh",
  },
  {
    name: "Pyramisa Hotels",
    shortName: "Pyramisa",
    initials: "PY",
    color: "#6A1B9A",
    properties: 12,
    locations: "Cairo, Giza, Aswan, Sahl Hasheesh",
  },
  {
    name: "Baron Hotels & Resorts",
    shortName: "Baron",
    initials: "BR",
    color: "#4A148C",
    properties: 8,
    locations: "Sharm, Sahl Hasheesh, Taba",
  },
  {
    name: "Siva Hotels",
    shortName: "Siva",
    initials: "SV",
    color: "#455A64",
    properties: 6,
    locations: "Hurghada, Sharm, Makadi Bay",
  },
  {
    name: "Stella Hotels",
    shortName: "Stella",
    initials: "ST",
    color: "#1565C0",
    properties: 5,
    locations: "Sharm, Makadi Bay, Ain Sokhna",
  },
  {
    name: "Desert Rose Resort",
    shortName: "Desert Rose",
    initials: "DR",
    color: "#BF360C",
    properties: 4,
    locations: "Hurghada, El Gouna",
  },
  {
    name: "Reef Oasis Hotels",
    shortName: "Reef Oasis",
    initials: "RO",
    color: "#0277BD",
    properties: 5,
    locations: "Sharm, Dahab",
  },
  {
    name: "Tropitel Hotels",
    shortName: "Tropitel",
    initials: "TR",
    color: "#33691E",
    properties: 6,
    locations: "Sahl Hasheesh, Naama Bay, El Gouna",
  },
  {
    name: "Al Nabila Hotels",
    shortName: "Al Nabila",
    initials: "AN",
    color: "#3E2723",
    properties: 4,
    locations: "Makadi Bay, Sahl Hasheesh",
  },
  {
    name: "Tolip Hotels",
    shortName: "Tolip",
    initials: "TL",
    color: "#1565C0",
    properties: 7,
    locations: "Cairo, Alexandria, Aswan, El Galaa",
  },
  {
    name: "Coral Sea Hotels",
    shortName: "Coral Sea",
    initials: "CS",
    color: "#006064",
    properties: 4,
    locations: "Sharm, Hurghada",
  },
  {
    name: "Charmillion Hotels",
    shortName: "Charmillion",
    initials: "CH",
    color: "#6D4C41",
    properties: 3,
    locations: "Sharm",
  },
  {
    name: "Arabella Hotels",
    shortName: "Arabella",
    initials: "AR",
    color: "#558B2F",
    properties: 3,
    locations: "Hurghada, El Gouna",
  },
];

export function TrustedByMarquee() {
  const duplicated = [...LOCAL_CHAINS, ...LOCAL_CHAINS];

  return (
    <section className="py-5 bg-[#050505] border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-white/25 uppercase tracking-[0.15em]">
            Trusted by Egypt&apos;s Leading Hotel Groups
          </p>
          <Link
            href="/hotels"
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
          >
            View all 52+ properties
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
              <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {duplicated.map((chain, i) => (
            <div
              key={`${chain.initials}-${i}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.015] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all shrink-0 cursor-default group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ backgroundColor: `${chain.color}18`, color: chain.color }}
              >
                {chain.initials}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-white/70 group-hover:text-white/90 transition-colors whitespace-nowrap">
                  {chain.shortName}
                </div>
                <div className="text-[9px] text-white/20 whitespace-nowrap">
                  {chain.properties} properties
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
