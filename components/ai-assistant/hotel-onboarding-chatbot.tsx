"use client";

import { Hotel } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Hotel,
  accentVar: "--accent-base" as const,
  title: "AI Assistant",
  subtitle: "Hotel procurement",
  tooltip: "Talk to the AI Assistant",
  initialMessage:
    "Hi — I’m the HOTELSVENDORS AI Assistant for hotels. Ask about procurement, sealed supplier discovery, credit terms, ETA compliance, or onboarding. I can open the next public step for you.",
};

export function HotelOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
