import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { decideHandoff } from "@/lib/auth/handoff";
import { getOnboardingActor } from "@/lib/v2-auth";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(decideHandoff({ signedIn: false, actor: null, publicRoleDeclared: false }));
  const [actor, clerkUser] = await Promise.all([getOnboardingActor(), currentUser()]);
  const requestedRole = String(clerkUser?.unsafeMetadata?.platformRole || "").toUpperCase();
  const decision = decideHandoff({
    signedIn: true,
    actor: actor ? { status: actor.status } : null,
    publicRoleDeclared: requestedRole === "HOTEL" || requestedRole === "SUPPLIER",
    returnTo: new URL(request.url).searchParams.get("returnTo"),
  });
  return NextResponse.json(decision);
}
