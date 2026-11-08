import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Redirecting…",
  // Redirect stubs are not content pages and must not compete in the index.
  // The former target (/demand-aggregation) is an authenticated workspace route
  // with no public equivalent, so visitors are sent to the public platform page.
  robots: { index: false, follow: false },
};

export default function Redirect() {
  redirect("/platform");
}
