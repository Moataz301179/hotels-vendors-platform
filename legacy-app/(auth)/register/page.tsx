import Link from "next/link";
import { ArrowRight, Building2, Store, Truck, Landmark } from "lucide-react";

const roles = [
  { key: "HOTEL", label: "Hotel", description: "Turn procurement activity into savings and decisions.", icon: Building2 },
  { key: "SUPPLIER", label: "Supplier", description: "Find qualified hotel demand and commercial opportunities.", icon: Store },
  { key: "CARRIER", label: "Carrier", description: "Receive and fulfill hospitality delivery opportunities.", icon: Truck },
  { key: "FUNDER", label: "Funder", description: "Receive qualified funding signals from the network.", icon: Landmark },
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f7] dark:bg-[#0b0d10] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <div className="text-xl font-semibold text-[#232831] dark:text-white">HotelsVendors</div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Choose your network role</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">HotelsVendors connects Hotels, Suppliers, Carriers and Funders around real procurement evidence and commercial workflows.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map(({ key, label, description, icon: Icon }) => (
            <Link key={key} href={`/sign-up?role=${key}`} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg dark:border-slate-800 dark:bg-[#12161c]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Icon size={21} /></div>
                <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link className="font-medium text-blue-500 hover:text-blue-600" href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
