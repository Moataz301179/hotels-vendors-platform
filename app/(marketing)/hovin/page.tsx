import Link from "next/link";
import { DownloadQR } from "@/components/marketing/download-qr";

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL;
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL;

export const metadata = {
  title: "HOVIN mobile release",
  description: "Verified HOVIN mobile installation options for hospitality procurement teams.",
};

export default function HovinDownloadPage() {
  return (
    <div className="mobile-release-page">
      <section className="mobile-release-hero">
        <div className="shell mobile-release-hero-grid">
          <div>
            <p className="eyebrow">HOVIN · mobile workspace</p>
            <h1>Procurement work that travels with the property.</h1>
            <p className="mobile-release-lead">Use HOVIN for receiving evidence, order follow-up and field approvals. This page is the single QR destination while store listings are being prepared.</p>
            <div className="mobile-release-actions"><Link href="/login" className="btn btn-blue">Use the web workspace</Link><Link href="/" className="btn btn-ghost">Back to HotelsVendors</Link></div>
          </div>
          <div className="mobile-release-qr"><DownloadQR value="https://www.hotelsvendors.com/hovin" size={196} label="Scan from another device"/><span className="mobile-release-status">Release links are shown only when configured and verified.</span></div>
        </div>
      </section>
      <section className="mobile-release-options shell" aria-labelledby="mobile-release-options-title">
        <div className="mobile-release-heading"><p className="eyebrow">Install options</p><h2 id="mobile-release-options-title">Choose your device.</h2><p>Do not install an unsigned or unverified build. If a platform link is not shown, use the web workspace until the signed release is published.</p></div>
        <div className="mobile-release-cards">
          <article className="mobile-release-card"><span className="mobile-release-kicker">Android</span><h3>Android package</h3><p>{androidUrl ? "A signed Android package is available for download." : "No signed Android package has been published yet."}</p>{androidUrl ? <a className="btn btn-blue" href={androidUrl}>Download Android app</a> : <Link className="btn btn-ghost" href="/contact">Request Android access</Link>}</article>
          <article className="mobile-release-card"><span className="mobile-release-kicker">iOS</span><h3>iPhone and iPad</h3><p>{iosUrl ? "A verified iOS distribution link is available." : "No TestFlight or App Store link has been published yet."}</p>{iosUrl ? <a className="btn btn-blue" href={iosUrl}>Open iOS release</a> : <Link className="btn btn-ghost" href="/contact">Request iOS access</Link>}</article>
        </div>
      </section>
    </div>
  );
}
