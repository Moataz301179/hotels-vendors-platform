import Link from "next/link";
import { PROCUREMENT_JOURNEY } from "@/lib/marketing/procurement-journey";

/**
 * Honest HOVIN install block. Store badges appear only when verified
 * distribution URLs are configured. Until then, point to the receiving
 * workspace and the public HOVIN release page — never invent store listings.
 */
const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL;
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL;

export function DownloadHovinApp() {
  const hasRelease = Boolean(androidUrl || iosUrl);

  return (
    <div className="hv-hovin-download">
      <p className="hv-hovin-download-kicker">HOVIN field companion</p>
      <strong>Receiving at the point of delivery</strong>
      <p>
        HOVIN records delivered quantities against an authorized purchase order. It does not place
        orders, show vendor prices, or invent store availability.
      </p>
      {hasRelease ? (
        <div className="hv-hovin-download-actions">
          {androidUrl ? (
            <a className="btn btn-blue" href={androidUrl}>
              Download Android package
            </a>
          ) : null}
          {iosUrl ? (
            <a className="btn btn-blue" href={iosUrl}>
              Open iOS release
            </a>
          ) : null}
        </div>
      ) : (
        <div className="hv-hovin-download-actions">
          <Link href={PROCUREMENT_JOURNEY.receivingLogin.href} className="btn btn-blue">
            {PROCUREMENT_JOURNEY.receivingLogin.label}
          </Link>
          <Link href={PROCUREMENT_JOURNEY.hovin.href} className="btn btn-ghost">
            HOVIN release status
          </Link>
        </div>
      )}
      {!hasRelease ? (
        <span className="hv-hovin-download-status">
          No signed App Store or Play distribution is published yet. Use the web receiving workspace
          with a hotel receiving role.
        </span>
      ) : null}
    </div>
  );
}
