import { redirect } from "next/navigation";
export default function SignUpPage() {
  redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/register");
}
