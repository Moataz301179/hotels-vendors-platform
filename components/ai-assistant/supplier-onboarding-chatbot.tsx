"use client";

import { Bot } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Bot,
  accentVar: "--success" as const,
  title: "AI Agent",
  subtitle: "Supplier Onboarding",
  tooltip: "Talk to our AI Agent",
  initialMessage:
    "Hi! I'm the HotelsVendors AI Agent. Ask me anything about the platform, hotel procurement, supplier registration, financing, logistics, or compliance.",
};

export function SupplierOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
