import type { PlanConfig, PlanType } from "@/types";

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: "Free",
    price_monthly: 0,
    price_label: "₹0",
    dm_limit: 100,
    max_automations: 2,
    max_accounts: 1,
    ai_enabled: false,
    analytics: false,
    features: [
      "100 DMs/month",
      "2 automations",
      "1 Instagram account",
      "Basic templates",
    ],
  },
  starter: {
    name: "Starter",
    price_monthly: 49900, // ₹499 in paise
    price_label: "₹499",
    dm_limit: 1000,
    max_automations: 5,
    max_accounts: 1,
    ai_enabled: false,
    analytics: true,
    features: [
      "1,000 DMs/month",
      "5 automations",
      "1 Instagram account",
      "Analytics dashboard",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    price_monthly: 199900, // ₹1,999 in paise
    price_label: "₹1,999",
    dm_limit: 5000,
    max_automations: -1, // unlimited
    max_accounts: 3,
    ai_enabled: true,
    analytics: true,
    features: [
      "5,000 DMs/month",
      "Unlimited automations",
      "3 Instagram accounts",
      "AI Smart Replies",
      "Full analytics",
      "Priority support",
    ],
  },
  business: {
    name: "Business",
    price_monthly: 499900, // ₹4,999 in paise
    price_label: "₹4,999",
    dm_limit: 20000,
    max_automations: -1,
    max_accounts: 10,
    ai_enabled: true,
    analytics: true,
    features: [
      "20,000 DMs/month",
      "Unlimited automations",
      "10 Instagram accounts",
      "AI Smart Replies",
      "Full analytics",
      "API access",
      "Dedicated support",
    ],
  },
  agency: {
    name: "Agency",
    price_monthly: 999900, // ₹9,999 in paise
    price_label: "₹9,999",
    dm_limit: -1, // unlimited
    max_automations: -1,
    max_accounts: -1, // unlimited
    ai_enabled: true,
    analytics: true,
    features: [
      "Unlimited DMs",
      "Unlimited automations",
      "Unlimited accounts",
      "AI Smart Replies",
      "Full analytics",
      "White-label option",
      "Dedicated account manager",
    ],
  },
};
