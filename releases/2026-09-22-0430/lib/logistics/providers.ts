/**
 * Egypt Logistics Provider Registry
 * Local-first: Bosta, Mylerz, 1Trolley, R2S, Sprint, Naqla + Aramex rail.
 * Each provider connects via API key stored in tenant settings. Once a key is
 * saved, the adapter becomes operational immediately (no hardcoded credentials).
 */

export type ProviderId =
  | "bosta" | "mylerz" | "onetrolley" | "r2s" | "sprint" | "naqla" | "aramex";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  type: "last_mile" | "freight" | "aggregator";
  hasApiKey: boolean;
  checkoutBaseUrl?: string;
  deliveryTypes: ("express" | "regular")[];
  coverage: string[];
  /** If present, this is the live, working URL the merchant configures in settings */
  apiBaseUrl?: string;
}

export const EGYPT_PROVIDERS: ProviderConfig[] = [
  { id: "bosta", name: "Bosta", type: "last_mile", hasApiKey: true, deliveryTypes: ["express", "regular"], coverage: ["Cairo", "Giza", "Alexandria", "Nationwide"], apiBaseUrl: "https://api.bosta.co" },
  { id: "mylerz", name: "Mylerz", type: "last_mile", hasApiKey: true, deliveryTypes: ["express", "regular"], coverage: ["Cairo", "Nationwide"], apiBaseUrl: "https://api.mylerz.net" },
  { id: "onetrolley", name: "1Trolley", type: "aggregator", hasApiKey: true, deliveryTypes: ["express", "regular"], coverage: ["Nationwide"], apiBaseUrl: "https://api.1trolley.com" },
  { id: "r2s", name: "R2S", type: "last_mile", hasApiKey: true, deliveryTypes: ["regular"], coverage: ["Cairo", "Delta"], apiBaseUrl: "https://api.r2s-logistics.com" },
  { id: "sprint", name: "Sprint Logistics", type: "last_mile", hasApiKey: true, deliveryTypes: ["express", "regular"], coverage: ["Nationwide"], apiBaseUrl: "https://api.sprintlogistics.com" },
  { id: "naqla", name: "Naqla", type: "freight", hasApiKey: true, deliveryTypes: ["regular"], coverage: ["Cairo", "Red Sea", "Sinai", "Upper Egypt"], apiBaseUrl: "https://api.naqla.com" },
  { id: "aramex", name: "Aramex", type: "last_mile", hasApiKey: true, deliveryTypes: ["express", "regular"], coverage: ["Global"], apiBaseUrl: "https://api.aramex.com" },
];

export function getProvider(id: string): ProviderConfig | undefined {
  return EGYPT_PROVIDERS.find((p) => p.id === id);
}

export function listProviders(): ProviderConfig[] {
  return EGYPT_PROVIDERS;
}

/**
 * Resolves the actual answerable provider for a shipment: prefers an aggregator
 * that surveys all connected local couriers, falls back to a specific provider.
 */
export function resolveProvider(
  preferredId: string | null,
  destinationCity: string,
  isExpress: boolean,
  connectedKeys: string[]
): ProviderConfig | null {
  // Region → known hub cities, so freight carriers covering "Red Sea" match Sharm/Hurghada etc.
  const HUB_REGION: Record<string, string> = {
    "Sharm El Sheikh": "Sinai", "Dahab": "Sinai", "Nuweiba": "Sinai", "Taba": "Sinai",
    "Hurghada": "Red Sea", "El Gouna": "Red Sea", "Safaga": "Red Sea", "Soma Bay": "Red Sea", "Marsa Alam": "Red Sea",
    "Aswan": "Upper Egypt", "Luxor": "Upper Egypt", "Minya": "Upper Egypt", "Assiut": "Upper Egypt", "Sohag": "Upper Egypt", "Qena": "Upper Egypt",
    "Alexandria": "Alexandria", "Matruh": "Matruh",
  };
  const hubRegion = HUB_REGION[destinationCity] || "";

  const candidates = EGYPT_PROVIDERS.filter(
    (p) =>
      connectedKeys.includes(p.id) &&
      (p.deliveryTypes.includes(isExpress ? "express" : "regular")) &&
      (p.coverage.some((c) =>
        c === "Nationwide" ||
        c.includes(destinationCity) || destinationCity.includes(c) ||
        (hubRegion && (c.includes(hubRegion) || hubRegion.includes(c)))
      ))
  );

  if (preferredId) {
    const pref = candidates.find((c) => c.id === preferredId);
    if (pref) return pref;
  }
  // Lowest-cost-first heuristic: last_mile preferred for parcels, freight for long haul
  const isFreight = ["Sharm El Sheikh", "Hurghada", "El Gouna", "Safaga", "Marsa Alam"].some(
    (h) => destinationCity.includes(h)
  );
  const typeOrder = isFreight ? ["freight", "last_mile", "aggregator"] : ["last_mile", "aggregator", "freight"];
  for (const t of typeOrder) {
    const c = candidates.find((p) => p.type === t);
    if (c) return c;
  }
  return candidates[0] || null;
}
