import { redirect } from "next/navigation";

/** /storefront — legacy alias, now served at the canonical /marketplace route. */
export default function StorefrontRedirect() {
  redirect("/marketplace");
}
