"use client";

import { Truck } from "lucide-react";
import { BaseOnboardingBot } from "./base-onboarding-chatbot";

const config = {
  icon: Truck,
  accentVar: "--info" as const,
  title: "AI Agent",
  subtitle: "Shipping & Logistics",
  tooltip: "Talk to our AI Agent",
  initialMessage:
    "Hi! I'm the HotelsVendors AI assistant for logistics. Ask me anything about fleet onboarding, delivery workflows, route optimization, or platform features.",
};

export function ShippingOnboardingBot() {
  return <BaseOnboardingBot config={config} />;
}
