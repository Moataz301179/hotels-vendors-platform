import { redirect } from "next/navigation";

// Compliance runs in the background; invoice status remains in the invoice workspace.
export default function LegacyCompliancePage() {
  redirect("/invoices");
}
