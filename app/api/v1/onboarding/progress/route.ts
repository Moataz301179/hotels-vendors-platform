import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { z } from "zod";
import { jsonValueSchema } from "@/lib/validators/json-value";

async function clerkContext() {
  const { userId } = await auth();
  if (!userId) return null;
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true, platformRole: true },
  });
  if (!user) return null;
  return { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole };
}

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
  data: z.record(z.string(), jsonValueSchema).optional(),
});

// GET — fetch onboarding progress for the current user
export const GET = apiRoute(async (_request: NextRequest) => {
  const ctx = await clerkContext();
  if (!ctx) return error("Authenticated workspace required", 401);

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

  // GET is read-only. A missing progress record is represented as the
  // initial state and is created only by an explicit onboarding mutation.
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId: ctx.userId },
  });

  // Stored progress is tenant-scoped and survives reloads and new sessions.
  const storedSteps = await prisma.onboardingStepProgress.findMany({
    where: { userId: ctx.userId, tenantId: ctx.tenantId, deletedAt: null },
    select: { stepKey: true, completed: true, data: true },
  });
  const storedByKey = new Map(storedSteps.map((item) => [item.stepKey, item]));

  const stepStatuses = steps.map((stepKey) => {
    const stored = storedByKey.get(stepKey);
    const isAutoCompleted = autoSteps[stepKey] || false;
    return {
      stepKey,
      completed: isAutoCompleted || stored?.completed === true,
      data: stored?.data ?? null,
      label: getStepLabel(stepKey),
      description: getStepDescription(stepKey, role),
      required: isRequiredStep(stepKey, role),
    };
  });

  const completedCount = stepStatuses.filter((s) => s.completed).length;
  const totalRequired = stepStatuses.filter((s) => s.required).length;
  const completedRequired = stepStatuses.filter((s) => s.required && s.completed).length;
  const progressPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  return success({
    userId: ctx.userId,
    platformRole: role,
    overallStatus: progress?.overallStatus ?? "IN_PROGRESS",
    progressPercent,
    completedCount,
    totalSteps: steps.length,
    steps: stepStatuses,
    completedAt: progress?.completedAt ?? null,
  });
});

// POST — mark a step as completed or update step data
export const POST = apiRoute(async (request: NextRequest) => {
  const ctx = await clerkContext();
  if (!ctx) return error("Authenticated workspace required", 401);
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

  // Persist the individual step first, then derive overall status from all stored steps.
  await prisma.onboardingStepProgress.upsert({
    where: { userId_stepKey: { userId: ctx.userId, stepKey: parsed.stepKey } },
    create: {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      stepKey: parsed.stepKey,
      completed: parsed.completed,
      data: parsed.data,
    },
    update: {
      completed: parsed.completed,
      data: parsed.data,
      deletedAt: null,
    },
  });

  let progress = await prisma.onboardingProgress.findUnique({ where: { userId: ctx.userId } });
  if (!progress) {
    progress = await prisma.onboardingProgress.create({
      data: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        platformRole: role,
        overallStatus: "IN_PROGRESS",
      },
    });
  }

  const userFull = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { phoneVerifiedAt: true },
  });
  const storedSteps = await prisma.onboardingStepProgress.findMany({
    where: { userId: ctx.userId, tenantId: ctx.tenantId, deletedAt: null, completed: true },
    select: { stepKey: true },
  });
  const completedKeys = new Set(storedSteps.map((item) => item.stepKey));
  if (userFull?.phoneVerifiedAt) completedKeys.add("phone_verified");
  const allComplete = steps.filter((step) => isRequiredStep(step, role)).every((step) => completedKeys.has(step));
  const newStatus = allComplete ? "COMPLETED" : "IN_PROGRESS";

  await prisma.onboardingProgress.update({
    where: { id: progress.id },
    data: { overallStatus: newStatus, completedAt: allComplete ? new Date() : null },
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
    oliv_activated: "Review financing eligibility and partner terms",
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
