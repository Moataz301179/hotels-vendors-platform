"use client";

/* DownloadQR — scannable QR for HOVIN. Target is the verified install URL when
   configured; otherwise the public HOVIN info page. Never invent store IDs. */
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function DownloadQR({
  value,
  size = 132,
  label,
  alt = "QR code for the HOVIN receiving page",
}: {
  value: string;
  size?: number;
  label?: string;
  alt?: string;
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
    <div className="hv-download-qr">
      <div className="hv-download-qr-frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} width={size} height={size} alt={alt} />
        ) : (
          <div className="hv-download-qr-placeholder" style={{ width: size, height: size }} aria-hidden="true" />
        )}
      </div>
      {label ? <span className="hv-download-qr-label">{label}</span> : null}
    </div>
  );
}
