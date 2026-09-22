/**
 * Egyptian Hotel Directory Scrapers
 * Collects hotel data from public sources for Lead Scout agent
 */

import { prisma } from "@/lib/prisma";
import { storeMemory } from "@/lib/swarm/memory";

interface ScrapedHotel {
  name: string;
  city: string;
  governorate: string;
  starRating?: number;
  roomCount?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  source: string;
}

const EGYPTIAN_CITIES = [
  { name: "Cairo", governorate: "Cairo", keywords: ["Cairo", "Giza", "New Cairo", "6th of October"] },
  { name: "Alexandria", governorate: "Alexandria", keywords: ["Alexandria", "Borg El Arab"] },
  { name: "Hurghada", governorate: "Red Sea", keywords: ["Hurghada", "El Gouna", "Sahl Hasheesh"] },
  { name: "Sharm El-Sheikh", governorate: "South Sinai", keywords: ["Sharm El-Sheikh", "Naama Bay", "Sharks Bay"] },
  { name: "Luxor", governorate: "Luxor", keywords: ["Luxor", "West Bank"] },
  { name: "Aswan", governorate: "Aswan", keywords: ["Aswan", "Elephantine"] },
  { name: "North Coast", governorate: "Matrouh", keywords: ["North Coast", "Sahel", "Marina", "Hacienda", "Sidi Abdel Rahman"] },
  { name: "Ain Sokhna", governorate: "Suez", keywords: ["Ain Sokhna", "Galala", "Zafarana"] },
  { name: "Dahab", governorate: "South Sinai", keywords: ["Dahab", "Blue Hole"] },
];

/**
 * Seed known high-value Egyptian hotels (manually curated list)
 * This is the fastest way to bootstrap the lead pipeline
 */
export async function seedKnownHotels(): Promise<number> {
  const knownHotels: ScrapedHotel[] = [
    // Cairo — 5-Star
    { name: "Four Seasons Hotel Cairo at Nile Plaza", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 365, address: "1089 Corniche El Nil", source: "manual_seed" },
    { name: "Four Seasons Hotel Cairo at The First Residence", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 269, address: "35 Giza Street", source: "manual_seed" },
    { name: "The Nile Ritz-Carlton", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 331, address: "1113 Corniche El Nil", source: "manual_seed" },
    { name: "Kempinski Nile Hotel", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 191, address: "12 Ahmed Ragheb Street", source: "manual_seed" },
    { name: "Fairmont Nile City", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 540, address: "Nile City Towers", source: "manual_seed" },
    { name: "St. Regis Cairo", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 366, address: "Corniche El Nil", source: "manual_seed" },
    { name: "Marriott Mena House", city: "Giza", governorate: "Giza", starRating: 5, roomCount: 331, address: "Pyramids Road", source: "manual_seed" },
    { name: "InterContinental Cairo Semiramis", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 726, address: "Corniche El Nil", source: "manual_seed" },
    { name: "Sheraton Cairo Hotel", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 650, address: "Galae Square", source: "manual_seed" },
    { name: "Conrad Cairo", city: "Cairo", governorate: "Cairo", starRating: 5, roomCount: 617, address: "1191 Corniche El Nil", source: "manual_seed" },
    { name: "Hyatt Regency Cairo West", city: "6th of October", governorate: "Giza", starRating: 5, roomCount: 250, address: "Cairo-Alexandria Desert Road", source: "manual_seed" },
    { name: "Mövenpick Hotel Cairo-Media City", city: "6th of October", governorate: "Giza", starRating: 5, roomCount: 420, address: "Media City", source: "manual_seed" },

    // Alexandria
    { name: "Four Seasons Alexandria", city: "Alexandria", governorate: "Alexandria", starRating: 5, roomCount: 137, address: "399 El Geish Road", source: "manual_seed" },
    { name: "Hilton Alexandria Corniche", city: "Alexandria", governorate: "Alexandria", starRating: 5, roomCount: 288, address: "544 El Geish Road", source: "manual_seed" },
    { name: "Steigenberger Cecil Hotel", city: "Alexandria", governorate: "Alexandria", starRating: 5, roomCount: 85, address: "16 Saad Zaghloul Square", source: "manual_seed" },
    { name: "Tolip Hotel Alexandria", city: "Alexandria", governorate: "Alexandria", starRating: 5, roomCount: 300, address: "El Shatby", source: "manual_seed" },

    // Hurghada
    { name: "Hurghada Marriott Beach Resort", city: "Hurghada", governorate: "Red Sea", starRating: 5, roomCount: 284, address: "New Marina", source: "manual_seed" },
    { name: "Steigenberger Al Dau Beach Hotel", city: "Hurghada", governorate: "Red Sea", starRating: 5, roomCount: 388, address: "Village Road", source: "manual_seed" },
    { name: "Baron Palace Sahl Hasheesh", city: "Hurghada", governorate: "Red Sea", starRating: 5, roomCount: 600, address: "Sahl Hasheesh", source: "manual_seed" },
    { name: "The Oberoi Beach Resort Sahl Hasheesh", city: "Hurghada", governorate: "Red Sea", starRating: 5, roomCount: 102, address: "Sahl Hasheesh", source: "manual_seed" },

    // Sharm El-Sheikh
    { name: "Four Seasons Sharm El Sheikh", city: "Sharm El-Sheikh", governorate: "South Sinai", starRating: 5, roomCount: 136, address: "1 Four Seasons Boulevard", source: "manual_seed" },
    { name: "Ritz-Carlton Sharm El Sheikh", city: "Sharm El-Sheikh", governorate: "South Sinai", starRating: 5, roomCount: 321, address: "Om El Seid Hill", source: "manual_seed" },
    { name: "Rixos Premium Seagate", city: "Sharm El-Sheikh", governorate: "South Sinai", starRating: 5, roomCount: 798, address: "Nabq Bay", source: "manual_seed" },

    // North Coast (Sahel)
    { name: "Hacienda Bay Hotel", city: "North Coast", governorate: "Matrouh", starRating: 5, roomCount: 150, address: "Hacienda Bay", source: "manual_seed" },
    { name: "Marina Lodge Hotel", city: "North Coast", governorate: "Matrouh", starRating: 4, roomCount: 200, address: "Marina El Alamein", source: "manual_seed" },
    { name: "Porto Marina Resort", city: "North Coast", governorate: "Matrouh", starRating: 4, roomCount: 350, address: "Porto Marina", source: "manual_seed" },

    // Luxor & Aswan
    { name: "Hilton Luxor", city: "Luxor", governorate: "Luxor", starRating: 5, roomCount: 236, address: "New Karnak", source: "manual_seed" },
    { name: "Sofitel Legend Old Cataract Aswan", city: "Aswan", governorate: "Aswan", starRating: 5, roomCount: 138, address: "Abtal El Tahrir Street", source: "manual_seed" },

    // Ain Sokhna
    { name: "Mövenpick Resort El Sokhna", city: "Ain Sokhna", governorate: "Suez", starRating: 5, roomCount: 300, address: "Al Galala City", source: "manual_seed" },
    { name: "Porto Sokhna Resort", city: "Ain Sokhna", governorate: "Suez", starRating: 4, roomCount: 400, address: "Porto Sokhna", source: "manual_seed" },
  ];

  let created = 0;
  const platformTenantId = "platform";

  for (const hotel of knownHotels) {
    const existing = await prisma.lead.findFirst({
      where: { name: hotel.name, entityType: "HOTEL" },
    });

    if (!existing) {
      await prisma.lead.create({
        data: {
          entityType: "HOTEL",
          name: hotel.name,
          city: hotel.city,
          governorate: hotel.governorate,
          starRating: hotel.starRating || undefined,
          roomCount: hotel.roomCount || undefined,
          address: hotel.address,
          source: hotel.source,
          discoveredBy: "lead-scout",
          tier: hotel.starRating === 5 ? "GOLD" : hotel.starRating === 4 ? "SILVER" : "BRONZE",
          status: "DISCOVERED",
          priority: hotel.starRating === 5 ? 9 : hotel.starRating === 4 ? 7 : 5,
          tenantId: platformTenantId,
        },
      });
      created++;
    }
  }

  await storeMemory({
    tenantId: platformTenantId,
    agentId: "lead-scout",
    agentName: "Lead Scout",
    content: `Seeded ${created} known Egyptian hotels into lead pipeline. Total: ${knownHotels.length}`,
    memoryType: "LEAD",
    category: "lead",
  });

  return created;
}

/**
 * Discover hotels via Google Places / web search using OpenClaw
 * This runs in the background via the Lead Scout agent
 */
export async function discoverHotelsViaSearch(city: string): Promise<ScrapedHotel[]> {
  const openclawUrl = process.env.OPENCLAW_URL || "http://localhost:8000";

  try {
    const searchQuery = `best hotels in ${city} Egypt 5 star 4 star`;

    const res = await fetch(`${openclawUrl}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        engine: "google",
        max_results: 10,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.data?.results || [];

    const hotels: ScrapedHotel[] = results.map((r: { title?: string }) => ({
      name: r.title?.replace(/ - Google Search| - Tripadvisor| - Booking\.com/gi, ""),
      city,
      governorate: EGYPTIAN_CITIES.find((c) => c.name === city)?.governorate || city,
      source: "openclaw_search",
    }));

    return hotels.filter((h) => h.name && h.name.length > 3);
  } catch (e) {
    console.error("[LeadScout] Search failed:", e);
    return [];
  }
}

/**
 * Discover suppliers in industrial zones
 */
export async function seedKnownSuppliers(): Promise<number> {
  const knownSuppliers = [
    { name: "El Abd Foods", city: "6th of October", governorate: "Giza", category: "F&B", source: "manual_seed" },
    { name: "Egyptian Linens Co.", city: "10th of Ramadan", governorate: "Sharqia", category: "Linens", source: "manual_seed" },
    { name: "Nile Chemicals", city: "6th of October", governorate: "Giza", category: "Chemicals", source: "manual_seed" },
    { name: "Cairo Hospitality Supplies", city: "Cairo", governorate: "Cairo", category: "FF&E", source: "manual_seed" },
    { name: "Red Sea Fisheries", city: "Hurghada", governorate: "Red Sea", category: "F&B", source: "manual_seed" },
    { name: "Delta Food Supply", city: "6th of October", governorate: "Giza", category: "F&B", source: "manual_seed" },
    { name: "Alexandria Textile Mills", city: "Alexandria", governorate: "Alexandria", category: "Linens", source: "manual_seed" },
    { name: "Sinai Fresh Produce", city: "Sharm El-Sheikh", governorate: "South Sinai", category: "F&B", source: "manual_seed" },
  ];

  let created = 0;
  const platformTenantId = "platform";

  for (const supplier of knownSuppliers) {
    const existing = await prisma.lead.findFirst({
      where: { name: supplier.name, entityType: "SUPPLIER" },
    });

    if (!existing) {
      await prisma.lead.create({
        data: {
          entityType: "SUPPLIER",
          name: supplier.name,
          city: supplier.city,
          governorate: supplier.governorate,
          category: supplier.category,
          source: supplier.source,
          discoveredBy: "lead-scout",
          tier: "SILVER",
          status: "DISCOVERED",
          priority: 7,
          tenantId: platformTenantId,
        },
      });
      created++;
    }
  }

  return created;
}
