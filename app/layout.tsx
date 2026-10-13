import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/language-context';

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
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider localization={{signIn:{start:{title:"Sign in to HotelsVendors",titleCombined:"Sign in to HotelsVendors"}},signUp:{start:{title:"Join HotelsVendors",titleCombined:"Join HotelsVendors"}}}}><html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html></ClerkProvider>}
