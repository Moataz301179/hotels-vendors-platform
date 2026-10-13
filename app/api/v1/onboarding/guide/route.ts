import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const GUIDE_KEY = "assistant_discovery";
const guideSchema = z.object({
  currentStep: z.number().int().min(0).max(3).default(0),
  answers: z.record(z.string(), z.string().max(300)).default({}),
  dismissed: z.boolean().default(false),
  completed: z.boolean().default(false),
});

async function getWorkspace() {
  const { userId } = await auth();
  if (!userId) return null;
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true, platformRole: true },
  });
}

export async function GET() {
  try {
    const user = await getWorkspace();
    if (!user) return NextResponse.json({ ok: false, error: "Authenticated workspace required" }, { status: 401 });
    const progress = await prisma.onboardingStepProgress.findUnique({
      where: { userId_stepKey: { userId: user.id, stepKey: GUIDE_KEY } },
      select: { tenantId: true, completed: true, data: true, updatedAt: true },
    });
    if (progress && progress.tenantId !== user.tenantId) {
      return NextResponse.json({ ok: false, error: "Workspace scope mismatch" }, { status: 403 });
    }
    return NextResponse.json({ ok: true, role: user.platformRole, progress: progress?.data ?? null, completed: progress?.completed ?? false });
  } catch (error) {
    console.error("[onboarding-guide] Failed to load progress", error);
    return NextResponse.json({ ok: false, error: "Could not load guided setup" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getWorkspace();
    if (!user) return NextResponse.json({ ok: false, error: "Authenticated workspace required" }, { status: 401 });
    const parsed = guideSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid guide progress" }, { status: 400 });

    const saved = await prisma.onboardingStepProgress.upsert({
      where: { userId_stepKey: { userId: user.id, stepKey: GUIDE_KEY } },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        stepKey: GUIDE_KEY,
        completed: parsed.data.completed,
        data: { ...parsed.data, role: user.platformRole },
      },
      update: {
        completed: parsed.data.completed,
        data: { ...parsed.data, role: user.platformRole },
        deletedAt: null,
      },
      select: { completed: true, data: true, updatedAt: true },
    });
    return NextResponse.json({ ok: true, progress: saved.data, completed: saved.completed, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error("[onboarding-guide] Failed to save progress", error);
    return NextResponse.json({ ok: false, error: "Could not save guided setup" }, { status: 500 });
  }
}
