"use client";

import { SignUp } from "@clerk/nextjs";

export function ClerkRegistration() {
  return (
    <section aria-label="Create your HotelsVendors account" className="shell hv-clerk-wrap">
      <SignUp
        routing="hash"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={{ variables: { colorPrimary: "#356fb6", colorBackground: "#fbfbf8", borderRadius: "3px" } }}
      />
    </section>
  );
}
