import Image from 'next/image';

/** Shared wordmark for public pages, authentication and workspaces. */
export function Brand() {
  return <span className="hv-brand-lockup"><Image src="/logo-icon.svg" alt="" width={32} height={38} /><span>HOTELSVENDORS<small>THE HOSPITALITY NETWORK</small></span></span>;
}
