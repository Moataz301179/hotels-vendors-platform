import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { decideHandoff } from "@/lib/auth/handoff";
import { getOnboardingActor } from "@/lib/v2-auth";
import { resolveCreditAccess } from "@/lib/credit/workspace-access";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(decideHandoff({ signedIn: false, actor: null, publicRoleDeclared: false }));
  const [actor, clerkUser] = await Promise.all([getOnboardingActor(), currentUser()]);
  const requestedRole = String(clerkUser?.unsafeMetadata?.platformRole || "").toUpperCase();
  let creditLineActive: boolean | undefined;
  if (actor && actor.status === "ACTIVE" && (actor.platformRole === "HOTEL" || actor.platformRole === "SUPPLIER")) {
    const access = await resolveCreditAccess(actor);
    creditLineActive = access.stage === "active";
  }
  const decision = decideHandoff({
    signedIn: true,
    actor: actor ? { status: actor.status, platformRole: actor.platformRole } : null,
    publicRoleDeclared: requestedRole === "HOTEL" || requestedRole === "SUPPLIER",
    returnTo: new URL(request.url).searchParams.get("returnTo"),
    creditLineActive,
  });
  return NextResponse.json(decision);
}
