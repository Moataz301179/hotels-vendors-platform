import Link from "next/link";
import { DownloadQR } from "@/components/marketing/download-qr";
import { HovinReceivingPreview } from "@/components/marketing/hovin-receiving-preview";
import { PROCUREMENT_JOURNEY } from "@/lib/marketing/procurement-journey";

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL;
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL;
const installUrl = androidUrl || iosUrl || "https://www.hotelsvendors.com/hovin";
const qrIsInstall = Boolean(androidUrl || iosUrl);

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
            <h1>Receiving at the point of delivery.</h1>
            <p className="mobile-release-lead">
              HOVIN is the field layer for checking delivered quantities, recording discrepancies and
              attaching receipt evidence against the authorized purchase order. Installation links appear
              here only after a signed mobile release is verified.
            </p>
            <div className="mobile-release-actions">
              <Link href={PROCUREMENT_JOURNEY.receivingLogin.href} className="btn btn-blue">
                {PROCUREMENT_JOURNEY.receivingLogin.label}
              </Link>
              <Link href={PROCUREMENT_JOURNEY.catalogue.href} className="btn btn-ghost">
                Back to the catalogue
              </Link>
            </div>
          </div>
          <div className="mobile-release-qr">
            <DownloadQR
              value={installUrl}
              size={196}
              label={qrIsInstall ? "Scan to install HOVIN" : "Scan for HOVIN release status"}
              alt={
                qrIsInstall
                  ? "QR code for the verified HOVIN installation link"
                  : "QR code for the HOVIN release status page"
              }
            />
            <span className="mobile-release-status">
              {qrIsInstall
                ? "This QR opens a verified installation path."
                : "No signed store release is configured. The QR opens this status page, not a store listing."}
            </span>
          </div>
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
            <span className="mobile-release-kicker">Android</span>
            <h3>Android package</h3>
            <p>
              {androidUrl
                ? "A signed Android package is available for download."
                : "No signed Android package has been published yet. The web receiving workspace remains available."}
            </p>
            {androidUrl ? (
              <a className="btn btn-blue" href={androidUrl}>
                Download Android app
              </a>
            ) : (
              <span className="mobile-release-status">Not published</span>
            )}
          </article>
          <article className="mobile-release-card">
            <span className="mobile-release-kicker">iOS</span>
            <h3>iPhone and iPad</h3>
            <p>
              {iosUrl
                ? "A verified iOS distribution link is available."
                : "No TestFlight or App Store link has been published yet. The web receiving workspace remains available."}
            </p>
            {iosUrl ? (
              <a className="btn btn-blue" href={iosUrl}>
                Open iOS release
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
              The web workspace creates and approves the purchase. HOVIN is the phone companion for the hotel
              team that meets the delivery. Vendor identity, prices and invoices stay in the authorized web
              workspace.
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
              <strong>Use a receiving role</strong>
              <p>
                Hotel OWNER, GM, FINANCIAL_CONTROLLER or RECEIVING_CLERK can record a receipt. A default
                department-head login receives RECEIVING_ROLE_REQUIRED.
              </p>
            </div>
          </div>
          <div className="hv-public-actions" style={{ marginTop: 28 }}>
            <Link href={PROCUREMENT_JOURNEY.receivingLogin.href} className="btn btn-blue">
              Continue in web receiving
            </Link>
            <Link href="/about" className="hv-public-text-link">
              How an order is recorded
            </Link>
          </div>
        </div>
      </section>

      <section className="hv-public-alt-section" aria-labelledby="hovin-preview-title">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <p className="eyebrow">Interactive preview</p>
              <h2 id="hovin-preview-title">The field workflow before a signed release.</h2>
            </div>
            <p>
              This preview explains the hotel receiving path. It is not a live goods-receipt record and it does
              not publish a store install.
            </p>
          </div>
          <HovinReceivingPreview />
        </div>
      </section>
    </div>
  );
}
