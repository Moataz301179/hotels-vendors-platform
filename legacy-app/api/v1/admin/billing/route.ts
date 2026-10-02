import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  requirePermission,
  validateBody,
  success,
  audit,
} from "@/lib/api-utils";

const BillingSettingsSchema = z.object({
  platformFeeRate: z.number().min(0).max(100).optional(),
  minOrderFee: z.number().min(0).optional(),
  maxOrderFee: z.number().min(0).optional(),

  supplierTierBRate: z.number().min(0).max(100).optional(),
  supplierTierARate: z.number().min(0).max(100).optional(),
  supplierTierSRate: z.number().min(0).max(100).optional(),

  referralEnabled: z.boolean().optional(),
  refereeDiscountPct: z.number().min(0).max(100).optional(),
  referrerBonusEgp: z.number().min(0).optional(),
  maxReferralUses: z.number().int().min(0).optional(),

  payoutDay: z.number().int().min(1).max(28).optional(),
  payoutCurrency: z.string().min(3).max(3).optional(),
  autoPayoutEnabled: z.boolean().optional(),
  minPayoutThreshold: z.number().min(0).optional(),

  bankName: z.string().max(100).nullable().optional(),
  bankAccountName: z.string().max(100).nullable().optional(),
  bankAccountNumber: z.string().max(50).nullable().optional(),
  bankIban: z.string().max(50).nullable().optional(),
  bankSwiftCode: z.string().max(20).nullable().optional(),
  bankBranch: z.string().max(100).nullable().optional(),
});

async function getOrCreateSettings() {
  const existing = await prisma.platformSettings.findFirst();
  if (existing) return existing;
  return prisma.platformSettings.create({ data: {} });
}

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const settings = await getOrCreateSettings();

  return success({
    fees: {
      platformFeeRate: Number(settings.platformFeeRate),
      minOrderFee: Number(settings.minOrderFee),
      maxOrderFee: Number(settings.maxOrderFee),
    },
    supplierTiers: {
      tierB: Number(settings.supplierTierBRate),
      tierA: Number(settings.supplierTierARate),
      tierS: Number(settings.supplierTierSRate),
    },
    referral: {
      enabled: settings.referralEnabled,
      refereeDiscountPct: Number(settings.refereeDiscountPct),
      referrerBonusEgp: Number(settings.referrerBonusEgp),
      maxReferralUses: settings.maxReferralUses,
    },
    payout: {
      day: settings.payoutDay,
      currency: settings.payoutCurrency,
      autoPayoutEnabled: settings.autoPayoutEnabled,
      minPayoutThreshold: Number(settings.minPayoutThreshold),
    },
    bank: {
      name: settings.bankName,
      accountName: settings.bankAccountName,
      accountNumber: settings.bankAccountNumber,
      iban: settings.bankIban,
      swiftCode: settings.bankSwiftCode,
      branch: settings.bankBranch,
    },
  });
});

export const PUT = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const body = await request.json();
  const data = validateBody(BillingSettingsSchema, body);

  const before = await getOrCreateSettings();

  const settings = await prisma.platformSettings.update({
    where: { id: before.id },
    data: {
      ...(data.platformFeeRate !== undefined && { platformFeeRate: data.platformFeeRate }),
      ...(data.minOrderFee !== undefined && { minOrderFee: data.minOrderFee }),
      ...(data.maxOrderFee !== undefined && { maxOrderFee: data.maxOrderFee }),
      ...(data.supplierTierBRate !== undefined && { supplierTierBRate: data.supplierTierBRate }),
      ...(data.supplierTierARate !== undefined && { supplierTierARate: data.supplierTierARate }),
      ...(data.supplierTierSRate !== undefined && { supplierTierSRate: data.supplierTierSRate }),
      ...(data.referralEnabled !== undefined && { referralEnabled: data.referralEnabled }),
      ...(data.refereeDiscountPct !== undefined && { refereeDiscountPct: data.refereeDiscountPct }),
      ...(data.referrerBonusEgp !== undefined && { referrerBonusEgp: data.referrerBonusEgp }),
      ...(data.maxReferralUses !== undefined && { maxReferralUses: data.maxReferralUses }),
      ...(data.payoutDay !== undefined && { payoutDay: data.payoutDay }),
      ...(data.payoutCurrency !== undefined && { payoutCurrency: data.payoutCurrency }),
      ...(data.autoPayoutEnabled !== undefined && { autoPayoutEnabled: data.autoPayoutEnabled }),
      ...(data.minPayoutThreshold !== undefined && { minPayoutThreshold: data.minPayoutThreshold }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.bankAccountName !== undefined && { bankAccountName: data.bankAccountName }),
      ...(data.bankAccountNumber !== undefined && { bankAccountNumber: data.bankAccountNumber }),
      ...(data.bankIban !== undefined && { bankIban: data.bankIban }),
      ...(data.bankSwiftCode !== undefined && { bankSwiftCode: data.bankSwiftCode }),
      ...(data.bankBranch !== undefined && { bankBranch: data.bankBranch }),
    },
  });

  await audit({
    entityType: "platform_settings",
    entityId: settings.id,
    action: "BILLING_SETTINGS_UPDATE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: {
      platformFeeRate: Number(before.platformFeeRate),
      supplierTierBRate: Number(before.supplierTierBRate),
      supplierTierARate: Number(before.supplierTierARate),
      supplierTierSRate: Number(before.supplierTierSRate),
    },
    afterState: {
      platformFeeRate: Number(settings.platformFeeRate),
      supplierTierBRate: Number(settings.supplierTierBRate),
      supplierTierARate: Number(settings.supplierTierARate),
      supplierTierSRate: Number(settings.supplierTierSRate),
    },
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return success({ message: "Billing settings updated" });
});
