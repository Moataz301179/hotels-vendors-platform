import { redirect } from "next/navigation";

// Preserve legacy bookmarks while using the current server-scoped supplier workspace.
export default function LegacySupplierPage() {
  redirect("/supplier/catalog");
}
