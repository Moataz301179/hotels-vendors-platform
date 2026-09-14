import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/oliv/referral") },
};

export default function OlivReferralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
