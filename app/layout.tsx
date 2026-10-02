import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
export const metadata:Metadata={title:'HotelsVendors — Your Virtual Shadow for Smarter Procurement',description:'Evidence-led procurement intelligence connecting Hotels, Suppliers, Carriers and Funders.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider><html lang="en"><body>{children}</body></html></ClerkProvider>}
