import { redirect } from "next/navigation";
import { getOnboardingActor } from "@/lib/v2-auth";
import { safeReturnPath } from "@/lib/auth/return-path";

type ContinuePageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

/**
 * Every Clerk completion returns here first. It creates the local HOTEL or
 * SUPPLIER application record when appropriate, sends pending registrations
 * to onboarding, and only then releases active users to their requested page.
 *
 * This is the ONLY caller of getOnboardingActor, which is why a user still
 * completing their profile can reach the onboarding step instead of looping
 * back to login. It is not a general bypass: every protected operational API
 * and dashboard still resolves the actor through getActor, which rejects
 * PENDING_VERIFICATION users.
 */
export default async function AuthContinue({ searchParams }: ContinuePageProps) {
  const user = await getOnboardingActor();
  if (!user) redirect("/login");

  if (user.status === "PENDING_VERIFICATION") redirect("/onboarding");

  const params = await searchParams;
  redirect(safeReturnPath(params.returnTo));
}
