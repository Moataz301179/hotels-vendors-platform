import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Redirecting…",
  // Redirect stubs are not content pages and must not compete in the index.
  robots: { index: false, follow: false },
};

export default function Redirect() {
  redirect("/carriers/portal");
}
