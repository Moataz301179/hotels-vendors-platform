import { HOTEL_SYSTEM_PROMPT } from "./hotel-prompt"
import { SUPPLIER_SYSTEM_PROMPT } from "./supplier-prompt"
import { FACTORING_SYSTEM_PROMPT } from "./factoring-prompt"
import { SHIPPING_SYSTEM_PROMPT } from "./shipping-prompt"
import { ADMIN_SYSTEM_PROMPT } from "./admin-prompt"

export type AssistantRole = "hotel" | "supplier" | "factoring" | "shipping" | "admin"

const rolePrompts: Record<AssistantRole, string> = {
  hotel: HOTEL_SYSTEM_PROMPT,
  supplier: SUPPLIER_SYSTEM_PROMPT,
  factoring: FACTORING_SYSTEM_PROMPT,
  shipping: SHIPPING_SYSTEM_PROMPT,
  admin: ADMIN_SYSTEM_PROMPT,
}

export function buildSystemPrompt(role: AssistantRole, context?: string): string {
  const base = rolePrompts[role] || rolePrompts.hotel
  return base + (context ? "\n\nCurrent context:\n" + context : "") + "\n\nAlways be concise and actionable."
}
