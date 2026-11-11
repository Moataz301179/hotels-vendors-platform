import { Suspense } from "react";
import { AuthContinueClient } from "@/components/v2/auth-continue-client";

/**
 * Clerk finishes here only after the browser session is loaded. The handoff
 * route calls getOnboardingActor() and sends a new hotel or vendor to
 * onboarding, an active user to the requested workspace, and a session with
 * no workspace to the organization choice. It does not return them to sign in.
 */
export default function AuthContinue() {
  return <Suspense fallback={<main className="hv-auth-page"><p className="hv-clerk-loading" role="status"><span />Opening your workspace…</p></main>}><AuthContinueClient /></Suspense>;
}
