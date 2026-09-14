"use client";

/* DownloadQR — renders a real scannable QR code (qrcode lib, client-side) for
   the HOVIN mobile app. Target is the /hovin page until the App Store / Play
   Store listings are published; we do not invent store IDs. */
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function DownloadQR({
  value,
  size = 132,
  label,
}: {
  value: string;
  size?: number;
  label?: string;
}) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} width={size} height={size} alt="QR code to download the HOVIN app" />
        ) : (
          <div style={{ width: size, height: size }} className="bg-slate-100 rounded-lg" />
        )}
      </div>
      {label ? <span className="text-[10px] font-medium text-[#646367]">{label}</span> : null}
    </div>
  );
}