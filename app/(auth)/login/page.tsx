import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f7] dark:bg-[#0b0d10] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold text-[#232831] dark:text-white">HotelsVendors</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your Virtual Shadow for smarter procurement.</p>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: { colorPrimary: "#3b82f6", borderRadius: "0.75rem" },
            elements: { card: "shadow-xl border border-slate-200 dark:border-slate-800" },
          }}
        />
      </div>
    </main>
  );
}
