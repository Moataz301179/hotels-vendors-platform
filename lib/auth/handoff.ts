import { safeReturnPath } from "@/lib/auth/return-path";

export type HandoffActor = { status: string; platformRole?: string } | null;

/**
 * Decides where a completed Clerk session goes. A signed-in person without a
 * hotel or vendor workspace must choose one. They are not sent back to sign in.
 *
 * Active hotel/supplier sessions land on credit-line legibility first unless a
 * safe return path was requested. Full purchasing still requires a funder-
 * approved facility (enforced by credit-line APIs and quote accept).
 */
export function decideHandoff(input: {
  signedIn: boolean;
  actor: HandoffActor;
  publicRoleDeclared: boolean;
  returnTo?: string | null;
  creditLineActive?: boolean;
}) {
  if (!input.signedIn) return { href: "/login?redirect_url=%2Fauth%2Fcontinue" };
  if (input.actor?.status === "PENDING_VERIFICATION") return { href: "/onboarding" };
  if (input.actor) {
    const role = input.actor.platformRole;
    const needsCreditGate =
      (role === "HOTEL" || role === "SUPPLIER") && input.creditLineActive !== true;
    if (needsCreditGate && !input.returnTo) return { href: "/credit-line" };
    return { href: safeReturnPath(input.returnTo) };
  }
  return { href: input.publicRoleDeclared ? "/register?choose=1&reason=unlinked" : "/register?choose=1" };
}
