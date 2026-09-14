import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, handleApiError } from "@/lib/api-utils";
import { z } from "zod";

const STEPS_BY_ROLE: Record<string, string[]> = {
  HOTEL: ["profile_complete", "phone_verified", "kyc_level1", "property_added", "eta_setup", "first_order"],
  SUPPLIER: ["profile_complete", "phone_verified", "kyc_level1", "product_listed", "oliv_activated"],
  SHIPPING: ["profile_complete", "phone_verified", "zones_selected", "documents_uploaded"],
  FACTORING: ["profile_complete", "phone_verified", "kyc_level2"],
  ADMIN: ["profile_complete"],
};

const updateStepSchema = z.object({
  stepKey: z.string(),
  completed: z.boolean(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// GET — fetch onboarding progress for the current user
export const GET = apiRoute(async (_request: NextRequest) => {
  const ctx = await authenticate(_request);

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, platformRole: true, phoneVerifiedAt: true, kycLevel: true, name: true, email: true, phone: true },
  });

  if (!user) return error("User not found", 404);

  const role = user.platformRole;
  const steps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE.HOTEL;

  // Check auto-completed steps
  const autoSteps: Record<string, boolean> = {};
  if (user.phoneVerifiedAt) autoSteps.phone_verified = true;

  // Fetch or create progress record
  let progress = await prisma.onboardingProgress.findUnique({
    where: { userId: ctx.userId },
  });

  if (!progress) {
    progress = await prisma.onboardingProgress.create({
      data: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        platformRole: role as any,
        overallStatus: "IN_PROGRESS",
      },
    });
  }

  // Build step statuses from stored JSON + auto-detected
  const stepStatuses = steps.map((stepKey) => {
    const isAutoCompleted = autoSteps[stepKey] || false;
    return {
      stepKey,
      completed: isAutoCompleted,
      label: getStepLabel(stepKey),
      description: getStepDescription(stepKey, role),
      required: isRequiredStep(stepKey, role),
    };
  });

  const completedCount = stepStatuses.filter((s) => s.completed).length;
  const totalRequired = stepStatuses.filter((s) => s.required).length;
  const progressPercent = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

  return success({
    userId: ctx.userId,
    platformRole: role,
    overallStatus: progress.overallStatus,
    progressPercent,
    completedCount,
    totalSteps: steps.length,
    steps: stepStatuses,
    completedAt: progress.completedAt,
  });
});

// POST — mark a step as completed or update step data
export const POST = apiRoute(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const body = await request.json();
  const parsed = updateStepSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { platformRole: true },
  });

  if (!user) return error("User not found", 404);

  const role = user.platformRole;
  const steps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE.HOTEL;

  if (!steps.includes(parsed.stepKey)) {
    return error(`Invalid step key "${parsed.stepKey}" for role ${role}`, 400);
  }

  // Upsert progress record
  let progress = await prisma.onboardingProgress.findUnique({
    where: { userId: ctx.userId },
  });

  if (!progress) {
    progress = await prisma.onboardingProgress.create({
      data: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        platformRole: role as any,
        overallStatus: "IN_PROGRESS",
      },
    });
  }

  // Check if all required steps are now complete
  const autoSteps: Record<string, boolean> = {};
  const userFull = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { phoneVerifiedAt: true },
  });
  if (userFull?.phoneVerifiedAt) autoSteps.phone_verified = true;

  // For now, we track completion via the overall status
  // The actual step data will be derived from entity existence (hotel, supplier, etc.)
  const allComplete = steps.every((step) => autoSteps[step] || step === parsed.stepKey ? parsed.completed : false);

  const newStatus = allComplete ? "COMPLETED" : "IN_PROGRESS";

  await prisma.onboardingProgress.update({
    where: { id: progress.id },
    data: {
      overallStatus: newStatus as any,
      completedAt: allComplete ? new Date() : null,
    },
  });

  return success({
    stepKey: parsed.stepKey,
    completed: parsed.completed,
    overallStatus: newStatus,
  });
});

function getStepLabel(stepKey: string): string {
  const labels: Record<string, string> = {
    profile_complete: "Complete Your Profile",
    phone_verified: "Verify Phone Number",
    kyc_level1: "Submit KYC Documents",
    kyc_level2: "Submit Financial Documents",
    property_added: "Add Your First Property",
    eta_setup: "Connect ETA Credentials",
    first_order: "Place Your First Order",
    product_listed: "List Your First Product",
    oliv_activated: "Activate Oliv Financing",
    zones_selected: "Select Delivery Zones",
    documents_uploaded: "Upload Fleet Documents",
  };
  return labels[stepKey] || stepKey;
}

function getStepDescription(stepKey: string, role: string): string {
  const descriptions: Record<string, string> = {
    profile_complete: "Add your company name, address, and contact details",
    phone_verified: "We've sent a verification code to your phone",
    kyc_level1: "Upload your Commercial Registry and Tax ID for verification",
    kyc_level2: "Upload bank statements and financial documents",
    property_added: "Add your hotel or property details to start ordering",
    eta_setup: "Connect your Egyptian Tax Authority token for compliant invoicing",
    first_order: "Browse the catalog and place your first procurement order",
    product_listed: "Add your first product to the marketplace catalog",
    oliv_activated: "Activate Oliv financing to get paid in 48 hours",
    zones_selected: "Choose the governorates you deliver to",
    documents_uploaded: "Upload vehicle registration and insurance documents",
  };
  return descriptions[stepKey] || "";
}

function isRequiredStep(stepKey: string, role: string): boolean {
  // Phone verification and profile are always required
  if (["profile_complete", "phone_verified"].includes(stepKey)) return true;
  // Role-specific required steps
  if (role === "HOTEL") return ["kyc_level1", "property_added"].includes(stepKey);
  if (role === "SUPPLIER") return ["kyc_level1", "product_listed"].includes(stepKey);
  if (role === "SHIPPING") return ["zones_selected"].includes(stepKey);
  if (role === "FACTORING") return ["kyc_level2"].includes(stepKey);
  return false;
}
