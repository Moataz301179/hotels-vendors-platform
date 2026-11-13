"use client";

import { Bot } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Bot,
  accentVar: "--success" as const,
  title: "AI Assistant",
  subtitle: "HotelsVendors guide",
  tooltip: "Talk to the AI Assistant",
  initialMessage:
    "Hi — I’m the HOTELSVENDORS AI Assistant. Ask about supplier or hotel registration, sealed procurement, HOVIN tracking, marketplace sourcing, financing referrals, or ETA compliance. I can open the right next page for you.",
};

export function SupplierOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
