import Image from "next/image";
import Link from "next/link";
import { HovinStoreBadges } from "@/components/marketing/hovin-store-badges";

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL;
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL;

export const metadata = {
  title: "HOVIN mobile companion",
  description: "HOVIN by HotelsVendors — field receiving for hospitality procurement teams.",
};

export default function HovinDownloadPage() {
  return (
    <div className="mobile-release-page">
      <section className="hovin-brand-hero" aria-labelledby="hovin-brand-title">
        <div className="shell hovin-brand-hero-grid">
          <div className="hovin-brand-copy">
            <Image
              src="/brand/hovin/wordmark.jpg"
              alt="HOVIN"
              width={280}
              height={98}
              className="hovin-brand-wordmark"
              priority
            />
            <p className="eyebrow">HOVIN · by HotelsVendors</p>
            <h1 id="hovin-brand-title">Receiving at the point of delivery.</h1>
            <p className="mobile-release-lead">
              HOVIN is the field layer for checking delivered quantities, recording discrepancies, and attaching
              receipt evidence against the order. It checks the delivery. It does not place the order.
            </p>
            <div className="mobile-release-actions">
              <Link href="/login?redirect_url=%2Forders%3Fview%3Dreceiving" className="btn btn-blue">
                Open receiving in the workspace
              </Link>
              <Link href="/about" className="btn btn-ghost">
                How an order is recorded
              </Link>
            </div>
            <div className="hovin-store-row">
              <Image
                src="/brand/hovin/app-icon.jpg"
                alt="HOVIN app icon"
                width={64}
                height={64}
                className="hovin-app-icon"
              />
              <div>
                <p className="hovin-store-caption">Get the companion app</p>
                <HovinStoreBadges />
                <span className="mobile-release-status hovin-store-note">
                  {androidUrl || iosUrl
                    ? "Store links open the verified distribution path."
                    : "App Store and Google Play icons are ready. Signed release links appear here after verification."}
                </span>
              </div>
            </div>
          </div>
          <figure className="hovin-brand-visual">
            <Image
              src="/brand/hovin/product-trio.jpg"
              alt="HOVIN product screens: delivery verification, splash with download QR, and procurement catalogue"
              width={1408}
              height={768}
              className="hovin-product-trio"
              priority
            />
            <figcaption>
              Scan the QR on the splash phone to open this HOVIN page from another device.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mobile-release-options shell" aria-labelledby="mobile-release-options-title">
        <div className="mobile-release-heading">
          <p className="eyebrow">Release availability</p>
          <h2 id="mobile-release-options-title">iOS and Android.</h2>
          <p>Each installation link is shown only after its signed build and distribution path are verified.</p>
        </div>
        <div className="mobile-release-cards">
          <article className="mobile-release-card">
            <span className="mobile-release-kicker">iOS</span>
            <h3>iPhone and iPad</h3>
            <p>
              {iosUrl
                ? "A verified iOS distribution link is available."
                : "No TestFlight or App Store link has been published yet. The web workspace remains available."}
            </p>
            {iosUrl ? (
              <a className="btn btn-blue" href={iosUrl}>
                Open iOS release
              </a>
            ) : (
              <span className="mobile-release-status">Not published</span>
            )}
          </article>
          <article className="mobile-release-card">
            <span className="mobile-release-kicker">Android</span>
            <h3>Android package</h3>
            <p>
              {androidUrl
                ? "A signed Android package is available for download."
                : "No signed Android package has been published yet. The web workspace remains available."}
            </p>
            {androidUrl ? (
              <a className="btn btn-blue" href={androidUrl}>
                Download Android app
              </a>
            ) : (
              <span className="mobile-release-status">Not published</span>
            )}
          </article>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                It checks the delivery.
                <br />
                <em>It does not place the order.</em>
              </h2>
            </div>
            <p>
              The web workspace creates and approves the purchase. HOVIN is the phone companion for the hotel team that
              meets the delivery.
            </p>
          </div>
          <div className="hv-platform-principles">
            <div>
              <span>01</span>
              <strong>See the delivery</strong>
              <p>A receivable order appears only after it is in transit and a payment guarantee is recorded.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Count what arrived</strong>
              <p>The receiver confirms quantities and records a difference against the order lines.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Leave the commercial decision</strong>
              <p>Vendor identity, prices and invoices stay in the authorized web workspace.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
