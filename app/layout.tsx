import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
export const metadata: Metadata = {
  title: 'HotelsVendors — Hospitality Business Network & Virtual Shadow',
  description: 'Connect hotels, suppliers, carriers and external funders. The Virtual Shadow surfaces evidence-backed procurement leaks, savings and commercial opportunities across the hospitality network.',
  openGraph: {
    title: 'HotelsVendors — Hospitality Business Network & Virtual Shadow',
    description: 'Evidence-backed procurement signals, savings opportunities and commercial connections across the hospitality network.',
    type: 'website',
    url: 'https://www.hotelsvendors.com',
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider><html lang="en"><body>{children}</body></html></ClerkProvider>}
