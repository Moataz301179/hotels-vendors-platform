import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Hotels Vendors | Founder & CEO",
  description: "Meet Moataz Abdel Ghani, Founder & CEO of Hotels Vendors. Big 4 background, hospitality expertise, and the vision behind Egypt's digital procurement hub.",
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
