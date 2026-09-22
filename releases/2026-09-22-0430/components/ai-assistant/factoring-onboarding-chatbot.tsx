"use client";

import { Landmark } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Landmark,
  accentVar: "--purple-base" as const,
  title: "AI Agent",
  subtitle: "Factoring & Finance",
  tooltip: "Talk to our AI Agent",
  initialMessage:
    "Hi! I'm the HotelsVendors AI assistant for factoring companies. Ask me anything about invoice financing, risk scoring, KYC workflows, or partner onboarding.",
};

export function FactoringOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
