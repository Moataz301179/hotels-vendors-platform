"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Building2, Store, Landmark, Truck } from "lucide-react";

type PlatformRole = "HOTEL" | "SUPPLIER" | "FACTORING" | "SHIPPING";
const roles = [
  ["HOTEL", "Hotel", Building2],
  ["SUPPLIER", "Supplier", Store],
  ["FACTORING", "Funder", Landmark],
  ["SHIPPING", "Carrier", Truck],
] as const;

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [role, setRole] = useState<PlatformRole>("HOTEL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setPending(true); setError("");
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.trim().split(" ")[0],
        lastName: name.trim().split(" ").slice(1).join(" ") || undefined,
        unsafeMetadata: { platformRole: role, companyName: name.trim() },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNeedsVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || "Unable to create the account.");
    } finally { setPending(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setPending(true); setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        await fetch("/api/v1/auth/clerk-sync", { method: "POST" });
        router.replace("/onboarding");
      } else {
        setError("Verification is not complete yet. Follow the email verification steps.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || "Verification failed.");
    } finally { setPending(false); }
  };

  return (
    <main className="min-h-screen bg-[#0c0c12] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-white text-2xl font-semibold tracking-tight">HotelsVendors</div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Create your workspace</h1>
          <p className="mt-2 text-white/50 text-sm">Clerk-secured identity for hotels, suppliers, funders and carriers.</p>
        </div>
        {!needsVerification ? (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">I am joining as</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {roles.map(([value, label, Icon]) => (
                  <button type="button" key={value} onClick={() => setRole(value)} className={`rounded-xl border p-3 text-left transition ${role===value ? "border-[#3b82f6] bg-[#3b82f6]/10 text-white" : "border-white/10 text-white/50 hover:border-white/20"}`}>
                    <Icon size={18} className="mb-2" /><span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name / company name" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#3b82f6]" />
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Work email" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#3b82f6]" />
            <input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#3b82f6]" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={pending || !isLoaded} className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-semibold py-3.5 disabled:opacity-50">{pending ? "Creating…" : "Create account"}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-5">
            <h2 className="text-xl font-semibold text-white">Verify your email</h2>
            <p className="text-sm text-white/50">We sent a verification code to {email}.</p>
            <input required inputMode="numeric" value={code} onChange={e=>setCode(e.target.value)} placeholder="Verification code" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#3b82f6]" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={pending} className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-white font-semibold py-3.5 disabled:opacity-50">{pending ? "Verifying…" : "Verify and continue"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
