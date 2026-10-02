import Link from "next/link";
import { Nav } from "@/components/v2/nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="shell" style={{ minHeight: "55vh", display: "grid", alignContent: "center", paddingTop: 56, paddingBottom: 56 }}>
        <div className="eyebrow">Page not found</div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-.05em", margin: "12px 0" }}>This route is not available.</h1>
        <p className="muted" style={{ maxWidth: 620, lineHeight: 1.7 }}>The page may have moved or may not be part of the current HotelsVendors release. No blank page, fake workflow or placeholder data is shown.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link className="btn btn-blue" href="/">Return home</Link>
          <Link className="btn btn-dark" href="/platform">Explore the platform</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
