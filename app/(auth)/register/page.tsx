"use client";

import { useEffect, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Store } from "lucide-react";
import { getCsrfToken } from "@/lib/security/csrf-client";
import { ClerkRegistration } from "../../../components/auth/clerk-registration";

type PlatformRole = "HOTEL" | "SUPPLIER";
const roles = [
  ["HOTEL", "Hotel", Building2, "Buy goods and services"],
  ["SUPPLIER", "Supplier", Store, "Supply hotels"],
] as const;

function authErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  if ("longMessage" in error && typeof error.longMessage === "string" && error.longMessage) return error.longMessage;
  if ("message" in error && typeof error.message === "string" && error.message) return error.message;
  return fallback;
}

export default function RegisterPage() {
  const { signUp, fetchStatus } = useSignUp();
  const isLoaded = Boolean(signUp) && fetchStatus !== "fetching";
  const hasClerkConfiguration = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const router = useRouter();
  const [role, setRole] = useState<PlatformRole>("HOTEL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [needsProvisioningRetry, setNeedsProvisioningRetry] = useState(false);
  const [error, setError] = useState("");
  const [oauthContinuation, setOauthContinuation] = useState(false);
  useEffect(() => {
    const update = () => setOauthContinuation(window.location.hash.startsWith("#/continue") || window.location.hash.startsWith("#/sso-callback"));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !isLoaded) return;
    setPending(true); setError("");
    try {
      const created = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.trim().split(" ")[0],
        lastName: name.trim().split(" ").slice(1).join(" ") || undefined,
        unsafeMetadata: { platformRole: role, companyName: name.trim() },
      });
      if (created.error) throw created.error;
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) throw sent.error;
      setNeedsVerification(true);
    } catch (err: unknown) {
      setError(authErrorMessage(err, "Unable to create the account."));
    } finally { setPending(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !isLoaded) return;
    setPending(true); setError("");
    try {
      const verified = await signUp.verifications.verifyEmailCode({ code });
      if (verified.error) throw verified.error;
      if (signUp.status !== "complete") {
        setError("Verification is not complete yet. Follow the email verification steps.");
        return;
      }
      const finalized = await signUp.finalize();
      if (finalized.error) throw finalized.error;

      const syncResponse = await fetch("/api/v1/auth/clerk-sync", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() } });
      const syncResult = await syncResponse.json().catch(() => null);
      if (!syncResponse.ok || syncResult?.ok !== true) {
        setNeedsProvisioningRetry(true);
        setError(syncResult?.error || "Your email is verified, but workspace setup is incomplete. Please retry.");
        return;
      }
      router.replace("/onboarding");
    } catch (err: unknown) {
      setError(authErrorMessage(err, "Verification failed."));
    } finally { setPending(false); }
  };

  const retryWorkspaceSetup = async () => {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/clerk-sync", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() } });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        setError(result?.error || "Workspace setup is still incomplete. Please retry.");
        return;
      }
      router.replace("/onboarding");
    } catch {
      setError("Could not reach workspace setup. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  };

  if (oauthContinuation) return <ClerkRegistration />;

  if (!hasClerkConfiguration) {
    return (
      <section aria-labelledby="register-title" className="w-full rounded-2xl bg-[#f4f2ec] p-4 sm:p-6 text-[#314b43]">
        <div className="w-full max-w-2xl">
          <h1 id="register-title" className="text-3xl font-semibold">Join the procurement network</h1>
          <div role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            Registration is temporarily unavailable because the workspace authentication service is not configured. Please contact support and include code <code className="font-semibold">AUTH_CONFIG_MISSING</code>.
          </div>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">Return to HotelsVendors</Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="register-title" className="w-full rounded-2xl bg-[#f4f2ec] p-4 sm:p-6 text-[#314b43]">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">HotelsVendors</Link>
          <h1 id="register-title" className="mt-4 text-3xl font-semibold">Join the procurement network</h1>
          <p className="mt-2 text-[#566961] text-sm leading-relaxed">Choose how you work with hotels, then create your account. Already registered? <Link href="/login" className="font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Sign in</Link>.</p>
        </div>
        {!needsVerification ? (
          <form onSubmit={submit} aria-busy={pending} className="rounded-2xl border border-[#d9ded9] bg-white p-5 md:p-7 space-y-5">
            <fieldset>
              <legend className="block text-sm font-semibold mb-3">I am joining as</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map(([value, label, Icon, description]) => (
                  <button type="button" key={value} aria-pressed={role === value} onClick={() => setRole(value)} className={`min-h-28 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#314b43] ${role===value ? "border-[#314b43] bg-[#edf1ed] text-[#314b43]" : "border-[#d9ded9] text-[#566961] hover:border-[#314b43]"}`}>
                    <Icon size={18} aria-hidden="true" className="mb-2" /><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-relaxed">{description}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#566961]">Funder and carrier partners: <Link href="/contact" className="font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">contact the team</Link> to discuss partner onboarding. Selecting a role does not grant workspace access.</p>
            </fieldset>
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-semibold">Your name or company name</label>
              <input id="register-name" name="name" required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-[#c6cfc8] bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#314b43]" />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-semibold">Work email</label>
              <input id="register-email" name="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-[#c6cfc8] bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#314b43]" />
            </div>
            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm font-semibold">Password</label>
              <input id="register-password" name="password" required minLength={8} type="password" autoComplete="new-password" aria-describedby="register-password-help" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-[#c6cfc8] bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#314b43]" />
              <p id="register-password-help" className="mt-2 text-xs text-[#566961]">Use at least 8 characters.</p>
            </div>
            <p className="text-sm leading-relaxed text-[#566961]">Next, verify your email with a code and continue to organization setup. Registration does not guarantee supplier approval, credit or financing.</p>
            <div id="clerk-captcha" />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={pending || !isLoaded} className="w-full rounded-xl bg-[#314b43] hover:bg-[#263c35] text-white font-semibold py-3.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314b43]">{pending ? "Creating…" : "Create account"}</button>
          </form>
        ) : (
          <form onSubmit={verify} aria-busy={pending} className="rounded-2xl border border-[#d9ded9] bg-white p-5 md:p-7 space-y-5">
            <h2 className="text-xl font-semibold">Verify your email</h2>
            <p className="text-sm text-[#566961]">We sent a verification code to {email}.</p>
            <div>
              <label htmlFor="register-code" className="mb-2 block text-sm font-semibold">Verification code</label>
              <input id="register-code" name="code" required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} className="w-full rounded-xl border border-[#c6cfc8] bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#314b43]" />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {needsProvisioningRetry ? (
              <button type="button" onClick={retryWorkspaceSetup} disabled={pending} className="w-full rounded-xl bg-[#314b43] hover:bg-[#263c35] text-white font-semibold py-3.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314b43]">{pending ? "Retrying setup…" : "Retry workspace setup"}</button>
            ) : (
              <button disabled={pending} className="w-full rounded-xl bg-[#314b43] hover:bg-[#263c35] text-white font-semibold py-3.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314b43]">{pending ? "Verifying…" : "Verify and continue"}</button>
            )}
          </form>
        )}
        <nav aria-label="Registration help and policies" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-[#566961]">
          <Link href="/privacy" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Privacy</Link>
          <Link href="/terms" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Terms</Link>
          <Link href="/contact" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Contact</Link>
          <Link href="/support" className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Help with signup</Link>
        </nav>
      </div>
    </section>
  );
}
