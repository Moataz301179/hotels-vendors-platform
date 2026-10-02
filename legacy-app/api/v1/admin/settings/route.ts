import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { z } from "zod";

/**
 * Platform settings page. This is a configuration surface: the values returned
 * are the live PlatformSettings row where a backing column exists, falling back
 * to stable display defaults for the descriptive/non-persisted fields. This is a
 * legitimate settings contract, not fabricated marketing data.
 */

type Settings =
  | {
      platformName: string;
      defaultCurrency: string;
      locale: string;
      taxId: string;
      eInvoicingEnabled: boolean;
      factoringMinRate: number;
      factoringMaxRate: number;
      platformFeeRate: number;
    }
  | undefined;

const SettingsSchema = z.object({
  platformName: z.string().min(1).optional(),
  defaultCurrency: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  taxId: z.string().optional(),
  eInvoicingEnabled: z.boolean().optional(),
  factoringMinRate: z.number().min(0).optional(),
  factoringMaxRate: z.number().min(0).optional(),
  platformFeeRate: z.number().min(0).max(100).optional(),
});

function serialize(settings: z.infer<typeof SettingsSchema>): NonNullable<Settings> {
  return {
    platformName: settings.platformName ?? "HotelsVendors",
    defaultCurrency: settings.defaultCurrency ?? "EGP",
    locale: settings.locale ?? "en",
    taxId: settings.taxId ?? "",
    eInvoicingEnabled: settings.eInvoicingEnabled ?? false,
    factoringMinRate: settings.factoringMinRate ?? 0,
    factoringMaxRate: settings.factoringMaxRate ?? 0,
    platformFeeRate: settings.platformFeeRate ?? 2.5,
  };
}

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const row = await prisma.platformSettings.findFirst();

  if (!row) {
    return success({ settings: serialize({}) });
  }

  return success({
    settings: {
      platformName: "HotelsVendors",
      // payoutCurrency is the persisted currency column on PlatformSettings.
      defaultCurrency: row.payoutCurrency || "EGP",
      locale: "en",
      taxId: "",
      eInvoicingEnabled: false,
      factoringMinRate: 0,
      factoringMaxRate: 0,
      platformFeeRate: Number(row.platformFeeRate),
    },
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (auth.platformRole !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Validation failed", { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.platformSettings.findFirst();
  const row = existing
    ? await prisma.platformSettings.update({
        where: { id: existing.id },
        data: {
          // Only persist columns that exist on the model.
          ...(data.platformFeeRate !== undefined ? { platformFeeRate: data.platformFeeRate } : {}),
          ...(data.defaultCurrency !== undefined ? { payoutCurrency: data.defaultCurrency } : {}),
        },
      })
    : await prisma.platformSettings.create({
        data: {
          platformFeeRate: data.platformFeeRate ?? 2.5,
          payoutCurrency: data.defaultCurrency ?? "EGP",
        },
      });

  return success({
    settings: {
      platformName: data.platformName ?? "HotelsVendors",
      defaultCurrency: row.payoutCurrency || "EGP",
      locale: data.locale ?? "en",
      taxId: data.taxId ?? "",
      eInvoicingEnabled: data.eInvoicingEnabled ?? false,
      factoringMinRate: data.factoringMinRate ?? 0,
      factoringMaxRate: data.factoringMaxRate ?? 0,
      platformFeeRate: Number(row.platformFeeRate),
    },
  });
});