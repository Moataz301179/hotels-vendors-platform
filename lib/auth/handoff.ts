import { safeReturnPath } from "@/lib/auth/return-path";

export type HandoffActor = { status: string } | null;

/**
 * Decides where a completed Clerk session goes. A signed-in person without a
 * hotel or vendor workspace must choose one. They are not sent back to sign in.
 */
export function decideHandoff(input: {
  signedIn: boolean;
  actor: HandoffActor;
  publicRoleDeclared: boolean;
  returnTo?: string | null;
}) {
  if (!input.signedIn) return { href: "/login?redirect_url=%2Fauth%2Fcontinue" };
  if (input.actor?.status === "PENDING_VERIFICATION") return { href: "/onboarding" };
  if (input.actor) return { href: safeReturnPath(input.returnTo) };
  return { href: input.publicRoleDeclared ? "/register?choose=1&reason=unlinked" : "/register?choose=1" };
}
