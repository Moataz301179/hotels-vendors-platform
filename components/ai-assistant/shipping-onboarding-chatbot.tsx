"use client";

import { Truck } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Truck,
  accentVar: "--info" as const,
  title: "AI Assistant",
  subtitle: "Carriers & logistics",
  tooltip: "Talk to the AI Assistant",
  initialMessage:
    "Hi — I’m the HOTELSVENDORS AI Assistant for carriers. Ask about logistics onboarding, delivery workflows, or HOVIN tracking codes. Accept and decline stay on the carrier portal.",
};

export function ShippingOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
