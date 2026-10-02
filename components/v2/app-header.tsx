'use client';
import Link from 'next/link';import {UserButton} from '@clerk/nextjs';
export function AppHeader(){return <header className="app-top"><Link href="/" className="brand" style={{display:'flex',alignItems:'center'}}><img src="/logo-white.svg" alt="HotelsVendors" style={{width:154,height:32,objectFit:'contain'}} /></Link><div style={{display:'flex',alignItems:'center',gap:14}}><Link href="/intelligence" style={{fontSize:13,color:'#bfc5ce'}}>Virtual Shadow</Link><Link href="/marketplace" style={{fontSize:13,color:'#bfc5ce'}}>Marketplace</Link><UserButton/></div></header>}
