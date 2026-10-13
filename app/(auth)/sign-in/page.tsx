import { redirect } from "next/navigation";
export default function SignInPage() {
  redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login");
}
