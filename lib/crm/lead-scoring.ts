import type { Lead, OutreachLog } from "@prisma/client";

interface LeadScoreInput {
  entityType: string;
  starRating: number | null;
  roomCount: number | null;
  city: string | null;
  lastContactAt: Date | string | null;
  contactCount: number;
  responseCount: number;
}

export function calculateLeadScore(lead: LeadScoreInput): number {
  let score = 0;

  switch (lead.entityType) {
    case "HOTEL":
      score += 25;
      break;
    case "SUPPLIER":
      score += 20;
      break;
    case "FACTOR":
      score += 15;
      break;
    case "LOGISTICS":
      score += 10;
      break;
  }

  if (lead.starRating) {
    if (lead.starRating >= 5) score += 20;
    else if (lead.starRating >= 4) score += 15;
    else if (lead.starRating >= 3) score += 10;
  }

  if (lead.roomCount) {
    if (lead.roomCount > 500) score += 15;
    else if (lead.roomCount >= 300) score += 10;
    else score += 5;
  }

  if (lead.city) {
    const c = lead.city.toLowerCase();
    if (c.includes("red sea") || c.includes("hurghada") || c.includes("sharm"))
      score += 15;
    else if (c.includes("cairo") || c.includes("giza")) score += 10;
    else score += 5;
  }

  if (lead.responseCount > 0) score += 15;
  else if (lead.contactCount > 0) score += 3;

  if (lead.lastContactAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lead.lastContactAt).getTime()) / 86400000
    );
    if (daysSince < 7) score += 10;
    else if (daysSince < 30) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

export function formatScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400 bg-emerald-500/10";
  if (score >= 50) return "text-blue-400 bg-blue-500/10";
  if (score >= 30) return "text-amber-400 bg-amber-500/10";
  return "text-white/40 bg-white/5";
}
