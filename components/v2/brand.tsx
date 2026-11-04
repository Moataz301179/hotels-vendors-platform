import Image from 'next/image';

/** Shared wordmark for public pages, authentication and workspaces. */
export function Brand() {
  return <span className="hv-brand-lockup"><Image src="/logo-nav-dark.svg" alt="HOTELS VENDORS — THE MARKET CHANGER" width={183} height={42} /></span>;
}
