import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Archivo, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const bodyFont = Source_Sans_3({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: 'variable' });
const displayFont = Archivo({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: 'variable' });
export const metadata: Metadata = {
  title: 'HotelsVendors — Hospitality Business Network & Market Compass',
  description: 'Connect hotels, suppliers, carriers and external funders. The Market Compass surfaces evidence-backed procurement leaks, savings and commercial opportunities across the hospitality network.',
  openGraph: {
    title: 'HotelsVendors — Hospitality Business Network & Market Compass',
    description: 'Evidence-backed procurement signals, savings opportunities and commercial connections across the hospitality network.',
    type: 'website',
    url: 'https://www.hotelsvendors.com',
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider localization={{signIn:{start:{title:"Sign in to HotelsVendors",titleCombined:"Sign in to HotelsVendors"}},signUp:{start:{title:"Join HotelsVendors",titleCombined:"Join HotelsVendors"}}}}><html lang="en"><body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body></html></ClerkProvider>}
