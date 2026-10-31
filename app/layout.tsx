import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/language-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.hotelsvendors.com'),
  title: {
    default: 'HOTELSVENDORS | Hospitality Procurement Network',
    template: '%s | HOTELSVENDORS',
  },
  description: 'HOTELSVENDORS helps hospitality teams bring purchasing demand together, source suppliers, compare quotes and review evidence-backed procurement opportunities.',
  openGraph: {
    title: 'HOTELSVENDORS | Hospitality Procurement Network',
    description: 'A hospitality procurement network for bringing purchasing demand together, sourcing suppliers and reviewing commercial opportunities.',
    type: 'website',
    url: '/',
    siteName: 'HOTELSVENDORS',
    images: [{ url: '/hero-clean.jpeg', width: 1920, height: 1080, alt: 'Hotel suite representing the HOTELSVENDORS hospitality network' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HOTELSVENDORS | Hospitality Procurement Network',
    description: 'Bring hotel demand together, source suppliers and review procurement opportunities.',
    images: ['/hero-clean.jpeg'],
  },
};
export default async function RootLayout({children}:{children:React.ReactNode}){
  // `dynamic` makes Clerk read the nonce forwarded by proxy.ts and attach it
  // to the Clerk bootstrap script. This is required by our strict-dynamic CSP.
  return <html lang="en"><body><ClerkProvider dynamic localization={{signIn:{start:{title:"Sign in to HOTELSVENDORS",titleCombined:"Sign in to HOTELSVENDORS"}},signUp:{start:{title:"Join HOTELSVENDORS",titleCombined:"Join HOTELSVENDORS"}}}}><LanguageProvider>{children}</LanguageProvider></ClerkProvider></body></html>
}
