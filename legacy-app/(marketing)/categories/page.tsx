import { redirect } from "next/navigation";

/** /categories — removed as a standalone page. The marketplace is the single
    catalog destination. This route redirects there. */
export default function CategoriesRedirect() {
  redirect("/marketplace");
}