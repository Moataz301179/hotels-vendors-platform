/**
 * "Download the HOVIN App" block — official App Store / Google Play badges.
 * Anchors point to real store listings once published; until then they link to
 * the HOVIN page. NO-FAKE-DATA: no invented download counts or ratings.
 */
const APP_STORE_URL = "https://hotelsvendors.com/hovin"; // swap for real store id when live
const PLAY_URL = "https://hotelsvendors.com/hovin";

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.84.93-2.22 1.64-3.35 1.56-.14-1.1.4-2.27 1.05-2.99.82-.92 2.3-1.54 3.42-1.55ZM20.53 17.13c-.55 1.26-1.17 2.42-2.12 3.67-.83 1.1-1.69 2.2-3.05 2.2-1.24 0-1.63-.76-3.03-.76-1.47 0-1.92.78-3.05.78-1.37.06-2.32-1.19-3.15-2.28-1.65-2.2-2.92-5.17-2.92-8.15 0-4.22 2.74-6.46 5.42-6.46 1.3 0 2.36.65 3.22.65.83 0 2.12-.79 3.65-.79 2.44 0 3.67 1.71 3.67 1.71s-2.12 1.03-2.12 3.42c0 2.62 2.22 3.5 2.22 3.5s-1.62 4.7-3.79 4.7c-.88 0-1.55-.46-2.38-.46-.97 0-1.71.53-2.87.53Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.61 1.81 13.79 12 3.61 22.19c-.37-.34-.61-.85-.61-1.47V3.28c0-.62.24-1.13.61-1.47Zm17.42 7.78-4.06 2.41 4.06 2.41c.4-.66.64-1.44.64-2.41s-.24-1.75-.64-2.41Zm-4.55-2.7-9.86-5.85 8.92 8.92 3.57-2.12-2.63-1.6v.65Z" />
    </svg>
  );
}

export function DownloadHovinApp() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="text-sm font-semibold text-[#4D4A46] mb-1">Download the HOVIN App</div>
      <p className="text-xs text-[#646367] mb-4">
        Suppliers, carriers &amp; dock teams — run fulfillment from your phone.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download HOVIN App on the Apple App Store"
          className="inline-flex items-center gap-2.5 bg-[#111827] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <AppleIcon />
          <span className="text-left leading-tight">
            <span className="block text-[9px] uppercase tracking-wide opacity-70">Download on the</span>
            <span className="block text-sm font-semibold">App Store</span>
          </span>
        </a>
        <a
          href={PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get HOVIN App on Google Play"
          className="inline-flex items-center gap-2.5 bg-[#111827] text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <PlayIcon />
          <span className="text-left leading-tight">
            <span className="block text-[9px] uppercase tracking-wide opacity-70">Get it on</span>
            <span className="block text-sm font-semibold">Google Play</span>
          </span>
        </a>
      </div>
    </div>
  );
}