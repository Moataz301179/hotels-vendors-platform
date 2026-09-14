import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function S({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IcSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>;
export const IcCart = (p: P) => <S {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M2.5 3.5h3l2.6 12.5h10.4l2-8.5H7" /></S>;
export const IcBox = (p: P) => <S {...p}><path d="M12 2.8 21 7.5v9L12 21.2 3 16.5v-9L12 2.8Z" /><path d="M3.3 7.6 12 12l8.7-4.4M12 12v9" /></S>;
export const IcTruck = (p: P) => <S {...p}><path d="M1.5 6h13v11h-13zM14.5 10h4l3 3.5V17h-7" /><circle cx="6" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" /></S>;
export const IcInvoice = (p: P) => <S {...p}><path d="M6 2.8h9l4 4v14.4H6z" /><path d="M14.5 2.8V7H19M9 12h6M9 15.5h6M9 8.5h2.5" /></S>;
export const IcShield = (p: P) => <S {...p}><path d="M12 2.8 20 6v6c0 5-3.4 8.3-8 9.7C7.4 20.3 4 17 4 12V6l8-3.2Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></S>;
export const IcBuilding = (p: P) => <S {...p}><path d="M4 21V4.5L12 2.5l8 2V21" /><path d="M2.5 21h19M9 7h1.5M13.5 7H15M9 10.5h1.5M13.5 10.5H15M9 14h1.5M13.5 14H15M10 21v-3.5h4V21" /></S>;
export const IcUsers = (p: P) => <S {...p}><circle cx="9" cy="8" r="3.4" /><path d="M2.8 20c.6-3.6 3.1-5.4 6.2-5.4s5.6 1.8 6.2 5.4" /><path d="M15.5 4.9a3.4 3.4 0 0 1 0 6.2M17.6 14.9c2 .7 3.3 2.3 3.7 4.6" /></S>;
export const IcChart = (p: P) => <S {...p}><path d="M3.5 3.5v17h17" /><path d="M7.5 16.5v-5M12 16.5V8M16.5 16.5v-8.5" /></S>;
export const IcGear = (p: P) => <S {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.6v2.6M12 18.8v2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M2.6 12h2.6M18.8 12h2.6M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8" /></S>;
export const IcChevD = (p: P) => <S {...p}><path d="m6 9 6 6 6-6" /></S>;
export const IcX = (p: P) => <S {...p}><path d="M5 5l14 14M19 5 5 19" /></S>;
export const IcPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IcMinus = (p: P) => <S {...p}><path d="M5 12h14" /></S>;
export const IcCheck = (p: P) => <S {...p}><path d="m4.5 12.5 5 5 10-11" /></S>;
export const IcAlert = (p: P) => <S {...p}><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9.5v4.5M12 17.2v.1" /></S>;
export const IcClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.4 2" /></S>;
export const IcGlobe = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5Z" /></S>;
export const IcSun = (p: P) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></S>;
export const IcMoon = (p: P) => <S {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></S>;
export const IcMenu = (p: P) => <S {...p}><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" /></S>;
export const IcArrow = (p: P) => <S {...p}><path d="M4 12h16M13 5l7 7-7 7" /></S>;
export const IcEye = (p: P) => <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></S>;
export const IcPen = (p: P) => <S {...p}><path d="M4 20h4L20 8l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></S>;
export const IcLayers = (p: P) => <S {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5" /></S>;
export const IcWarehouse = (p: P) => <S {...p}><path d="M3 20V8.5L12 3.5l9 5V20" /><path d="M7 20v-8h10v8M7 16h10" /></S>;
export const IcCal = (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="16" rx="1.5" /><path d="M3.5 9.5h17M8 2.8V6M16 2.8V6" /></S>;
export const IcLock = (p: P) => <S {...p}><rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" /></S>;
export const IcOut = (p: P) => <S {...p}><path d="M14.5 8V5.5h-11v13h11V16M9.5 12h11M17.5 8.5 21 12l-3.5 3.5" /></S>;
export const IcGrid = (p: P) => <S {...p}><rect x="3.5" y="3.5" width="7" height="7" /><rect x="13.5" y="3.5" width="7" height="7" /><rect x="3.5" y="13.5" width="7" height="7" /><rect x="13.5" y="13.5" width="7" height="7" /></S>;
export const IcPin = (p: P) => <S {...p}><path d="M12 21.5S5 14.8 5 9.8a7 7 0 0 1 14 0c0 5-7 11.7-7 11.7Z" /><circle cx="12" cy="9.8" r="2.6" /></S>;
export const IcPhone = (p: P) => <S {...p}><path d="M5 3.5h4l1.5 4.5-2.3 1.7a12 12 0 0 0 6.1 6.1l1.7-2.3 4.5 1.5v4a1.5 1.5 0 0 1-1.6 1.5C9.6 20 4 14.4 3.5 5.1A1.5 1.5 0 0 1 5 3.5Z" /></S>;
export const IcMail = (p: P) => <S {...p}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="m3.5 7 8.5 6 8.5-6" /></S>;
export const IcCard = (p: P) => <S {...p}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 9.5h19M6 15h4" /></S>;
export const IcScale = (p: P) => <S {...p}><path d="M12 3.5v17M8 20.5h8M12 5.5 5.5 7.5m6.5-2 6.5 2" /><path d="M5.5 7.5 3 13.5a2.8 2.8 0 0 0 5 0L5.5 7.5ZM18.5 7.5 16 13.5a2.8 2.8 0 0 0 5 0l-2.5-6Z" /></S>;
export const IcHistory = (p: P) => <S {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 3.5v5h5M12 7.5V12l3 2" /></S>;
export const IcDoc = (p: P) => <S {...p}><path d="M6 2.8h9l4 4v14.4H6z" /><path d="M14.5 2.8V7H19" /></S>;
export const IcThermo = (p: P) => <S {...p}><path d="M10 4a2 2 0 0 1 4 0v9.5a4.5 4.5 0 1 1-4 0V4Z" /><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" /></S>;
export const IcStamp = (p: P) => <S {...p}><path d="M9.5 10.5 9 4.5h6l-.5 6" /><path d="M5 14.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V17H5v-2.5ZM4 20.5h16" /></S>;
export const IcSpark = (p: P) => <S {...p}><path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13l-6.5-2L10 9l2-6.5Z" /></S>;
export const IcHand = (p: P) => <S {...p}><path d="M7 11.5V5.8a1.6 1.6 0 0 1 3.2 0v4.9m0-6.4a1.6 1.6 0 0 1 3.2 0v6.2m0-4.6a1.6 1.6 0 0 1 3.2 0v6.9" /><path d="M16.6 13.6l1.7-2a1.6 1.6 0 0 1 2.5 2L16 19.4c-1.4 1.7-3 2.6-5.3 2.6-3.9 0-5.7-2-7.2-5.7L2.6 13a1.6 1.6 0 0 1 2.9-1.3l1.5 3" /></S>;
export const IcReceipt = (p: P) => <S {...p}><path d="M6 2.8h12V21l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21V2.8Z" /><path d="M9 8h6M9 11.5h6M9 15h4" /></S>;
export const IcFilter = (p: P) => <S {...p}><path d="M3.5 5.5h17l-6.5 8v5.5l-4 2v-7.5l-6.5-8Z" /></S>;
export const IcInfo = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.8v.1" /></S>;
export const IcRefresh = (p: P) => <S {...p}><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1L20.5 8" /><path d="M20.5 3.5v4.5h-4.5" /></S>;

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="currentColor" />
      <path d="M8 7v18M8 16l8-9M16 7l8 9M24 7v18" stroke="var(--color-brass-400)" strokeWidth="2.4" strokeLinecap="square" fill="none" />
    </svg>
  );
}
