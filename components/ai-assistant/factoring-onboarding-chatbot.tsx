"use client";

import { Landmark } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Landmark,
  accentVar: "--purple-base" as const,
  title: "AI Assistant",
  subtitle: "Funding referrals",
  tooltip: "Talk to the AI Assistant",
  initialMessage:
    "Hi — I’m the HOTELSVENDORS AI Assistant for funding referrals. Ask about invoice financing referrals, partner onboarding, or how external funders underwrite. HotelsVendors is not a lender.",
};

export function FactoringOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
