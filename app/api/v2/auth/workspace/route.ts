import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getOnboardingActor } from "@/lib/v2-auth";

const publicRoles = ["HOTEL", "SUPPLIER"] as const;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const body = await request.json().catch(() => null) as { role?: unknown } | null;
  const role = body?.role;
  if (role !== "HOTEL" && role !== "SUPPLIER") return NextResponse.json({ error: "WORKSPACE_ROLE_REQUIRED" }, { status: 400 });

  const existing = await getOnboardingActor();
  if (existing) {
    return NextResponse.json({ href: existing.status === "PENDING_VERIFICATION" ? "/onboarding" : "/dashboard" });
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { unsafeMetadata: { platformRole: role } });
  const created = await getOnboardingActor();
  if (!created || !publicRoles.includes(created.platformRole as typeof publicRoles[number])) {
    return NextResponse.json({ error: "WORKSPACE_NOT_CREATED" }, { status: 409 });
  }
  return NextResponse.json({ href: "/onboarding" });
}
