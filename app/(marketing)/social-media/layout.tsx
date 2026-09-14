import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Media — Hotels Vendors",
  description:
    "Connect with Hotels Vendors on social media. Follow our journey building Egypt's first smart hospitality procurement platform.",
};

export default function SocialMediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
