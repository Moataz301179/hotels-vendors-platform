import { redirect } from "next/navigation";
import { getActor } from "@/lib/v2-auth";
import { safeReturnPath } from "@/lib/auth/return-path";

type ContinuePageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

/**
 * Every Clerk completion returns here first. It creates the local HOTEL or
 * SUPPLIER application record when appropriate, sends pending registrations
 * to onboarding, and only then releases active users to their requested page.
 */
export default async function AuthContinue({ searchParams }: ContinuePageProps) {
  const user = await getActor({ allowPending: true });
  if (!user) redirect("/login");

  if (user.status === "PENDING_VERIFICATION") redirect("/onboarding");

  const params = await searchParams;
  redirect(safeReturnPath(params.returnTo));
}
