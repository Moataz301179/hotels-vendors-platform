import { redirect } from "next/navigation";

export default function LegacyTaxPage() {
  redirect("/invoices");
}
