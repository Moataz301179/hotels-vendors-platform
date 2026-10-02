import { SignUp } from "@clerk/nextjs";
import { notFound } from "next/navigation";

const roles = new Set(["HOTEL", "SUPPLIER", "CARRIER", "FUNDER"]);

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role = "HOTEL" } = await searchParams;
  const selectedRole = roles.has(role) ? role : "HOTEL";
  return (
    <main className="min-h-screen bg-[#f5f6f7] dark:bg-[#0b0d10] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-[#232831] dark:text-white">HotelsVendors</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your {selectedRole.toLowerCase()} workspace.</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          fallbackRedirectUrl={`/auth-complete?role=${selectedRole}`}
          unsafeMetadata={{ hvRole: selectedRole }}
          appearance={{
            variables: { colorPrimary: "#3b82f6", borderRadius: "0.75rem" },
            elements: { card: "shadow-xl border border-slate-200 dark:border-slate-800" },
          }}
        />
      </div>
    </main>
  );
}
