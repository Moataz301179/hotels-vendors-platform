import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Archivo, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const bodyFont = Source_Sans_3({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: 'variable' });
const displayFont = Archivo({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: 'variable' });
export const metadata: Metadata = {
  metadataBase: new URL('https://www.hotelsvendors.com'),
  title: {
    default: 'HotelsVendors | Hospitality Procurement Network',
    template: '%s | HotelsVendors',
  },
  description: 'HotelsVendors helps hospitality teams bring purchasing demand together, source suppliers, compare quotes and review evidence-backed procurement opportunities.',
  openGraph: {
    title: 'HotelsVendors | Hospitality Procurement Network',
    description: 'A hospitality procurement network for bringing purchasing demand together, sourcing suppliers and reviewing commercial opportunities.',
    type: 'website',
    url: '/',
    siteName: 'HotelsVendors',
    images: [{ url: '/hero-clean.jpeg', width: 1920, height: 1080, alt: 'Hotel suite representing the HotelsVendors hospitality network' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HotelsVendors | Hospitality Procurement Network',
    description: 'Bring hotel demand together, source suppliers and review procurement opportunities.',
    images: ['/hero-clean.jpeg'],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider localization={{signIn:{start:{title:"Sign in to HotelsVendors",titleCombined:"Sign in to HotelsVendors"}},signUp:{start:{title:"Join HotelsVendors",titleCombined:"Join HotelsVendors"}}}}><html lang="en"><body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body></html></ClerkProvider>}
