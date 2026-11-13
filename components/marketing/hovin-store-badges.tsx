/**
 * Official-style App Store / Google Play badges for the HOVIN marketing section.
 * Links use verified env URLs when set; otherwise they stay on /hovin.
 * No invented ratings, download counts, or store listing IDs.
 */

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL || "/hovin";
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL || "/hovin";
const androidLive = Boolean(process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL);
const iosLive = Boolean(process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL);

function AppleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.84.93-2.22 1.64-3.35 1.56-.14-1.1.4-2.27 1.05-2.99.82-.92 2.3-1.54 3.42-1.55ZM20.53 17.13c-.55 1.26-1.17 2.42-2.12 3.67-.83 1.1-1.69 2.2-3.05 2.2-1.24 0-1.63-.76-3.03-.76-1.47 0-1.92.78-3.05.78-1.37.06-2.32-1.19-3.15-2.28-1.65-2.2-2.92-5.17-2.92-8.15 0-4.22 2.74-6.46 5.42-6.46 1.3 0 2.36.65 3.22.65.83 0 2.12-.79 3.65-.79 2.44 0 3.67 1.71 3.67 1.71s-2.12 1.03-2.12 3.42c0 2.62 2.22 3.5 2.22 3.5s-1.62 4.7-3.79 4.7c-.88 0-1.55-.46-2.38-.46-.97 0-1.71.53-2.87.53Z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M3.6 1.8 13.8 12 3.6 22.2c-.37-.34-.61-.85-.61-1.47V3.28c0-.62.24-1.13.61-1.48Z" />
      <path fill="#FBBC04" d="m13.79 12 3.57-2.12 4.06 2.41c.4-.66.64-1.44.64-2.41s-.24-1.75-.64-2.41l-4.06 2.41L13.79 12Z" />
      <path fill="#4285F4" d="M13.79 12 3.61 22.19c.2.18.45.29.72.29.3 0 .58-.1.82-.27L17.36 14.1 13.79 12Z" />
      <path fill="#34A853" d="m17.36 9.89-3.57 2.12 3.57 2.12 4.55-2.7c-.4-.66-.64-1.44-.64-2.41 0-.97.24-1.75.64-2.41l-4.55 2.7Z" />
    </svg>
  );
}

export function HovinStoreBadges({ className }: { className?: string }) {
  return (
    <div className={className ?? "hovin-store-badges"} role="group" aria-label="HOVIN app store links">
      <a
        href={iosUrl}
        className="hovin-store-badge"
        aria-label={iosLive ? "Download HOVIN on the App Store" : "HOVIN iOS release — opens the HOVIN page until the App Store listing is verified"}
        {...(iosLive ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <AppleMark />
        <span>
          <small>Download on the</small>
          <strong>App Store</strong>
        </span>
      </a>
      <a
        href={androidUrl}
        className="hovin-store-badge"
        aria-label={androidLive ? "Get HOVIN on Google Play" : "HOVIN Android release — opens the HOVIN page until the Play listing is verified"}
        {...(androidLive ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <PlayMark />
        <span>
          <small>Get it on</small>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}
